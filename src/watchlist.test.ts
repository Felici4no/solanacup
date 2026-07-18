// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  matchId,
  addMatch,
  removeMatch,
  toggleReminder,
  setWatching,
  watchlistStore,
  LocalStorageWatchlistRepository,
} from './watchlist'

const S = () => watchlistStore.getSnapshot()
const M = { home: 'saopaulo', away: 'riverplate', competition: 'libertadores' }
const id = matchId(M)

describe('matchId', () => {
  it('is stable and derived from teams + competition', () => {
    expect(id).toBe('saopaulo_riverplate_libertadores')
    expect(matchId({ ...M })).toBe(id)
  })
})

describe('pure reducers', () => {
  it('adds a match (reminder on) and is idempotent', () => {
    const a = addMatch({}, id)
    expect(a[id]).toEqual({ reminder: true, watching: false })
    expect(addMatch(a, id)).toBe(a) // no change → same reference
  })
  it('removes a match, restoring the empty state', () => {
    const a = addMatch({}, id)
    expect(removeMatch(a, id)).toEqual({})
    expect(removeMatch({}, id)).toEqual({})
  })
  it('toggles the reminder only when saved', () => {
    const a = addMatch({}, id)
    expect(toggleReminder(a, id)[id].reminder).toBe(false)
    expect(toggleReminder({}, id)).toEqual({}) // not saved → no-op
  })
  it('sets watching, creating the entry if needed', () => {
    expect(setWatching({}, id, true)[id]).toEqual({ reminder: true, watching: true })
  })
})

describe('persisted store', () => {
  beforeEach(() => {
    localStorage.clear()
    watchlistStore.reset()
  })

  it('add persists inside a versioned envelope', () => {
    watchlistStore.add(id)
    expect(S()[id]).toBeTruthy()
    const env = JSON.parse(localStorage.getItem('vez.watchlist')!)
    expect(env.version).toBe(1)
    expect(env.matches[id]).toBeTruthy()
  })

  it('reminder toggle persists (survives a reload of the same store)', () => {
    watchlistStore.add(id)
    watchlistStore.toggleReminder(id)
    expect(S()[id].reminder).toBe(false)
    // simulate reload: re-parse the persisted envelope
    const reloaded = JSON.parse(localStorage.getItem('vez.watchlist')!)
    expect(reloaded.matches[id].reminder).toBe(false)
  })

  it('ignores an unknown/legacy persisted shape instead of crashing', () => {
    const repo = new LocalStorageWatchlistRepository('vez.legacy')
    localStorage.setItem('vez.legacy', JSON.stringify({ [id]: { reminder: true, watching: false } }))
    expect(repo.load()).toEqual({}) // no version envelope → start clean
    localStorage.setItem('vez.legacy', JSON.stringify({ version: 1, matches: { [id]: { reminder: false, watching: true } } }))
    expect(repo.load()[id]).toEqual({ reminder: false, watching: true })
  })

  it('remove restores the unsaved state', () => {
    watchlistStore.add(id)
    watchlistStore.remove(id)
    expect(S()[id]).toBeUndefined()
  })

  it('seed only applies to an empty store', () => {
    watchlistStore.add('x_y_z')
    watchlistStore.seed([id]) // store not empty → ignored
    expect(S()[id]).toBeUndefined()
    watchlistStore.reset()
    watchlistStore.seed([id])
    expect(S()[id]).toBeTruthy()
  })
})
