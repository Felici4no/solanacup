// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { demoStore, SEEDED_CHAPTERS, PUBLIC_USERNAME } from './repository'
import type { MatchData } from '../MatchCover'

const wcMatch: MatchData = {
  home: 'england',
  away: 'argentina',
  competition: 'worldcup',
  score: '1 — 2',
  status: 'Ended',
}

beforeEach(() => {
  demoStore.reset()
})

describe('demo session', () => {
  it('starts with no session and no fake identity', () => {
    expect(demoStore.hasSession()).toBe(false)
    expect(demoStore.getSession()).toBeNull()
  })
  it('mints a local visitor id — no name, password or e-mail', () => {
    const s = demoStore.startSession()
    expect(s.id).toMatch(/^visitor-/)
    expect(s.username).toBe(PUBLIC_USERNAME)
    expect(Object.keys(s).sort()).toEqual(['createdAt', 'id', 'username'])
  })
  it('persists the session in the g3b.demo namespace', () => {
    demoStore.startSession()
    expect(localStorage.getItem('g3b.demo.session')).toBeTruthy()
  })
  it('is idempotent — starting twice keeps the same visitor', () => {
    const a = demoStore.startSession()
    const b = demoStore.startSession()
    expect(b.id).toBe(a.id)
  })
})

describe('chapters', () => {
  it('saves a chapter and exposes it publicly by default', () => {
    const ch = demoStore.saveChapter({
      matchId: 'm1',
      match: wcMatch,
      memory: { rating: 4.5, note: 'What a night.' },
    })
    expect(demoStore.chapterById(ch.id)?.memory.note).toBe('What a night.')
    expect(demoStore.publicChapters().some((c) => c.id === ch.id)).toBe(true)
  })
  it('upserts by matchId — editing rewrites the same chapter', () => {
    const a = demoStore.saveChapter({ matchId: 'm1', match: wcMatch, memory: { rating: 3, note: 'first' } })
    const b = demoStore.saveChapter({ matchId: 'm1', match: wcMatch, memory: { rating: 5, note: 'second' } })
    expect(b.id).toBe(a.id)
    expect(demoStore.publicChapters().filter((c) => c.matchId === 'm1')).toHaveLength(1)
    expect(demoStore.chapterForMatch('m1')?.memory.note).toBe('second')
  })
  it('NEVER lets private chapters cross into the public list', () => {
    const priv = demoStore.saveChapter({
      matchId: 'm2',
      match: wcMatch,
      memory: { rating: 4, note: 'between us' },
      visibility: 'private',
    })
    expect(demoStore.publicChapters().some((c) => c.id === priv.id)).toBe(false)
    // the seeded private chapter obeys the same rule
    const seededPrivate = SEEDED_CHAPTERS.find((c) => c.visibility === 'private')!
    expect(demoStore.publicChapters().some((c) => c.id === seededPrivate.id)).toBe(false)
  })
  it('resolves the seeded public chapter in any browser (no local state)', () => {
    const seeded = demoStore.chapterById('ch-eng-arg-85')
    expect(seeded?.visibility).toBe('public')
    expect(seeded?.markerEventId).toBe('e85')
    expect(seeded?.source).toBe('demo-seed')
  })
})

describe('reset & isolation', () => {
  it('reset clears only the demo namespace', () => {
    localStorage.setItem('vez.watchlist', '{"version":1,"matches":{}}')
    demoStore.startSession()
    demoStore.saveChapter({ matchId: 'm1', match: wcMatch, memory: { rating: 4, note: 'x' } })
    demoStore.reset()
    expect(demoStore.hasSession()).toBe(false)
    expect(demoStore.chapterForMatch('m1')).toBeNull()
    expect(localStorage.getItem('g3b.demo.session')).toBeNull()
    expect(localStorage.getItem('g3b.demo.chapters')).toBeNull()
    // the rest of the origin is untouched
    expect(localStorage.getItem('vez.watchlist')).toBe('{"version":1,"matches":{}}')
  })
})
