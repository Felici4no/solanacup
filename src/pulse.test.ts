import { describe, it, expect } from 'vitest'
import {
  eventsInRange,
  sequenceStats,
  formatStats,
  findSequenceForMinute,
  nearestEvent,
  stepMoment,
  castVote,
  INITIAL_VOTE,
  ordinal,
  eventLabel,
  layoutEvents,
  pulseMatch,
  pulseAnnotations,
  createAnnotation,
  shareWithCommunity,
  promoteToMemory,
  anchorLabel,
  resolveAnchor,
  annotationsForAnchor,
  stepImportant,
  clampMinute,
  densitySamples,
  densityAt,
  peakMinute,
  densityPhrase,
  defaultCursor,
  maxMinuteFor,
  LIVE_MINUTE,
  majorEvents,
  shouldAskQuestion,
  focusedRange,
  type Anchor,
} from './pulse'

const E = pulseMatch.events
const S = pulseMatch.sequences

describe('sequence grouping', () => {
  it('collects the Argentina siege sequence (82–85)', () => {
    const inRange = eventsInRange(E, 82, 85)
    expect(inRange.map((e) => e.id)).toEqual(['e82', 'e83', 'e84', 'e85'])
  })

  it('counts event types within a sequence', () => {
    const stats = sequenceStats(eventsInRange(E, 82, 85))
    expect(stats.shot).toBe(1)
    expect(stats.save).toBe(1)
    expect(stats.chance).toBe(1)
    expect(stats.goal).toBe(1)
    expect(stats.card).toBe(0)
  })

  it('formats stats as readable, singular/plural aware fragments', () => {
    expect(formatStats(sequenceStats(eventsInRange(E, 82, 85)))).toEqual([
      '1 shot', '1 save', '1 chance', '1 goal',
    ])
  })

  it('maps a minute to the sequence that contains it', () => {
    expect(findSequenceForMinute(83, S)?.id).toBe('arg-siege')
    expect(findSequenceForMinute(38, S)?.id).toBe('yellow-spell')
  })

  it('returns null for minutes outside any sequence', () => {
    expect(findSequenceForMinute(20, S)).toBeNull()
    expect(findSequenceForMinute(90, S)).toBeNull() // the winner stands alone
  })

  it('finds the nearest event to an arbitrary minute (drag/scrub)', () => {
    expect(nearestEvent(50, E).id).toBe('e51')
    expect(nearestEvent(87, E).id).toBe('e85')
    expect(nearestEvent(0, E).id).toBe('e36')
  })
})

describe('timeline layout (de-collision)', () => {
  it('keeps a minimum gap between clustered moments', () => {
    const { positions, width } = layoutEvents(E, 520, 54, 30)
    expect(positions).toHaveLength(E.length)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x - positions[i - 1].x).toBeGreaterThanOrEqual(54 - 0.001)
    }
    expect(width).toBeGreaterThan(positions[positions.length - 1].x)
  })
  it('orders positions by minute', () => {
    const ids = layoutEvents(E).positions.map((p) => p.id)
    expect(ids[0]).toBe('e36')
    expect(ids[ids.length - 1]).toBe('e90')
  })
})

describe('moment stepping', () => {
  it('moves forward and backward in minute order', () => {
    expect(stepMoment(E, 'e85', 1)).toBe('e90')
    expect(stepMoment(E, 'e85', -1)).toBe('e84')
  })
  it('clamps at the ends (no wrap)', () => {
    expect(stepMoment(E, 'e90', 1)).toBe('e90')
    expect(stepMoment(E, 'e36', -1)).toBe('e36')
  })
})

describe('voting state', () => {
  it('starts hidden and unanswered', () => {
    expect(INITIAL_VOTE).toEqual({ choice: null, revealed: false })
  })
  it('reveals the aggregate only after a vote is cast', () => {
    const after = castVote(INITIAL_VOTE, 'yes')
    expect(after).toEqual({ choice: 'yes', revealed: true })
  })
  it('records a changed answer', () => {
    const a = castVote(INITIAL_VOTE, 'yes')
    const b = castVote(a, 'no')
    expect(b).toEqual({ choice: 'no', revealed: true })
  })
  it('accepts all three choices', () => {
    expect(castVote(INITIAL_VOTE, 'unsure').choice).toBe('unsure')
  })
})

describe('accessibility labels', () => {
  it('formats ordinals', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(87)).toBe('87th')
  })
  it('builds a full event label', () => {
    const winner = E.find((e) => e.id === 'e90')!
    expect(eventLabel(winner)).toBe('90th minute, goal by Lautaro Martínez, community impact 4.9 out of 5')
  })
  it('describes cards with their colour', () => {
    const card = E.find((e) => e.id === 'e41')!
    expect(eventLabel(card)).toBe('41st minute, yellow card by Lisandro Martínez, community impact 2.7 out of 5')
  })
})

/* ============================================================ TEMPORAL ANNOTATIONS */
describe('annotation model', () => {
  it('is private by default and stamps a created time + id', () => {
    const a = createAnnotation({ anchorType: 'time', minute: 74, text: 'x' }, { now: 1000, id: 'z1' })
    expect(a.visibility).toBe('private')
    expect(a.createdAt).toBe(1000)
    expect(a.id).toBe('z1')
    expect(a.author).toBe('You')
  })
  it('can be explicitly shared with the community', () => {
    const a = createAnnotation({ anchorType: 'event', minute: 85, eventId: 'e85', text: 'x' })
    expect(a.visibility).toBe('private')
    expect(shareWithCommunity(a).visibility).toBe('community')
  })
  it('promotes a live annotation into the permanent memory', () => {
    const live = pulseAnnotations.find((a) => a.id === 'an-mine85')!
    expect(live.keptInMemory).toBeUndefined()
    expect(promoteToMemory(live).keptInMemory).toBe(true)
  })
})

describe('anchors', () => {
  it('resolves an event anchor when the cursor sits on an event', () => {
    const a = resolveAnchor(85, false, E, S)
    expect(a.type).toBe('event')
    expect(a.type === 'event' && a.eventId).toBe('e85')
  })
  it('resolves a time anchor when no event exists at that minute', () => {
    const a = resolveAnchor(74, false, E, S)
    expect(a.type).toBe('time')
    expect(a.minute).toBe(74)
  })
  it('resolves a sequence anchor when the range is focused', () => {
    const a = resolveAnchor(83, true, E, S)
    expect(a.type).toBe('sequence')
    expect(a.type === 'sequence' && a.sequenceId).toBe('arg-siege')
    expect(a.type === 'sequence' && a.endMinute).toBe(85)
  })
  it('labels each anchor type in human language', () => {
    expect(anchorLabel(resolveAnchor(85, false, E, S))).toBe('85’ · Goal · Enzo Fernández')
    expect(anchorLabel(resolveAnchor(74, false, E, S))).toBe('74th minute')
    expect(anchorLabel(resolveAnchor(83, true, E, S))).toBe('Argentina siege · 82’–85’')
  })
})

describe('annotationsForAnchor', () => {
  it('event anchor gathers event-anchored and same-minute time notes', () => {
    const anchor = resolveAnchor(85, false, E, S)
    const ids = annotationsForAnchor(pulseAnnotations, anchor).map((a) => a.id)
    expect(ids).toContain('an-85a')
    expect(ids).toContain('an-mine85')
    expect(ids).not.toContain('an-90a')
  })
  it('time anchor gathers only that minute’s time notes', () => {
    const anchor: Anchor = { type: 'time', minute: 74 }
    const ids = annotationsForAnchor(pulseAnnotations, anchor).map((a) => a.id)
    expect(ids).toEqual(['an-74'])
  })
  it('sequence anchor gathers everything inside the range', () => {
    const anchor = resolveAnchor(83, true, E, S) // arg-siege 82–85
    const ids = annotationsForAnchor(pulseAnnotations, anchor).map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['an-seq', 'an-84', 'an-85a', 'an-mine85']))
    expect(ids).not.toContain('an-74')
  })
})

describe('cursor movement', () => {
  it('steps to the next / previous important event', () => {
    expect(stepImportant(E, 83, 1)).toBe(84)
    expect(stepImportant(E, 84, -1)).toBe(83)
    expect(stepImportant(E, 41, 1)).toBe(51)
  })
  it('clamps at the ends', () => {
    expect(stepImportant(E, 90, 1)).toBe(90)
    expect(stepImportant(E, 36, -1)).toBe(36)
  })
  it('clampMinute rounds and bounds', () => {
    expect(clampMinute(83.4, 0, 90)).toBe(83)
    expect(clampMinute(-5, 0, 90)).toBe(0)
    expect(clampMinute(120, 0, 90)).toBe(90)
  })
})

describe('community density', () => {
  const samples = densitySamples(E, pulseAnnotations)
  it('is normalised to a 0–1 range', () => {
    expect(Math.max(...samples.map((s) => s.value))).toBeCloseTo(1, 5)
    expect(Math.min(...samples.map((s) => s.value))).toBeGreaterThanOrEqual(0)
  })
  it('peaks in the decisive late passage', () => {
    expect(peakMinute(samples)).toBeGreaterThan(60)
  })
  it('reads density in calm human language, not numbers', () => {
    expect(densityPhrase(0.9)).toMatch(/conversation peaked/)
    expect(densityPhrase(0.1)).toMatch(/quiet/)
    expect(densityAt(samples, 12)).toBeLessThan(densityAt(samples, 85))
  })
})

describe('two-level timeline helpers', () => {
  it('overview keeps only the major (goal) events', () => {
    const majors = majorEvents(E)
    expect(majors.map((e) => e.minute)).toEqual([55, 85, 90])
    expect(majors.every((e) => e.type === 'goal')).toBe(true)
  })
  it('expands a focused range for a clustered sequence', () => {
    const f = focusedRange(83, S, E)
    expect(f?.sequenceId).toBe('arg-siege')
    expect(f?.start).toBe(82)
    expect(f?.end).toBe(85)
  })
  it('does not expand a focused range in a quiet minute', () => {
    expect(focusedRange(20, S, E)).toBeNull()
  })
  it('asks a question only when meaningful', () => {
    expect(shouldAskQuestion(resolveAnchor(83, true, E, S))).toBe(true) // sequence
    expect(shouldAskQuestion(resolveAnchor(85, false, E, S))).toBe(true) // goal
    expect(shouldAskQuestion(resolveAnchor(51, false, E, S))).toBe(false) // card
    expect(shouldAskQuestion(resolveAnchor(70, false, E, S))).toBe(false) // bare minute
  })
})

describe('live vs post', () => {
  it('defaults the live cursor to the current match minute', () => {
    expect(defaultCursor('live', E)).toBe(LIVE_MINUTE)
    expect(maxMinuteFor('live')).toBe(LIVE_MINUTE)
  })
  it('defaults the post cursor to the decisive moment and allows free scrubbing', () => {
    expect(defaultCursor('post', E)).toBe(90)
    expect(maxMinuteFor('post')).toBe(90)
  })
})
