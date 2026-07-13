// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { NavContext, type Nav } from './nav'
import { watchlistStore, matchId } from './watchlist'
import { profile } from './data'
import MatchDetail from './pages/MatchDetail'
import WatchlistMatch from './pages/WatchlistMatch'
import Watchlist from './pages/Watchlist'
import Profile from './pages/Profile'
import type { MatchData } from './MatchCover'

const MATCH: MatchData = { home: 'saopaulo', away: 'riverplate', competition: 'libertadores' }
const ID = matchId(MATCH)

function renderWithNav(ui: React.ReactNode, nav: Partial<Nav> = {}) {
  const value: Nav = {
    openMatch: vi.fn(),
    openWatchlist: vi.fn(),
    openWatchlistMatch: vi.fn(),
    openProfileEdit: vi.fn(),
    openSettings: vi.fn(),
    back: vi.fn(),
    ...nav,
  }
  return { value, ...render(<NavContext.Provider value={value}>{ui}</NavContext.Provider>) }
}

beforeEach(() => {
  localStorage.clear()
  watchlistStore.reset()
})
afterEach(cleanup)

describe('Match Detail — Watchlist state and action always agree', () => {
  it('Add to Watchlist changes state and removes the Add button', async () => {
    renderWithNav(<MatchDetail match={MATCH} />)
    // not saved → promo + Add, and no contradictory "saved" copy
    expect(screen.getByRole('button', { name: 'Add to Watchlist' })).toBeTruthy()
    expect(screen.queryByText('You plan to watch this match')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Add to Watchlist' }))

    // saved → status row appears, Add button is gone
    await screen.findByText('You plan to watch this match')
    expect(screen.queryByRole('button', { name: 'Add to Watchlist' })).toBeNull()
    expect(watchlistStore.getSnapshot()[ID]).toBeTruthy()
  })

  it('the saved status row navigates to /watchlist/:matchId', () => {
    watchlistStore.add(ID)
    const { value } = renderWithNav(<MatchDetail match={MATCH} />)
    fireEvent.click(screen.getByRole('button', { name: /Manage this match in your Watchlist/i }))
    expect(value.openWatchlistMatch).toHaveBeenCalledWith(MATCH)
  })
})

describe('WatchlistMatch — manage', () => {
  it('reminder toggles and persists', () => {
    watchlistStore.add(ID)
    renderWithNav(<WatchlistMatch match={MATCH} />)
    expect(screen.getByRole('button', { name: 'Turn Reminder Off' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Turn Reminder Off' }))
    expect(screen.getByRole('button', { name: 'Turn Reminder On' })).toBeTruthy()
    expect(watchlistStore.getSnapshot()[ID].reminder).toBe(false)
  })

  it('Remove restores the Not Saved state', () => {
    watchlistStore.add(ID)
    renderWithNav(<WatchlistMatch match={MATCH} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove from Watchlist' }))
    expect(screen.getByRole('button', { name: 'Add to Watchlist' })).toBeTruthy()
    expect(watchlistStore.getSnapshot()[ID]).toBeUndefined()
  })

  it('state persists across a remount (reload)', () => {
    watchlistStore.add(ID)
    const first = renderWithNav(<WatchlistMatch match={MATCH} />)
    expect(screen.getByRole('button', { name: 'Remove from Watchlist' })).toBeTruthy()
    first.unmount()
    renderWithNav(<WatchlistMatch match={MATCH} />)
    expect(screen.getByRole('button', { name: 'Remove from Watchlist' })).toBeTruthy()
  })
})

describe('Watchlist list — every action is wired', () => {
  it('Manage opens the per-match route and reminder toggles', () => {
    watchlistStore.seed([ID]) // curated items start saved
    const { value } = renderWithNav(<Watchlist />)
    const manage = screen.getAllByRole('button', { name: 'Manage' })[0]
    fireEvent.click(manage)
    expect(value.openWatchlistMatch).toHaveBeenCalled()

    const reminder = screen.getAllByRole('button', { name: 'Reminder on' })[0]
    fireEvent.click(reminder)
    expect(screen.getAllByRole('button', { name: 'Reminder off' }).length).toBeGreaterThan(0)
  })
})

describe('Profile — Edit routes are valid', () => {
  it('Editar opens /profile/edit', () => {
    const { value } = renderWithNav(<Profile />)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(value.openProfileEdit).toHaveBeenCalled()
  })

  it('the streak card navigates instead of being a dead control', () => {
    const { value } = renderWithNav(<Profile />)
    fireEvent.click(screen.getByRole('button', { name: /sequência/i }))
    expect(value.openWatchlist).toHaveBeenCalled()
  })
})

describe('no leftover decorative diamond / contradictory copy', () => {
  it('Match Detail never renders the gold diamond marker', () => {
    watchlistStore.add(ID)
    const { container } = renderWithNav(<MatchDetail match={MATCH} />)
    expect(container.querySelector('.mc-mark')).toBeNull()
    expect(container.textContent).not.toContain('◆')
  })
})

// keep the profile object clean for other tests
afterEach(() => {
  profile.name = 'Lucas Feliciano'
})
