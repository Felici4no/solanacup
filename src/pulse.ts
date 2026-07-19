import type { MatchData } from './MatchCover'

/* ============================================================
   Match Pulse — how a match was experienced, moment by moment.
   Information model: Match → Phase → Sequence → Moment.
   Pure logic here is unit-tested (pulse.test.ts).
   ============================================================ */

export type EventType = 'goal' | 'save' | 'shot' | 'chance' | 'card' | 'sub' | 'corner'
export type Side = 'home' | 'away'

export type Question = { text: string; agreePct: number; votes: number }

export type PulseEvent = {
  id: string
  minute: number
  type: EventType
  player?: string
  team: Side
  phase: 'First half' | 'Second half'
  impact: number // community impact 0.5–5
  cardType?: 'yellow' | 'red'
  decisive?: boolean
  question: Question
}

export type Sequence = {
  id: string
  name: string
  phase: 'First half' | 'Second half'
  start: number
  end: number
  team?: Side
  question: Question
}

export type Annotation = { anchor: string; name: string; mono: string; text: string; tag?: string }

export type PulseMatch = MatchData & {
  events: PulseEvent[]
  sequences: Sequence[]
  annotations: Record<string, Annotation[]>
}

/* ============================================================
   TEMPORAL ANNOTATIONS — event / time / sequence anchored.
   Annotations live inside the time of the match, not below it.
   ============================================================ */
export type AnchorType = 'event' | 'time' | 'sequence'
export type Visibility = 'private' | 'community'

export type TemporalAnnotation = {
  id: string
  matchId: string
  anchorType: AnchorType
  minute: number
  endMinute?: number
  eventId?: string
  sequenceId?: string
  text: string
  author: string
  mono: string
  contextTags: string[]
  visibility: Visibility
  createdAt: number
  mine?: boolean
  fromLive?: boolean
  keptInMemory?: boolean
}

/** A resolved selection anchor derived from the temporal cursor. */
export type Anchor =
  | { type: 'event'; minute: number; eventId: string; event: PulseEvent }
  | { type: 'sequence'; minute: number; endMinute: number; sequenceId: string; sequence: Sequence }
  | { type: 'time'; minute: number }

let _seq = 0
export function createAnnotation(
  input: Partial<TemporalAnnotation> & { minute: number; anchorType: AnchorType; text: string },
  opts: { now?: number; id?: string } = {},
): TemporalAnnotation {
  return {
    id: opts.id ?? `a-${++_seq}`,
    matchId: input.matchId ?? 'sp-riv',
    anchorType: input.anchorType,
    minute: input.minute,
    endMinute: input.endMinute,
    eventId: input.eventId,
    sequenceId: input.sequenceId,
    text: input.text,
    author: input.author ?? 'You',
    mono: input.mono ?? 'LF',
    contextTags: input.contextTags ?? [],
    visibility: input.visibility ?? 'private', // private by default
    createdAt: opts.now ?? Date.now(),
    mine: input.mine,
    fromLive: input.fromLive,
    keptInMemory: input.keptInMemory,
  }
}

export function shareWithCommunity(a: TemporalAnnotation): TemporalAnnotation {
  return { ...a, visibility: 'community' }
}
/** Promote a live annotation into the permanent personal memory. */
export function promoteToMemory(a: TemporalAnnotation): TemporalAnnotation {
  return { ...a, keptInMemory: true }
}

export function anchorLabel(anchor: Anchor): string {
  if (anchor.type === 'event') {
    const e = anchor.event
    const kind = e.type === 'card' ? `${e.cardType ?? 'Yellow'} card` : e.type[0].toUpperCase() + e.type.slice(1)
    return `${e.minute}’ · ${kind}${e.player ? ` · ${e.player}` : ''}`
  }
  if (anchor.type === 'sequence') return `${anchor.sequence.name} · ${anchor.minute}’–${anchor.endMinute}’`
  return `${ordinal(anchor.minute)} minute`
}

/** Resolve what the cursor is pointing at. `sequenceFocus` prefers the range. */
export function resolveAnchor(
  cursorMinute: number,
  sequenceFocus: boolean,
  events: PulseEvent[],
  sequences: Sequence[],
): Anchor {
  const seq = findSequenceForMinute(cursorMinute, sequences)
  if (sequenceFocus && seq) {
    return { type: 'sequence', minute: seq.start, endMinute: seq.end, sequenceId: seq.id, sequence: seq }
  }
  const ev = events.find((e) => e.minute === cursorMinute)
  if (ev) return { type: 'event', minute: ev.minute, eventId: ev.id, event: ev }
  return { type: 'time', minute: cursorMinute }
}

export function annotationsForAnchor(annotations: TemporalAnnotation[], anchor: Anchor): TemporalAnnotation[] {
  const match = (a: TemporalAnnotation) => {
    if (anchor.type === 'time') return a.anchorType === 'time' && a.minute === anchor.minute
    if (anchor.type === 'event')
      return a.eventId === anchor.eventId || (a.anchorType === 'time' && a.minute === anchor.minute)
    // sequence
    return a.sequenceId === anchor.sequenceId || (a.minute >= anchor.minute && a.minute <= anchor.endMinute)
  }
  return annotations.filter(match).sort((x, y) => x.minute - y.minute || x.createdAt - y.createdAt)
}

/* ---- Temporal cursor movement ---- */
export function clampMinute(m: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(m)))
}
/** Step to the previous/next important event minute (clamped, no wrap). */
export function stepImportant(events: PulseEvent[], minute: number, dir: 1 | -1, maxMinute = 95): number {
  const mins = [...new Set(events.map((e) => e.minute))].sort((a, b) => a - b)
  if (dir === 1) {
    const nxt = mins.find((m) => m > minute)
    return nxt ?? Math.min(maxMinute, mins[mins.length - 1] ?? minute)
  }
  const prev = [...mins].reverse().find((m) => m < minute)
  return prev ?? mins[0] ?? minute
}

/* ---- Community density ("people carried these parts with them") ---- */
export type DensitySample = { minute: number; value: number }
function gaussian(d: number, sigma: number) {
  return Math.exp(-(d * d) / (2 * sigma * sigma))
}
export function densitySamples(
  events: PulseEvent[],
  annotations: TemporalAnnotation[],
  step = 1,
  sigma = 3.2,
): DensitySample[] {
  const samples: DensitySample[] = []
  let max = 0
  for (let m = 0; m <= 95; m += step) {
    let v = 0
    for (const e of events) v += (e.impact / 5 + (e.decisive ? 0.4 : 0)) * gaussian(m - e.minute, sigma)
    for (const a of annotations) v += 0.55 * gaussian(m - a.minute, sigma)
    samples.push({ minute: m, value: v })
    if (v > max) max = v
  }
  return samples.map((s) => ({ minute: s.minute, value: max ? s.value / max : 0 }))
}
export function densityAt(samples: DensitySample[], minute: number): number {
  return samples.reduce((best, s) => (Math.abs(s.minute - minute) < Math.abs(best.minute - minute) ? s : best)).value
}
export function peakMinute(samples: DensitySample[]): number {
  return samples.reduce((best, s) => (s.value > best.value ? s : best)).minute
}
export function densityPhrase(value: number): string {
  if (value >= 0.8) return 'the moment the conversation peaked'
  if (value >= 0.55) return 'one of the most remembered passages'
  if (value >= 0.3) return 'people started reacting here'
  return 'a quiet period'
}

/* Overview keeps only the major events; minor ones are grouped into density. */
export function majorEvents(events: PulseEvent[]): PulseEvent[] {
  return events.filter((e) => e.type === 'goal')
}

/* Only ask a contextual question when it is meaningful and quick to answer. */
export function shouldAskQuestion(anchor: Anchor): boolean {
  if (anchor.type === 'sequence') return true
  if (anchor.type === 'event') return ['goal', 'save', 'chance'].includes(anchor.event.type)
  return false
}

/* Level 2 — the focused range to expand when events cluster. */
export type FocusRange = { start: number; end: number; label: string; sequenceId?: string }
export function focusedRange(
  cursorMinute: number,
  sequences: Sequence[],
  events: PulseEvent[],
): FocusRange | null {
  const seq = findSequenceForMinute(cursorMinute, sequences)
  if (seq) return { start: seq.start, end: seq.end, label: seq.name, sequenceId: seq.id }
  const win = events.filter((e) => Math.abs(e.minute - cursorMinute) <= 8)
  if (win.length >= 3) {
    return { start: clampMinute(cursorMinute - 8, 0, 95), end: clampMinute(cursorMinute + 8, 0, 95), label: 'This passage' }
  }
  return null
}

/* ---- Live vs post ---- */
export const LIVE_MINUTE = 84
export function maxMinuteFor(mode: 'live' | 'post') {
  return mode === 'live' ? LIVE_MINUTE : 90
}
export function defaultCursor(mode: 'live' | 'post', events: PulseEvent[]) {
  if (mode === 'live') return LIVE_MINUTE
  const decisive = events.find((e) => e.decisive)
  return decisive?.minute ?? events[events.length - 1].minute
}

/* ---- Pure helpers ---- */
export function eventsInRange(events: PulseEvent[], start: number, end: number) {
  return events.filter((e) => e.minute >= start && e.minute <= end)
}

export type SequenceStats = Record<EventType, number>
export function sequenceStats(events: PulseEvent[]): SequenceStats {
  const s: SequenceStats = { goal: 0, save: 0, shot: 0, chance: 0, card: 0, sub: 0, corner: 0 }
  for (const e of events) s[e.type]++
  return s
}
const STAT_ORDER: EventType[] = ['shot', 'save', 'chance', 'corner', 'card', 'sub', 'goal']
const STAT_NOUN: Record<EventType, [string, string]> = {
  goal: ['goal', 'goals'], save: ['save', 'saves'], shot: ['shot', 'shots'],
  chance: ['chance', 'chances'], card: ['card', 'cards'], sub: ['substitution', 'substitutions'],
  corner: ['corner', 'corners'],
}
export function formatStats(stats: SequenceStats): string[] {
  return STAT_ORDER.filter((t) => stats[t] > 0).map((t) => {
    const n = stats[t]
    return `${n} ${STAT_NOUN[t][n === 1 ? 0 : 1]}`
  })
}

export function findSequenceForMinute(minute: number, sequences: Sequence[]): Sequence | null {
  return sequences.find((s) => minute >= s.start && minute <= s.end) ?? null
}

export function nearestEvent(minute: number, events: PulseEvent[]): PulseEvent {
  return events.reduce((best, e) =>
    Math.abs(e.minute - minute) < Math.abs(best.minute - minute) ? e : best,
  )
}

/** Move selection between moments in minute order, clamped (no wrap). */
export function stepMoment(events: PulseEvent[], currentId: string, dir: 1 | -1): string {
  const sorted = [...events].sort((a, b) => a.minute - b.minute)
  const idx = sorted.findIndex((e) => e.id === currentId)
  if (idx === -1) return currentId
  const next = Math.min(sorted.length - 1, Math.max(0, idx + dir))
  return sorted[next].id
}

/** Lay events left-to-right by minute, but enforce a minimum gap so clustered
 *  moments (e.g. 78'–84') stay tappable. Returns px positions + total width. */
export function layoutEvents(
  events: PulseEvent[],
  baseWidth = 520,
  minGap = 54,
  pad = 30,
): { positions: { id: string; x: number }[]; width: number } {
  const sorted = [...events].sort((a, b) => a.minute - b.minute)
  const positions: { id: string; x: number }[] = []
  let prevX = -Infinity
  for (let i = 0; i < sorted.length; i++) {
    const timeX = pad + (sorted[i].minute / 95) * baseWidth
    const x = i === 0 ? Math.max(pad, timeX) : Math.max(prevX + minGap, timeX)
    positions.push({ id: sorted[i].id, x })
    prevX = x
  }
  return { positions, width: prevX + pad }
}

/* ---- Voting state (Yes / No / Not sure), result hidden until answered ---- */
export type VoteChoice = 'yes' | 'no' | 'unsure'
export type VoteState = { choice: VoteChoice | null; revealed: boolean }
export const INITIAL_VOTE: VoteState = { choice: null, revealed: false }
export function castVote(_prev: VoteState, choice: VoteChoice): VoteState {
  return { choice, revealed: true }
}

/* ---- Accessibility ---- */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
export const TYPE_LABEL: Record<EventType, string> = {
  goal: 'goal', save: 'save', shot: 'shot', chance: 'major chance',
  card: 'card', sub: 'substitution', corner: 'corner',
}
export function eventLabel(e: PulseEvent): string {
  const kind = e.type === 'card' ? `${e.cardType ?? 'yellow'} card` : TYPE_LABEL[e.type]
  const who = e.player ? ` by ${e.player}` : ''
  return `${ordinal(e.minute)} minute, ${kind}${who}, community impact ${e.impact.toFixed(1)} out of 5`
}

/* ============================================================
   MOCK DATA — England 1–2 Argentina
   FIFA World Cup 2026 semifinal, Atlanta. Real match shape
   reconstructed from the official CazéTV broadcast; minutes are
   rounded to the pulse grid (the stoppage-time winner sits at
   90). Demo-tagged seed content (see seed.ts / video.ts).
   ============================================================ */
const q = (text: string, agreePct: number, votes: number): Question => ({ text, agreePct, votes })

export const pulseMatch: PulseMatch = {
  home: 'england',
  away: 'argentina',
  competition: 'worldcup',
  stage: 'Semifinal',
  venue: 'Atlanta Stadium',
  score: '1 — 2',
  status: 'Full time',
  events: [
    { id: 'e36', minute: 36, type: 'card', cardType: 'yellow', team: 'home', phase: 'First half', impact: 2.2, question: q('Did the referee lose the game here?', 37, 480) },
    { id: 'e41', minute: 41, type: 'card', cardType: 'yellow', player: 'Lisandro Martínez', team: 'away', phase: 'First half', impact: 2.7, question: q('Was this card inevitable?', 58, 690) },
    { id: 'e51', minute: 51, type: 'card', cardType: 'yellow', player: 'Cuti Romero', team: 'away', phase: 'Second half', impact: 2.4, question: q('Was Romero walking a tightrope?', 63, 540) },
    { id: 'e55', minute: 55, type: 'goal', player: 'Anthony Gordon', team: 'home', phase: 'Second half', impact: 4.2, question: q('Was this goal pure Tuchel design?', 66, 1180) },
    { id: 'e64', minute: 64, type: 'sub', player: 'Nico González on', team: 'away', phase: 'Second half', impact: 2.1, question: q('Did Scaloni’s gamble change the match?', 71, 830) },
    { id: 'e82', minute: 82, type: 'shot', player: 'De Paul', team: 'away', phase: 'Second half', impact: 3.1, question: q('Was the siege becoming unbearable?', 69, 610) },
    { id: 'e83', minute: 83, type: 'chance', player: 'Messi', team: 'away', phase: 'Second half', impact: 3.9, question: q('Should Messi have scored?', 47, 1050) },
    { id: 'e84', minute: 84, type: 'save', player: 'Pickford', team: 'home', phase: 'Second half', impact: 4.1, question: q('Did Pickford only delay the inevitable?', 72, 980) },
    { id: 'e85', minute: 85, type: 'goal', player: 'Enzo Fernández', team: 'away', phase: 'Second half', impact: 4.7, question: q('Did this equaliser feel inevitable?', 81, 1740) },
    { id: 'e90', minute: 90, type: 'goal', player: 'Lautaro Martínez', team: 'away', phase: 'Second half', impact: 4.9, decisive: true, question: q('Is this Argentina’s defining virada?', 89, 2460) },
  ],
  sequences: [
    {
      id: 'yellow-spell', name: 'The game hardens', phase: 'First half', start: 36, end: 41,
      question: q('Did the cards change the temperature?', 54, 720),
    },
    {
      id: 'arg-siege', name: 'Argentina siege', phase: 'Second half', start: 82, end: 85, team: 'away',
      question: q('Did this sequence decide the final?', 85, 1930),
    },
  ],
  annotations: {},
}

/* Temporal annotations — event, time and sequence anchored. */
const H = 60 * 60 * 1000
export const pulseAnnotations: TemporalAnnotation[] = [
  { id: 'an-90a', matchId: 'wc26-sf-eng-arg', anchorType: 'event', minute: 90, eventId: 'e90', text: 'The whole away end rose as one body.', author: 'Marina', mono: 'MA', contextTags: ['At the stadium'], visibility: 'community', createdAt: 5 * H },
  { id: 'an-85a', matchId: 'wc26-sf-eng-arg', anchorType: 'event', minute: 85, eventId: 'e85', text: 'I didn’t breathe again until the net actually moved.', author: 'João', mono: 'JP', contextTags: ['Watching abroad'], visibility: 'community', createdAt: 4 * H },
  { id: 'an-seq', matchId: 'wc26-sf-eng-arg', anchorType: 'sequence', minute: 82, endMinute: 85, sequenceId: 'arg-siege', text: 'This sequence is the whole match. Everything before was preamble.', author: 'Rafael', mono: 'RF', contextTags: ['Neutral supporter'], visibility: 'community', createdAt: 3 * H },
  { id: 'an-74', matchId: 'wc26-sf-eng-arg', anchorType: 'time', minute: 74, text: 'This was when England quietly started to lose control — no event, just a feeling.', author: 'Camila', mono: 'CM', contextTags: ['At the stadium'], visibility: 'community', createdAt: 2 * H },
  { id: 'an-84', matchId: 'wc26-sf-eng-arg', anchorType: 'event', minute: 84, eventId: 'e84', text: 'Pickford kept them alive for one more minute. Cruel, in the end.', author: 'Diego', mono: 'DG', contextTags: ['Away supporter'], visibility: 'community', createdAt: 3.5 * H },
  // mine, captured live — promotable into the permanent memory post-match
  { id: 'an-mine85', matchId: 'wc26-sf-eng-arg', anchorType: 'event', minute: 85, eventId: 'e85', text: 'Dad grabbed my shoulder before the ball even crossed the line.', author: 'You', mono: 'LF', contextTags: ['At the stadium'], visibility: 'private', createdAt: 4.1 * H, mine: true, fromLive: true },
  { id: 'an-mine63', matchId: 'wc26-sf-eng-arg', anchorType: 'time', minute: 63, text: 'I leaned over and told him the game would turn. It turned.', author: 'You', mono: 'LF', contextTags: ['At the stadium'], visibility: 'private', createdAt: 1.9 * H, mine: true, fromLive: true },
]
