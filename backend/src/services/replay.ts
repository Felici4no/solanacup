import { WORLD_CUP_COMPETITION_ID } from '../config.js'
import type { AppFixture, MatchState, PulseEvent } from './worldcup.js'
import { isLiveState } from './worldcup.js'
import type { LiveEvent, Subscription, WorldCupSource } from './source.js'

/* ============================================================
   Replay source — a scripted World Cup match that streams live,
   through the exact same normalized shapes as the TxLINE source.
   Lets the whole pipeline (fixtures → live pulse → G3B check-in)
   run without faucet SOL or a real match at demo time.

   Time is compressed: one scripted beat every REPLAY_SPEED
   seconds (default 6s), so a 90' match plays in ~90s.
   ============================================================ */

const REPLAY_FIXTURE_ID = 900_026
const HOME = { id: 501, name: 'Brazil' }
const AWAY = { id: 502, name: 'England' }
const SPEED_MS = Number(process.env.REPLAY_SPEED ?? 6) * 1000

type Beat = Omit<PulseEvent, 'ts' | 'seq' | 'gameState'> & { gameState: string }

// A believable knockout script: England strike first, Brazil turn it late.
const SCRIPT: Beat[] = [
  { minute: 0, type: 'state', team: null, gameState: 'H11' }, // kickoff
  { minute: 6, type: 'corner', team: 'home', gameState: 'H11' },
  { minute: 12, type: 'yellow_card', team: 'away', gameState: 'H11' },
  { minute: 27, type: 'other', team: 'home', gameState: 'H11' }, // shot
  { minute: 41, type: 'goal', team: 'away', gameState: 'H11' }, // 0-1
  { minute: 45, type: 'state', team: null, gameState: 'HT2' }, // half time
  { minute: 46, type: 'state', team: null, gameState: 'H21' }, // second half
  { minute: 63, type: 'other', team: 'home', gameState: 'H21' }, // big chance
  { minute: 78, type: 'corner', team: 'home', gameState: 'H21' },
  { minute: 84, type: 'goal', team: 'home', gameState: 'H21' }, // 1-1
  { minute: 87, type: 'goal', team: 'home', gameState: 'H21' }, // 2-1 winner
  { minute: 90, type: 'state', team: null, gameState: 'END' }, // full time
]

/** Singleton live match that advances on a timer from server boot. */
class LiveReplayMatch {
  private index = 0
  private emitted: PulseEvent[] = []
  private subscribers = new Set<(e: LiveEvent) => void>()
  private timer: NodeJS.Timeout

  constructor() {
    this.timer = setInterval(() => this.tick(), SPEED_MS)
    this.tick() // emit kickoff immediately
  }

  private tick() {
    if (this.index >= SCRIPT.length) {
      clearInterval(this.timer)
      return
    }
    const beat = SCRIPT[this.index++]
    const event: PulseEvent = { ...beat, ts: Date.now(), seq: this.index }
    this.emitted.push(event)
    const live: LiveEvent = { ...event, fixtureId: REPLAY_FIXTURE_ID }
    for (const sub of this.subscribers) sub(live)
    const label = event.type === 'goal' ? '⚽ GOAL' : event.type.toUpperCase()
    console.log(`[replay] ${event.minute}' ${label}${event.team ? ` (${event.team})` : ''} → ${JSON.stringify(this.score())}`)
  }

  score() {
    const s = { home: 0, away: 0 }
    for (const e of this.emitted) if (e.type === 'goal' || e.type === 'penalty') if (e.team) s[e.team]++
    return s
  }

  state(): MatchState {
    const gameState = this.emitted.length ? this.emitted[this.emitted.length - 1].gameState : 'NS2'
    return { fixtureId: REPLAY_FIXTURE_ID, gameState, live: isLiveState(gameState), score: this.score(), events: [...this.emitted] }
  }

  subscribe(cb: (e: LiveEvent) => void): Subscription {
    // Replay already-emitted events so a late subscriber sees the story so far.
    for (const e of this.emitted) cb({ ...e, fixtureId: REPLAY_FIXTURE_ID })
    this.subscribers.add(cb)
    return { close: () => this.subscribers.delete(cb) }
  }
}

let liveMatch: LiveReplayMatch | null = null
function getLiveMatch() {
  if (!liveMatch) liveMatch = new LiveReplayMatch()
  return liveMatch
}

const KICKOFF = Date.now() - 2 * 60_000

const FIXTURES: AppFixture[] = [
  {
    fixtureId: REPLAY_FIXTURE_ID,
    competition: 'FIFA World Cup',
    competitionId: WORLD_CUP_COMPETITION_ID,
    home: HOME.name,
    away: AWAY.name,
    homeId: HOME.id,
    awayId: AWAY.id,
    kickoff: KICKOFF,
    updatedAt: Date.now(),
  },
  {
    fixtureId: 900_027,
    competition: 'FIFA World Cup',
    competitionId: WORLD_CUP_COMPETITION_ID,
    home: 'Argentina',
    away: 'France',
    homeId: 503,
    awayId: 504,
    kickoff: Date.now() + 3 * 3_600_000,
    updatedAt: Date.now(),
  },
]

export class ReplayWorldCup implements WorldCupSource {
  readonly kind = 'replay' as const

  async getFixtures(): Promise<AppFixture[]> {
    return FIXTURES
  }

  async getMatchState(fixtureId: number): Promise<MatchState> {
    if (fixtureId === REPLAY_FIXTURE_ID) return getLiveMatch().state()
    return { fixtureId, gameState: 'NS2', live: false, score: { home: 0, away: 0 }, events: [] }
  }

  streamScores(onEvent: (e: LiveEvent) => void, fixtureId?: number): Subscription {
    if (fixtureId != null && fixtureId !== REPLAY_FIXTURE_ID) {
      return { close: () => {} }
    }
    return getLiveMatch().subscribe(onEvent)
  }
}

export const REPLAY_LIVE_FIXTURE_ID = REPLAY_FIXTURE_ID
