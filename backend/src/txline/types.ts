/* ============================================================
   TxLINE payload types — transcribed from the official OpenAPI
   spec (docs/txline-openapi.yaml). Field names are verbatim.
   ============================================================ */

/** GET /api/fixtures/snapshot */
export type Fixture = {
  Ts: number
  StartTime: number
  Competition: string
  CompetitionId: number
  FixtureGroupId: number
  Participant1Id: number
  Participant1: string
  Participant2Id: number
  Participant2: string
  FixtureId: number
  Participant1IsHome: boolean
}

/** Soccer event payload inside a Scores record (subset relevant to GAM3BOOK). */
export type SoccerData = {
  Action?: string
  Color?: string
  Corner?: boolean
  FreeKickType?: string
  Goal?: boolean
  GoalType?: unknown
  Minutes?: number
  Outcome?: string
  Participant?: number
  Penalty?: boolean
  PlayerId?: number
  PlayerInId?: number
  PlayerOutId?: number
  StatusId?: number
  ThrowInType?: string
  Type?: string
  RedCard?: boolean
  YellowCard?: boolean
  VAR?: boolean
}

/** GET /api/scores/* records (envelope). */
export type Scores = {
  fixtureId: number
  gameState: string
  startTime: number
  isTeam: boolean
  fixtureGroupId: number
  competitionId: number
  countryId: number
  sportId: number
  participant1IsHome: boolean
  participant1Id: number
  participant2Id: number
  coverageSecondaryData?: boolean
  coverageType?: string
  /** JSON-encoded sport-specific action (SoccerData for soccer). */
  action: string
  id: number
  ts: number
  connectionId: number
  seq: number
}

/** GET /api/odds/* records. Prices are integer-encoded StablePrice values. */
export type Odds = {
  FixtureId: number
  MessageId: string
  Ts: number
  Bookmaker: string
  BookmakerId: number
  SuperOddsType: string
  GameState?: string
  InRunning: boolean
  MarketParameters?: string
  MarketPeriod?: string
  PriceNames?: string[]
  Prices?: number[]
}

/** POST /api/token/activate body (ActivationPayload in the spec). */
export type ActivationPayload = {
  txSig: string
  walletSignature: string
  leagues: number[]
}

/** SSE stream event, per the spec: data messages carry `id` = `timestamp:index`
    and a single record as JSON; heartbeats have `event: heartbeat`. */
export type StreamHandlers<T> = {
  onData: (record: T, id: string | null) => void
  onHeartbeat?: (ts: number | null) => void
  onOpen?: () => void
  onError?: (err: unknown) => void
}
