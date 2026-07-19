import { useSyncExternalStore } from 'react'
import type { MatchData } from './MatchCover'
import { ok, err, type RepositoryResult } from './repository'

/* ============================================================
   Watchlist state — persisted so the saved/reminder state agrees
   with the visible UI and survives reload. Pure reducers are
   unit-tested; the store wires them to localStorage.
   ============================================================ */

export type WatchEntry = { reminder: boolean; watching: boolean }
export type WatchlistState = Record<string, WatchEntry>

export function matchId(m: Pick<MatchData, 'home' | 'away' | 'competition'>): string {
  return `${m.home}_${m.away}_${m.competition}`
}

/* ---- Pure reducers ---- */
export function addMatch(s: WatchlistState, id: string): WatchlistState {
  if (s[id]) return s
  return { ...s, [id]: { reminder: true, watching: false } }
}
export function removeMatch(s: WatchlistState, id: string): WatchlistState {
  if (!s[id]) return s
  const n = { ...s }
  delete n[id]
  return n
}
export function toggleReminder(s: WatchlistState, id: string): WatchlistState {
  const e = s[id]
  if (!e) return s
  return { ...s, [id]: { ...e, reminder: !e.reminder } }
}
export function setWatching(s: WatchlistState, id: string, watching: boolean): WatchlistState {
  const e = s[id] ?? { reminder: true, watching: false }
  return { ...s, [id]: { ...e, watching } }
}

/* ============================================================
   Persistence behind a repository seam. Today it is localStorage;
   swap LocalStorageWatchlistRepository for an API-backed one when
   auth/backend land — the store and UI don't change.
   ============================================================ */
export const SCHEMA_VERSION = 1
export type PersistedWatchlist = { version: number; matches: WatchlistState }

export interface WatchlistRepository {
  load(): WatchlistState
  /** Async so the same contract serves localStorage and a remote API.
      Failures are explicit results — never swallowed. */
  save(state: WatchlistState): Promise<RepositoryResult<void>>
}

/** Migrate a persisted envelope from an older schema. No prior versions yet. */
function migrate(_persisted: PersistedWatchlist): WatchlistState {
  return {}
}

export class LocalStorageWatchlistRepository implements WatchlistRepository {
  constructor(private readonly key = 'vez.watchlist') {}
  load(): WatchlistState {
    if (typeof localStorage === 'undefined') return {}
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && 'version' in parsed && 'matches' in parsed) {
        const env = parsed as PersistedWatchlist
        return env.version === SCHEMA_VERSION ? (env.matches ?? {}) : migrate(env)
      }
      // unknown/legacy shape → start clean rather than crash the app
      return {}
    } catch {
      return {}
    }
  }
  async save(state: WatchlistState): Promise<RepositoryResult<void>> {
    if (typeof localStorage === 'undefined') return err('storage_write_failed', 'storage unavailable')
    try {
      const envelope: PersistedWatchlist = { version: SCHEMA_VERSION, matches: state }
      localStorage.setItem(this.key, JSON.stringify(envelope))
      return ok()
    } catch {
      return err('storage_write_failed', 'storage unavailable')
    }
  }
}

let repo: WatchlistRepository = new LocalStorageWatchlistRepository()
let state: WatchlistState = repo.load()
const listeners = new Set<() => void>()
function setState(next: WatchlistState) {
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

/** Optimistic commit: apply immediately, persist, roll back to the last
    confirmed state if the write fails. The UI never ends up contradictory —
    on failure the visible state is exactly what is actually stored. */
async function commit(next: WatchlistState): Promise<RepositoryResult<void>> {
  if (next === state) return ok()
  const confirmed = state
  setState(next)
  const res = await repo.save(next)
  if (!res.ok) setState(confirmed)
  return res
}

/** Swap the persistence backend (e.g. an API repo once auth exists). */
export function setWatchlistRepository(next: WatchlistRepository) {
  repo = next
  state = repo.load()
  listeners.forEach((l) => l())
}

export const watchlistStore = {
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getSnapshot() {
    return state
  },
  add: (id: string) => commit(addMatch(state, id)),
  remove: (id: string) => commit(removeMatch(state, id)),
  toggleReminder: (id: string) => commit(toggleReminder(state, id)),
  setWatching: (id: string, w: boolean) => commit(setWatching(state, id, w)),
  /** Seed once (curated matches start saved) without clobbering user changes. */
  seed(ids: string[]) {
    if (Object.keys(state).length) return
    let next = state
    for (const id of ids) next = addMatch(next, id)
    void commit(next)
  },
  /** Test helper. */
  reset() {
    void commit({})
  },
}

export function useWatchlist() {
  const s = useSyncExternalStore(watchlistStore.subscribe, watchlistStore.getSnapshot, watchlistStore.getSnapshot)
  return {
    state: s,
    isSaved: (id: string) => Boolean(s[id]),
    reminderOn: (id: string) => Boolean(s[id]?.reminder),
    isWatching: (id: string) => Boolean(s[id]?.watching),
    add: watchlistStore.add,
    remove: watchlistStore.remove,
    toggleReminder: watchlistStore.toggleReminder,
    setWatching: watchlistStore.setWatching,
  }
}
