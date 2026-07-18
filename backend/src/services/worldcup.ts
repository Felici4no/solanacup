import { WORLD_CUP_COMPETITION_ID, epochDay } from '../config.js'
import { fixturesSnapshot, scoresSnapshot, scoresStream } from '../txline/api.js'
import type { Fixture, Scores, SoccerData } from '../txline/types.js'
import type { LiveEvent, Subscription, WorldCupSource } from './source.js'

/* ============================================================
   World Cup service — fetches TxLINE data and normalizes it to
   the shapes the GAM3BOOK frontend already understands (matches and
   Match Pulse events).
   ============================================================ */

export type AppFixture = {
  fixtureId: number
  competition: string
  competitionId: number
  home: string
  away: string
  homeId: number
  awayId: number
  kickoff: number // ms epoch
  updatedAt: number
}

export type PulseEvent = {
  minute: number | null
  type: 'goal' | 'penalty' | 'red_card' | 'yellow_card' | 'corner' | 'var' | 'state' | 'other'
  team: 'home' | 'away' | null
  gameState: string
  ts: number
  seq: number
  raw?: string
}

export type MatchState = {
  fixtureId: number
  gameState: string
  live: boolean
  score: { home: number; away: number }
  events: PulseEvent[]
}

/** Soccer fixture statuses that mean the ball is (or may be) rolling.
    From the OpenAPI SoccerFixtureStatus variants: H1/H2 running, ET, pens. */
const LIVE_STATES = new Set(['H11', 'H21', 'HT2', 'ET1', 'ET2', 'HTET', 'PE', 'FPE', 'I2', 'P'])
const ENDED_STATES = new Set(['END', 'F2', 'FET', 'WET', 'WPE', 'C2', 'A2'])

export function isLiveState(gameState: string): boolean {
  return LIVE_STATES.has(gameState)
}
export function isEndedState(gameState: string): boolean {
  return ENDED_STATES.has(gameState)
}

export function normalizeFixture(f: Fixture): AppFixture {
  const homeFirst = f.Participant1IsHome
  return {
    fixtureId: f.FixtureId,
    competition: f.Competition,
    competitionId: f.CompetitionId,
    home: homeFirst ? f.Participant1 : f.Participant2,
    away: homeFirst ? f.Participant2 : f.Participant1,
    homeId: homeFirst ? f.Participant1Id : f.Participant2Id,
    awayId: homeFirst ? f.Participant2Id : f.Participant1Id,
    kickoff: f.StartTime,
    updatedAt: f.Ts,
  }
}

/** Parse the JSON-encoded soccer action carried by a Scores record. */
export function parseSoccerAction(record: Scores): SoccerData | null {
  try {
    return JSON.parse(record.action) as SoccerData
  } catch {
    return null
  }
}

function teamOf(record: Scores, data: SoccerData | null): 'home' | 'away' | null {
  const participant = data?.Participant
  if (participant == null) return null
  const isP1 = participant === record.participant1Id || participant === 1
  const isP2 = participant === record.participant2Id || participant === 2
  if (!isP1 && !isP2) return null
  const p1IsHome = record.participant1IsHome
  return (isP1 && p1IsHome) || (isP2 && !p1IsHome) ? 'home' : 'away'
}

export function normalizeScore(record: Scores): PulseEvent {
  const data = parseSoccerAction(record)
  let type: PulseEvent['type'] = 'other'
  if (data?.Goal) type = data.Penalty ? 'penalty' : 'goal'
  else if (data?.RedCard || data?.Color === 'Red') type = 'red_card'
  else if (data?.YellowCard || data?.Color === 'Yellow') type = 'yellow_card'
  else if (data?.Corner) type = 'corner'
  else if (data?.VAR) type = 'var'
  else if (data?.StatusId != null || data?.Type === 'Status') type = 'state'

  return {
    minute: data?.Minutes ?? null,
    type,
    team: teamOf(record, data),
    gameState: record.gameState,
    ts: record.ts,
    seq: record.seq,
    raw: record.action,
  }
}

/** Fold normalized events into a match state (score by counting goals). */
export function buildMatchState(fixtureId: number, records: Scores[]): MatchState {
  const ordered = [...records].sort((a, b) => a.seq - b.seq)
  const events = ordered.map(normalizeScore)
  const score = { home: 0, away: 0 }
  for (const e of events) {
    if ((e.type === 'goal' || e.type === 'penalty') && e.team) score[e.team]++
  }
  const gameState = ordered.length ? ordered[ordered.length - 1].gameState : 'NS2'
  return { fixtureId, gameState, live: isLiveState(gameState), score, events }
}

/* ---- Service with a small cache ---- */

export class WorldCupService implements WorldCupSource {
  readonly kind = 'txline' as const
  private fixtures: AppFixture[] = []
  private fetchedAt = 0

  async getFixtures(): Promise<AppFixture[]> {
    const STALE_MS = 5 * 60 * 1000
    if (Date.now() - this.fetchedAt > STALE_MS) {
      const raw = await fixturesSnapshot({
        competitionId: WORLD_CUP_COMPETITION_ID,
        startEpochDay: epochDay(),
      })
      this.fixtures = raw.map(normalizeFixture).sort((a, b) => a.kickoff - b.kickoff)
      this.fetchedAt = Date.now()
    }
    return this.fixtures
  }

  async getMatchState(fixtureId: number): Promise<MatchState> {
    const records = await scoresSnapshot(fixtureId)
    return buildMatchState(fixtureId, records)
  }

  /** Re-broadcastable live stream of one fixture (or all permitted). */
  streamScores(onEvent: (e: PulseEvent & { fixtureId: number }) => void, fixtureId?: number) {
    return scoresStream(
      {
        onData: (record) => onEvent({ ...normalizeScore(record), fixtureId: record.fixtureId }),
        onError: (err) => console.error('[wc] stream error', err),
        onOpen: () => console.log('[wc] scores stream open'),
      },
      fixtureId,
    )
  }
}
