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
  it('collects the São Paulo pressure sequence (78–84)', () => {
    const inRange = eventsInRange(E, 78, 84)
    expect(inRange.map((e) => e.id)).toEqual(['e78', 'e79', 'e80', 'e81', 'e82', 'e83', 'e84'])
  })

  it('counts event types within a sequence', () => {
    const stats = sequenceStats(eventsInRange(E, 78, 84))
    expect(stats.shot).toBe(3)
    expect(stats.save).toBe(1)
    expect(stats.corner).toBe(2)
    expect(stats.goal).toBe(1)
    expect(stats.card).toBe(0)
  })

  it('formats stats as readable, singular/plural aware fragments', () => {
    expect(formatStats(sequenceStats(eventsInRange(E, 78, 84)))).toEqual([
      '3 shots', '1 save', '2 corners', '1 goal',
    ])
  })

  it('maps a minute to the sequence that contains it', () => {
    expect(findSequenceForMinute(82, S)?.id).toBe('sp-pressure')
    expect(findSequenceForMinute(38, S)?.id).toBe('river-strike')
  })

  it('returns null for minutes outside any sequence', () => {
    expect(findSequenceForMinute(20, S)).toBeNull()
    expect(findSequenceForMinute(87, S)).toBeNull() // the winner stands alone
  })

  it('finds the nearest event to an arbitrary minute (drag/scrub)', () => {
    expect(nearestEvent(50, E).id).toBe('e51')
    expect(nearestEvent(85, E).id).toBe('e84')
    expect(nearestEvent(0, E).id).toBe('e12')
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
    expect(ids[0]).toBe('e12')
    expect(ids[ids.length - 1]).toBe('e87')
  })
})

describe('moment stepping', () => {
  it('moves forward and backward in minute order', () => {
    expect(stepMoment(E, 'e84', 1)).toBe('e87')
    expect(stepMoment(E, 'e84', -1)).toBe('e83')
  })
  it('clamps at the ends (no wrap)', () => {
    expect(stepMoment(E, 'e87', 1)).toBe('e87')
    expect(stepMoment(E, 'e12', -1)).toBe('e12')
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
    const winner = E.find((e) => e.id === 'e87')!
    expect(eventLabel(winner)).toBe('87th minute, goal by Calleri, community impact 4.8 out of 5')
  })
  it('describes cards with their colour', () => {
    const card = E.find((e) => e.id === 'e12')!
    expect(eventLabel(card)).toBe('12th minute, yellow card by Rivero, community impact 2.3 out of 5')
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
    const a = createAnnotation({ anchorType: 'event', minute: 84, eventId: 'e84', text: 'x' })
    expect(a.visibility).toBe('private')
    expect(shareWithCommunity(a).visibility).toBe('community')
  })
  it('promotes a live annotation into the permanent memory', () => {
    const live = pulseAnnotations.find((a) => a.id === 'an-mine84')!
    expect(live.keptInMemory).toBeUndefined()
    expect(promoteToMemory(live).keptInMemory).toBe(true)
  })
})

describe('anchors', () => {
  it('resolves an event anchor when the cursor sits on an event', () => {
    const a = resolveAnchor(84, false, E, S)
    expect(a.type).toBe('event')
    expect(a.type === 'event' && a.eventId).toBe('e84')
  })
  it('resolves a time anchor when no event exists at that minute', () => {
    const a = resolveAnchor(74, false, E, S)
    expect(a.type).toBe('time')
    expect(a.minute).toBe(74)
  })
  it('resolves a sequence anchor when the range is focused', () => {
    const a = resolveAnchor(81, true, E, S)
    expect(a.type).toBe('sequence')
    expect(a.type === 'sequence' && a.sequenceId).toBe('sp-pressure')
    expect(a.type === 'sequence' && a.endMinute).toBe(84)
  })
  it('labels each anchor type in human language', () => {
    expect(anchorLabel(resolveAnchor(84, false, E, S))).toBe('84’ · Goal · Luciano')
    expect(anchorLabel(resolveAnchor(74, false, E, S))).toBe('74th minute')
    expect(anchorLabel(resolveAnchor(81, true, E, S))).toBe('São Paulo pressure · 78’–84’')
  })
})

describe('annotationsForAnchor', () => {
  it('event anchor gathers event-anchored and same-minute time notes', () => {
    const anchor = resolveAnchor(84, false, E, S)
    const ids = annotationsForAnchor(pulseAnnotations, anchor).map((a) => a.id)
    expect(ids).toContain('an-84a')
    expect(ids).toContain('an-mine84')
    expect(ids).not.toContain('an-87a')
  })
  it('time anchor gathers only that minute’s time notes', () => {
    const anchor: Anchor = { type: 'time', minute: 74 }
    const ids = annotationsForAnchor(pulseAnnotations, anchor).map((a) => a.id)
    expect(ids).toEqual(['an-74'])
  })
  it('sequence anchor gathers everything inside the range', () => {
    const anchor = resolveAnchor(80, true, E, S) // sp-pressure 78–84
    const ids = annotationsForAnchor(pulseAnnotations, anchor).map((a) => a.id)
    expect(ids).toEqual(expect.arrayContaining(['an-seq', 'an-81', 'an-84a', 'an-mine84']))
    expect(ids).not.toContain('an-74')
  })
})

describe('cursor movement', () => {
  it('steps to the next / previous important event', () => {
    expect(stepImportant(E, 83, 1)).toBe(84)
    expect(stepImportant(E, 84, -1)).toBe(83)
    expect(stepImportant(E, 40, 1)).toBe(51)
  })
  it('clamps at the ends', () => {
    expect(stepImportant(E, 87, 1)).toBe(87)
    expect(stepImportant(E, 12, -1)).toBe(12)
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
    expect(majors.map((e) => e.minute)).toEqual([40, 84, 87])
    expect(majors.every((e) => e.type === 'goal')).toBe(true)
  })
  it('expands a focused range for a clustered sequence', () => {
    const f = focusedRange(81, S, E)
    expect(f?.sequenceId).toBe('sp-pressure')
    expect(f?.start).toBe(78)
    expect(f?.end).toBe(84)
  })
  it('does not expand a focused range in a quiet minute', () => {
    expect(focusedRange(20, S, E)).toBeNull()
  })
  it('asks a question only when meaningful', () => {
    expect(shouldAskQuestion(resolveAnchor(80, true, E, S))).toBe(true) // sequence
    expect(shouldAskQuestion(resolveAnchor(84, false, E, S))).toBe(true) // goal
    expect(shouldAskQuestion(resolveAnchor(82, false, E, S))).toBe(false) // corner
    expect(shouldAskQuestion(resolveAnchor(70, false, E, S))).toBe(false) // bare minute
  })
})

describe('live vs post', () => {
  it('defaults the live cursor to the current match minute', () => {
    expect(defaultCursor('live', E)).toBe(LIVE_MINUTE)
    expect(maxMinuteFor('live')).toBe(LIVE_MINUTE)
  })
  it('defaults the post cursor to the decisive moment and allows free scrubbing', () => {
    expect(defaultCursor('post', E)).toBe(87)
    expect(maxMinuteFor('post')).toBe(90)
  })
})
