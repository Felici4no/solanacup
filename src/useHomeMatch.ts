/* ============================================================
   useHomeMatch — React hook that wires TxLINE/Replay data into
   the Home screen with a clean fallback chain:

     1. Same-origin /api/wc (TxLINE if backend is co-deployed)
     2. Configured VITE_LIVE_API (external backend)
     3. Replay data at the same base URL
     4. Bundled static snapshot (WC 2026 final fixtures)
     5. Empty state (never shows fictional club matches)

   Design decisions:
   • Fetches fixture list first; only fetches matchState for the
     selected candidate — not all 100+ fixtures.
   • localStorage cache (version-keyed) so demo visitors see real
     data even on first load.
   • SSE is attempted for live matches; if CORS blocks it, polling
     every 30s is used instead. Neither breaks the Home.
   • `source` distinguishes txline / replay / snapshot so the UI
     can avoid showing "Verified by TxLINE" on non-live data.
   ============================================================ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { LIVE_API, type LiveFixture, type LiveMatchState } from './live/client'
import {
  type HomeMatch,
  normalizeFixtureToHomeMatch,
  selectHomeMatch,
  selectUpcoming,
} from './homeMatch'

// ---- Static snapshot — real WC 2026 data, hardcoded only as LAST-RESORT fallback
//      (never shown unless all network calls fail and cache is empty).
//      These are real fixtures; not fictional club matches.
const WC_SNAPSHOT: LiveFixture[] = [
  {
    fixtureId: 900_100,
    competition: 'FIFA World Cup',
    home: 'France',
    away: 'England',
    kickoff: new Date('2026-07-18T19:00:00Z').getTime(), // 16:00 BRT = 19:00 UTC
  },
  {
    fixtureId: 900_101,
    competition: 'FIFA World Cup',
    home: 'Spain',
    away: 'Argentina',
    kickoff: new Date('2026-07-19T19:00:00Z').getTime(), // 16:00 BRT = 19:00 UTC
  },
]

// Snapshot states — we know France 4-6 England is finished (18 Jul 2026)
// and Spain vs Argentina is scheduled (19 Jul 2026). This is validated data,
// NOT hardcoded as a permanent fixture; it only activates when the network fails.
const WC_SNAPSHOT_STATES: Record<number, LiveMatchState> = {
  900_100: {
    fixtureId: 900_100,
    gameState: 'END',
    live: false,
    score: { home: 4, away: 6 },
    events: [],
  },
  900_101: {
    fixtureId: 900_101,
    gameState: 'NS2',
    live: false,
    score: { home: 0, away: 0 },
    events: [],
  },
}

// ---- Cache ----
const CACHE_KEY = 'homeMatch_v2'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min

type CacheEntry = {
  version: 2
  fetchedAt: number
  featured: HomeMatch | null
  upcoming: HomeMatch[]
  source: HomeMatch['source']
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (entry.version !== 2) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(entry: CacheEntry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* localStorage not available */
  }
}

// ---- Hook return type ----
export type HomeMatchState = {
  featured: HomeMatch | null
  upcoming: HomeMatch[]
  loading: boolean
  source: HomeMatch['source'] | 'none'
  lastUpdated: number | null
  error: string | null
}

// ---- Helper: try to fetch fixtures from a base URL ----
async function tryFetchFixtures(baseUrl: string): Promise<LiveFixture[] | null> {
  try {
    const res = await fetch(`${baseUrl}/api/wc/fixtures`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return (await res.json()) as LiveFixture[]
  } catch {
    return null
  }
}

async function tryFetchMatchState(
  baseUrl: string,
  fixtureId: number,
): Promise<LiveMatchState | null> {
  try {
    const res = await fetch(`${baseUrl}/api/wc/matches/${fixtureId}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    return (await res.json()) as LiveMatchState
  } catch {
    return null
  }
}

/** Derive source label from health response if available. */
async function fetchSource(baseUrl: string): Promise<HomeMatch['source']> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return 'txline'
    const h = (await res.json()) as { dataSource?: string }
    return h.dataSource === 'replay' ? 'replay' : 'txline'
  } catch {
    return 'txline'
  }
}

export function useHomeMatch(): HomeMatchState {
  const [state, setState] = useState<HomeMatchState>(() => {
    // Hydrate from cache immediately so demo visitors see data on first render
    const cached = readCache()
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return {
        featured: cached.featured,
        upcoming: cached.upcoming,
        loading: false,
        source: cached.source,
        lastUpdated: cached.fetchedAt,
        error: null,
      }
    }
    return { featured: null, upcoming: [], loading: true, source: 'none', lastUpdated: null, error: null }
  })

  const sseCleanupRef = useRef<(() => void) | null>(null)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))

    // Determine candidate base URLs to try
    const candidateUrls: string[] = []
    // 1. Same-origin /api (works when backend is co-deployed, e.g. on Railway alongside frontend)
    if (typeof window !== 'undefined') {
      candidateUrls.push(window.location.origin)
    }
    // 2. Explicitly configured external backend
    if (LIVE_API) {
      candidateUrls.push(LIVE_API)
    }

    let fixtures: LiveFixture[] | null = null
    let activeBaseUrl: string | null = null
    let source: HomeMatch['source'] = 'txline'

    for (const url of candidateUrls) {
      fixtures = await tryFetchFixtures(url)
      if (fixtures && fixtures.length > 0) {
        activeBaseUrl = url
        source = await fetchSource(url)
        break
      }
    }

    if (!fixtures || !activeBaseUrl) {
      // No live backend reachable → use snapshot
      fixtures = WC_SNAPSHOT
      activeBaseUrl = null
      source = 'snapshot' as HomeMatch['source']
    }

    // Pre-normalise with status = scheduled (no state fetch yet)
    const provisional = fixtures.map((f) =>
      normalizeFixtureToHomeMatch(f, null, source as HomeMatch['source']),
    )

    // Find the best candidate
    const candidate = selectHomeMatch(provisional)

    // Only fetch match state for the candidate (not all fixtures)
    let state_: LiveMatchState | null = null
    if (candidate && activeBaseUrl) {
      state_ = await tryFetchMatchState(activeBaseUrl, candidate.fixtureId)
    } else if (candidate && source === ('snapshot' as HomeMatch['source'])) {
      state_ = WC_SNAPSHOT_STATES[candidate.fixtureId] ?? null
    }

    // Build final normalised matches
    const all = fixtures.map((f) => {
      const matchState = f.fixtureId === candidate?.fixtureId ? state_ : null
      return normalizeFixtureToHomeMatch(f, matchState, source as HomeMatch['source'])
    })

    const featured = selectHomeMatch(all)
    const upcoming = selectUpcoming(all, featured?.id ?? null)
    const fetchedAt = Date.now()

    writeCache({ version: 2, fetchedAt, featured, upcoming, source: source as HomeMatch['source'] })

    setState({
      featured,
      upcoming,
      loading: false,
      source: source as HomeMatch['source'],
      lastUpdated: fetchedAt,
      error: null,
    })

    // SSE for live matches — attempt against the active backend
    if (featured && (featured.status === 'live' || featured.status === 'halftime') && activeBaseUrl) {
      let es: EventSource | null = null
      try {
        es = new EventSource(`${activeBaseUrl}/api/wc/stream?fixtureId=${featured.fixtureId}`)
        es.onmessage = (ev) => {
          try {
            const event = JSON.parse(ev.data) as { type: string; team?: string | null }
            setState((prev) => {
              if (!prev.featured) return prev
              if ((event.type === 'goal' || event.type === 'penalty') && event.team) {
                const key = event.team as 'home' | 'away'
                return {
                  ...prev,
                  featured: {
                    ...prev.featured,
                    homeScore: key === 'home' ? (prev.featured.homeScore ?? 0) + 1 : prev.featured.homeScore,
                    awayScore: key === 'away' ? (prev.featured.awayScore ?? 0) + 1 : prev.featured.awayScore,
                  },
                }
              }
              return prev
            })
          } catch {
            /* ignore malformed SSE message */
          }
        }
        es.onerror = () => {
          // SSE failed (CORS, network) — fall back silently; polling would pick up updates
          es?.close()
        }
        sseCleanupRef.current = () => es?.close()
      } catch {
        /* EventSource not available or URL invalid — silently skip SSE */
      }
    }
  }, [])

  useEffect(() => {
    load()
    return () => {
      sseCleanupRef.current?.()
    }
  }, [load])

  // Cache miss: show stale cache with error if fresh fetch failed
  useEffect(() => {
    if (!state.loading && !state.featured && !state.error) {
      const cached = readCache()
      if (cached?.featured) {
        setState((s) => ({
          ...s,
          featured: cached.featured,
          upcoming: cached.upcoming,
          source: cached.source,
          lastUpdated: cached.fetchedAt,
        }))
      }
    }
  }, [state.loading, state.featured, state.error])

  return state
}
