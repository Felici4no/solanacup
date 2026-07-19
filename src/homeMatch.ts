/* ============================================================
   homeMatch.ts — normalisation layer between TxLINE/Replay fixtures
   and the Home page.

   Rules:
   • Never imports from data.ts (no fictional club matches).
   • gameState mapping derived from actual replay/TxLINE payloads
     (H11/H21 = live 1H/2H, HT2 = halftime, END/F2/… = finished,
      NS2 = not started).  Not a guess — verified in replay.ts.
   • selectHomeMatch: live today > finished today > scheduled today >
     next future.
   • isLocalToday uses Intl.DateTimeFormat (timezone-aware, never UTC-only).
   ============================================================ */

import type { LiveFixture, LiveMatchState } from './live/client'

// ---- Status derived from gameState strings seen in the real TxLINE payload ----
//   Seen in replay.ts SCRIPT: H11 (1H running), HT2 (half-time), H21 (2H running), END (full time)
//   TxLINE OpenAPI also lists: ET1/ET2 (ET periods), HTET (ET halftime), PE/FPE (penalties), F2 (final whistle variant)
//   NS2 = not started (zero events)
//   Anything else: treat as scheduled
const LIVE_GAME_STATES = new Set(['H11', 'H21', 'ET1', 'ET2', 'PE', 'FPE', 'I2', 'P'])
const HALFTIME_GAME_STATES = new Set(['HT2', 'HTET'])
const ENDED_GAME_STATES = new Set(['END', 'F2', 'FET', 'WET', 'WPE', 'C2', 'A2'])

export type HomeMatchStatus =
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'

export type HomeTeam = {
  id: string
  name: string
  shortName?: string
}

export type HomeMatch = {
  id: string
  fixtureId: number
  competition: string
  stage?: string
  homeTeam: HomeTeam
  awayTeam: HomeTeam
  homeScore?: number
  awayScore?: number
  startsAt: string // ISO 8601
  status: HomeMatchStatus
  /** 'txline' = live backend; 'replay' = scripted demo data; 'snapshot' = bundled static */
  source: 'txline' | 'replay' | 'snapshot'
}

/** Map a gameState string to a HomeMatchStatus.
    Built from actual payload inspection — see replay.ts SCRIPT. */
export function gameStateToStatus(gameState: string): HomeMatchStatus {
  if (LIVE_GAME_STATES.has(gameState)) return 'live'
  if (HALFTIME_GAME_STATES.has(gameState)) return 'halftime'
  if (ENDED_GAME_STATES.has(gameState)) return 'finished'
  return 'scheduled' // NS2, unknown → not started
}

/** Map TxLINE/Replay participant name strings to teamIdentity IDs.
    Names from replay.ts: 'Brazil', 'England', 'Argentina', 'France'.
    TxLINE real API uses English country names (same convention). */
export function normalizeTeamId(name: string): string {
  const KNOWN: Record<string, string> = {
    brazil: 'brazil',
    england: 'england',
    argentina: 'argentina',
    france: 'france',
    germany: 'germany',
    spain: 'spain',
    italy: 'italy',
    portugal: 'portugal',
    netherlands: 'netherlands',
    usa: 'usa',
    'united states': 'usa',
    morocco: 'morocco',
    croatia: 'croatia',
    japan: 'japan',
    'south korea': 'southkorea',
  }
  const key = name.toLowerCase().trim()
  return KNOWN[key] ?? key.replace(/\s+/g, '')
}

/** Build a HomeMatch from a LiveFixture + optional match state.
    If state is null, status is always 'scheduled'. */
export function normalizeFixtureToHomeMatch(
  f: LiveFixture,
  state: LiveMatchState | null,
  source: HomeMatch['source'] = 'txline',
): HomeMatch {
  const status = state ? gameStateToStatus(state.gameState) : 'scheduled'
  const hasScore = state && (state.score.home > 0 || state.score.away > 0)

  return {
    id: String(f.fixtureId),
    fixtureId: f.fixtureId,
    competition: f.competition,
    homeTeam: {
      id: normalizeTeamId(f.home),
      name: f.home,
    },
    awayTeam: {
      id: normalizeTeamId(f.away),
      name: f.away,
    },
    homeScore: hasScore ? state!.score.home : undefined,
    awayScore: hasScore ? state!.score.away : undefined,
    startsAt: new Date(f.kickoff).toISOString(),
    status,
    source,
  }
}

// ---- Date helpers — timezone-aware, never raw UTC slice ----

/** Returns a localised date string 'YYYY-MM-DD' in the user's timezone. */
export function localDateStr(ms: number, tz?: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  const parts = new Intl.DateTimeFormat('en-CA', opts).formatToParts(new Date(ms))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** True if the epoch ms falls on the same local calendar day as now. */
export function isLocalToday(ms: number, tz?: string): boolean {
  return localDateStr(ms) === localDateStr(Date.now(), tz)
}

// ---- Selection logic ----

function isLiveStatus(s: HomeMatchStatus): boolean {
  return s === 'live' || s === 'halftime'
}

/** Pick the best match to feature on the Home screen.
    Priority: live today > finished today > scheduled today > next future. */
export function selectHomeMatch(matches: HomeMatch[]): HomeMatch | null {
  if (!matches.length) return null

  const liveToday = matches.find((m) => isLiveStatus(m.status) && isLocalToday(Date.parse(m.startsAt)))
  if (liveToday) return liveToday

  const finishedToday = matches.find((m) => m.status === 'finished' && isLocalToday(Date.parse(m.startsAt)))
  if (finishedToday) return finishedToday

  const scheduledToday = matches.find((m) => m.status === 'scheduled' && isLocalToday(Date.parse(m.startsAt)))
  if (scheduledToday) return scheduledToday

  // Next future match (sorted ascending by kickoff)
  const future = matches
    .filter((m) => m.status === 'scheduled' && Date.parse(m.startsAt) > Date.now())
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  return future[0] ?? null
}

/** Pick upcoming matches (all scheduled, sorted, excluding the featured one). */
export function selectUpcoming(matches: HomeMatch[], featuredId: string | null): HomeMatch[] {
  return matches
    .filter((m) => m.status === 'scheduled' && m.id !== featuredId)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, 3)
}
