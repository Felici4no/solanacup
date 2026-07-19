/* ============================================================
   Demo session + chapters — isolated localStorage repository.

   The public demonstration is honest by construction: there is
   no authentication and none is faked. A "session" is only a
   locally-persisted visitor id that lets the judge live the
   full cycle (explore → match → memory → public profile)
   without sign-up. Follows the same repository seam as
   watchlist.ts — swapping in an API-backed repo later changes
   nothing above this module.

   Privacy rule enforced HERE, not in the UI: only chapters with
   visibility === 'public' ever leave publicChapters(). Seeded
   social content is marked source: 'demo-seed' and surfaces
   identify it once, at the top, with a single Demo tag.
   ============================================================ */

import type { MatchData } from '../MatchCover'
import type { SavedMemory } from '../community'

export const PUBLIC_USERNAME = 'demo'
const SESSION_KEY = 'g3b.demo.session'
const CHAPTERS_KEY = 'g3b.demo.chapters'
const SCHEMA_VERSION = 1

export type DemoSession = { id: string; username: string; createdAt: number }

export type ChapterVisibility = 'public' | 'private'

export type DemoChapter = {
  id: string
  matchId: string
  match: MatchData
  memory: SavedMemory
  visibility: ChapterVisibility
  /** 'demo-seed' = simulated social content · 'visitor' = created in this browser. */
  source: 'demo-seed' | 'visitor'
  /** Optional link into the official broadcast layer (video at timestamp). */
  markerEventId?: string
  createdAt: number
}

type PersistedChapters = { version: number; chapters: DemoChapter[] }

/* ---- Seeded public content (simulated, identified once in the UI) ---- */
export const SEEDED_CHAPTERS: DemoChapter[] = [
  {
    id: 'ch-eng-arg-85',
    matchId: 'wc26-sf-eng-arg',
    match: {
      home: 'england',
      away: 'argentina',
      competition: 'worldcup',
      stage: 'Semifinal',
      venue: 'Atlanta Stadium',
      score: '1 — 2',
      status: 'Full time',
    },
    memory: {
      rating: 5,
      moment: { min: '85’', type: 'Goal', player: 'Enzo Fernández' },
      momentImpact: 5,
      note: 'The bar went silent on the short corner. Then Messi rolled it back, Enzo let it fly, and strangers were hugging me before the replay even started.',
      place: 'At a bar',
    },
    visibility: 'public',
    source: 'demo-seed',
    markerEventId: 'e85',
    createdAt: 0,
  },
  {
    // Private seed — must NEVER appear on the public profile. Its presence
    // keeps the privacy rule executable and tested, not aspirational.
    id: 'ch-priv-family',
    matchId: 'wc26-sf-eng-arg',
    match: {
      home: 'england',
      away: 'argentina',
      competition: 'worldcup',
      stage: 'Semifinal',
      score: '1 — 2',
      status: 'Full time',
    },
    memory: {
      rating: 4.5,
      note: 'Called dad at full time. Some things stay between us.',
    },
    visibility: 'private',
    source: 'demo-seed',
    createdAt: 0,
  },
]

/** Signals seeded for the public profile — flavour of the G3B loop, demo only. */
export const SEEDED_SIGNALS = [
  { id: 'sg-checkin', label: 'Checked in live', detail: 'England × Argentina · Semifinal' },
  { id: 'sg-goal', label: 'Goal-moment bonus', detail: '85’ equaliser · Enzo Fernández' },
  { id: 'sg-streak', label: 'Live streak', detail: '5 matches lived in a row' },
]

/* ---- Storage (safe in private mode / SSR) ---- */
function readJSON<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function writeJSON(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — keep in-memory state, don't throw */
  }
}

function loadSession(): DemoSession | null {
  const s = readJSON<DemoSession>(SESSION_KEY)
  return s && typeof s.id === 'string' ? s : null
}
function loadChapters(): DemoChapter[] {
  const env = readJSON<PersistedChapters>(CHAPTERS_KEY)
  if (!env || env.version !== SCHEMA_VERSION || !Array.isArray(env.chapters)) return []
  return env.chapters
}

/* ---- Store (same subscribe/getSnapshot idiom as watchlistStore) ---- */
let session: DemoSession | null = loadSession()
let chapters: DemoChapter[] = loadChapters()
let snapshot = 0
const listeners = new Set<() => void>()
function commit() {
  snapshot++
  listeners.forEach((l) => l())
}

export const demoStore = {
  subscribe(l: () => void) {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getSnapshot() {
    return snapshot
  },

  hasSession(): boolean {
    return session !== null
  },
  getSession(): DemoSession | null {
    return session
  },
  /** No name, no password, no e-mail — just a local visitor id. */
  startSession(): DemoSession {
    if (session) return session
    session = {
      id: `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      username: PUBLIC_USERNAME,
      createdAt: Date.now(),
    }
    writeJSON(SESSION_KEY, session)
    commit()
    return session
  },
  /** Wipe the demo namespace only — nothing else in this origin is touched. */
  reset() {
    session = null
    chapters = []
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(CHAPTERS_KEY)
      } catch {
        /* ignore */
      }
    }
    commit()
  },

  /** Upsert by matchId — re-saving a memory edits the same chapter. */
  saveChapter(input: {
    matchId: string
    match: MatchData
    memory: SavedMemory
    visibility?: ChapterVisibility
    markerEventId?: string
  }): DemoChapter {
    const existing = chapters.find((c) => c.matchId === input.matchId && c.source === 'visitor')
    const chapter: DemoChapter = {
      id: existing?.id ?? `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      matchId: input.matchId,
      match: input.match,
      memory: input.memory,
      visibility: input.visibility ?? 'public',
      source: 'visitor',
      markerEventId: input.markerEventId,
      createdAt: existing?.createdAt ?? Date.now(),
    }
    chapters = existing ? chapters.map((c) => (c.id === existing.id ? chapter : c)) : [...chapters, chapter]
    writeJSON(CHAPTERS_KEY, { version: SCHEMA_VERSION, chapters } satisfies PersistedChapters)
    commit()
    return chapter
  },

  chapterForMatch(matchId: string): DemoChapter | null {
    return chapters.find((c) => c.matchId === matchId && c.source === 'visitor') ?? null
  },
  chapterById(id: string): DemoChapter | null {
    return chapters.find((c) => c.id === id) ?? SEEDED_CHAPTERS.find((c) => c.id === id) ?? null
  },
  /** The ONLY reader public surfaces may use — private never crosses this line. */
  publicChapters(): DemoChapter[] {
    const visitor = chapters.filter((c) => c.visibility === 'public')
    const seeded = SEEDED_CHAPTERS.filter((c) => c.visibility === 'public')
    return [...visitor, ...seeded].sort((a, b) => b.createdAt - a.createdAt)
  },
}
