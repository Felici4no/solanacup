// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, renderHook, act } from '@testing-library/react'
import { NavContext, type Nav } from './nav'
import {
  watchlistStore,
  matchId,
  setWatchlistRepository,
  LocalStorageWatchlistRepository,
  type WatchlistRepository,
  type WatchlistState,
} from './watchlist'
import { ok, err, faults, useAction, type RepositoryResult } from './repository'
import { profile } from './data'
import MatchDetail from './pages/MatchDetail'
import ProfileEdit from './pages/ProfileEdit'
import { CommentComposer, CompleteMemoryEditor } from './community'
import type { MatchData } from './MatchCover'

const MATCH: MatchData = { home: 'saopaulo', away: 'riverplate', competition: 'libertadores' }
const ID = matchId(MATCH)

class FailingRepo implements WatchlistRepository {
  constructor(public failing = true) {}
  load(): WatchlistState {
    return {}
  }
  async save(): Promise<RepositoryResult<void>> {
    return this.failing ? err('storage_write_failed', 'injected failure') : ok()
  }
}

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
  faults.clear()
  setWatchlistRepository(new LocalStorageWatchlistRepository())
  watchlistStore.reset()
})
afterEach(() => {
  cleanup()
  faults.clear()
  setWatchlistRepository(new LocalStorageWatchlistRepository())
  profile.name = 'Lucas Feliciano'
  profile.location = 'São Paulo, SP'
  profile.tagline = 'Vivo o esporte através da memória.'
})

/* ============================================================ store rollback */
describe('watchlist store — optimistic commit with rollback', () => {
  it('add rolls back to the last confirmed state when the write fails', async () => {
    setWatchlistRepository(new FailingRepo())
    const res = await watchlistStore.add(ID)
    expect(res.ok).toBe(false)
    expect(watchlistStore.getSnapshot()[ID]).toBeUndefined() // no contradictory state
  })

  it('toggleReminder restores the previous confirmed value on failure', async () => {
    const repo = new FailingRepo(false)
    setWatchlistRepository(repo)
    await watchlistStore.add(ID)
    repo.failing = true
    const res = await watchlistStore.toggleReminder(ID)
    expect(res.ok).toBe(false)
    expect(watchlistStore.getSnapshot()[ID].reminder).toBe(true) // still on
  })

  it('works identically with an asynchronous (API-like) repository', async () => {
    class SlowRepo implements WatchlistRepository {
      load(): WatchlistState { return {} }
      save(): Promise<RepositoryResult<void>> {
        return new Promise((r) => setTimeout(() => r(ok()), 15))
      }
    }
    setWatchlistRepository(new SlowRepo())
    const res = await watchlistStore.add(ID)
    expect(res.ok).toBe(true)
    expect(watchlistStore.getSnapshot()[ID]).toBeTruthy()
  })
})

/* ============================================================ useAction */
describe('useAction — pending blocks duplicate submits, retry replays', () => {
  it('runs the operation once while pending', async () => {
    let resolve!: (r: RepositoryResult<void>) => void
    const fn = vi.fn(() => new Promise<RepositoryResult<void>>((r) => (resolve = r)))
    const { result } = renderHook(() => useAction(fn))

    let p1!: Promise<unknown>
    act(() => {
      p1 = result.current.run()
      void result.current.run() // duplicate while pending → blocked
    })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBe(true)
    await act(async () => {
      resolve(ok())
      await p1
    })
    expect(result.current.status).toBe('success')
  })

  it('retry replays the last arguments after a failure', async () => {
    const fn = vi
      .fn<(n: number) => Promise<RepositoryResult<void>>>()
      .mockResolvedValueOnce(err('network', 'down'))
      .mockResolvedValueOnce(ok())
    const { result } = renderHook(() => useAction(fn))
    await act(async () => {
      await result.current.run(42)
    })
    expect(result.current.failed).toBe(true)
    await act(async () => {
      await result.current.retry()
    })
    expect(result.current.status).toBe('success')
    expect(fn).toHaveBeenNthCalledWith(2, 42)
  })
})

/* ============================================================ Watchlist UI */
describe('Match Detail — recoverable Add to Watchlist', () => {
  it('failure shows an accessible error, keeps the Add state, and retry succeeds', async () => {
    const repo = new FailingRepo(true)
    setWatchlistRepository(repo)
    renderWithNav(<MatchDetail match={MATCH} />)

    fireEvent.click(screen.getByRole('button', { name: /Add to Watchlist/i }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Couldn’t save this match')
    // rolled back: still not saved, action still available — no contradiction
    expect(screen.getByRole('button', { name: /Add to Watchlist/i })).toBeTruthy()
    expect(screen.queryByText('You plan to watch this match')).toBeNull()

    repo.failing = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText('You plan to watch this match')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

/* ============================================================ Profile */
describe('ProfileEdit — failure preserves fields and supports retry', () => {
  it('shows the error, keeps typed values, and retry saves + navigates back', async () => {
    faults.add('vez.profile')
    const { value } = renderWithNav(<ProfileEdit />)

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Lucas F.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByRole('alert')
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Lucas F.') // preserved
    expect(value.back).not.toHaveBeenCalled()
    expect(profile.name).toBe('Lucas Feliciano') // not applied on failure

    faults.delete('vez.profile')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(value.back).toHaveBeenCalled())
    expect(profile.name).toBe('Lucas F.')
  })
})

/* ============================================================ Annotation */
describe('CommentComposer — failure keeps the text in the editor', () => {
  it('failed post preserves the note and retry publishes it', async () => {
    faults.add('vez.annotations')
    render(<CommentComposer anchor="87’ · Goal" />)

    const box = screen.getByPlaceholderText(/Share what this moment/) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: 'Never forgot this.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post' }))

    await screen.findByRole('alert')
    expect(box.value).toBe('Never forgot this.') // text still there

    faults.delete('vez.annotations')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByRole('button', { name: 'Posted' })
    expect((screen.getByPlaceholderText(/Share what this moment/) as HTMLTextAreaElement).value).toBe('')
  })
})

/* ============================================================ Memory editor */
describe('CompleteMemoryEditor — failed save keeps the editor and data', () => {
  it('shows the error with everything intact, then retry completes the save', async () => {
    const onSave = vi.fn()
    const persist = vi
      .fn<() => Promise<RepositoryResult<void>>>()
      .mockResolvedValueOnce(err('storage_write_failed', 'nope'))
      .mockResolvedValueOnce(ok())
    render(<CompleteMemoryEditor moments={[{ min: '87’', type: 'Goal', player: 'Calleri' }]} onSave={onSave} persist={persist} />)

    // rate via keyboard to reveal the rest of the editor
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Match rating' }), { key: 'End' })
    const note = await screen.findByPlaceholderText(/What do you want to remember/)
    fireEvent.change(note, { target: { value: 'Dad squeezed my shoulder.' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save Memory' }))
    await screen.findByRole('alert')
    expect(onSave).not.toHaveBeenCalled()
    expect((screen.getByPlaceholderText(/What do you want to remember/) as HTMLTextAreaElement).value).toBe(
      'Dad squeezed my shoulder.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
  })
})
