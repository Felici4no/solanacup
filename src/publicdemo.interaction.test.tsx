// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PublicProfile from './pages/PublicProfile'
import PublicChapter from './pages/PublicChapter'
import { demoStore, SEEDED_CHAPTERS } from './demo/repository'

afterEach(cleanup)
beforeEach(() => demoStore.reset())

const wcMatch = {
  home: 'england',
  away: 'argentina',
  competition: 'worldcup',
  score: '1 — 2',
  status: 'Ended',
} as const

describe('public profile — /u/:username', () => {
  it('is labelled a Demo profile, with simulated data identified once', () => {
    render(<PublicProfile username="demo" />)
    expect(screen.getByText('Demo profile')).toBeTruthy()
    expect(screen.getAllByText('Simulated social data')).toHaveLength(1)
  })
  it('shows bio, clubs, stadiums, ratings, lists and seeded Signals', () => {
    render(<PublicProfile username="demo" />)
    expect(screen.getByText('Lucas Feliciano')).toBeTruthy()
    expect(screen.getByText('São Paulo')).toBeTruthy() // club
    expect(screen.getByText(/Morumbi · São Paulo/)).toBeTruthy() // stadium
    expect(screen.getByText('Avaliações')).toBeTruthy()
    expect(screen.getByText('Listas')).toBeTruthy()
    expect(screen.getByText('Checked in live')).toBeTruthy() // seeded Signal
  })
  it('shows a visitor memory after it is saved (the demo cycle end-to-end)', () => {
    demoStore.saveChapter({ matchId: 'm1', match: wcMatch, memory: { rating: 5, note: 'Unforgettable night.' } })
    render(<PublicProfile username="demo" />)
    expect(screen.getByText(/Unforgettable night/)).toBeTruthy()
  })
  it('never renders private content', () => {
    const seededPrivate = SEEDED_CHAPTERS.find((c) => c.visibility === 'private')!
    demoStore.saveChapter({
      matchId: 'm9',
      match: wcMatch,
      memory: { rating: 4, note: 'strictly personal' },
      visibility: 'private',
    })
    render(<PublicProfile username="demo" />)
    expect(screen.queryByText(/strictly personal/)).toBeNull()
    expect(screen.queryByText(new RegExp(seededPrivate.memory.note.slice(0, 20)))).toBeNull()
  })
  it('renders a gentle not-found for unknown usernames', () => {
    render(<PublicProfile username="someone-else" />)
    expect(screen.getByText(/This profile isn’t here/)).toBeTruthy()
  })
})

describe('public chapter — /chapters/:chapterId', () => {
  it('renders the seeded chapter with its official broadcast moment', () => {
    render(<PublicChapter chapterId="ch-eng-arg-85" />)
    expect(screen.getByText(/bar went silent/)).toBeTruthy()
    expect(screen.getByText('Momento preferido')).toBeTruthy()
    // official video layer at the chapter timestamp, origin visible
    expect(screen.getByRole('region', { name: /Official broadcast moment/i })).toBeTruthy()
    expect(screen.getByText(/Official broadcast moment · CazéTV/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open on YouTube' }).getAttribute('href')).toContain('t=17112s')
    // CTA to the profile
    expect(screen.getByRole('button', { name: 'Open the profile' })).toBeTruthy()
  })
  it('treats private chapters as not found on the public route', () => {
    const priv = demoStore.saveChapter({
      matchId: 'm2',
      match: wcMatch,
      memory: { rating: 4, note: 'between us' },
      visibility: 'private',
    })
    render(<PublicChapter chapterId={priv.id} />)
    expect(screen.getByText(/This chapter isn’t here/)).toBeTruthy()
    expect(screen.queryByText(/between us/)).toBeNull()
  })
  it('renders not-found for unknown ids', () => {
    render(<PublicChapter chapterId="ch-missing" />)
    expect(screen.getByText(/This chapter isn’t here/)).toBeTruthy()
  })
})
