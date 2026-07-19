import { describe, it, expect } from 'vitest'
import {
  gameStateToStatus,
  normalizeTeamId,
  normalizeFixtureToHomeMatch,
  selectHomeMatch,
  selectUpcoming,
  localDateStr,
  isLocalToday,
  type HomeMatch,
} from './homeMatch'
import type { LiveFixture, LiveMatchState } from './live/client'

// ---- Helpers for test fixtures ----
function makeFixture(overrides: Partial<LiveFixture> = {}): LiveFixture {
  return {
    fixtureId: 1,
    competition: 'FIFA World Cup',
    home: 'France',
    away: 'England',
    kickoff: Date.now(),
    ...overrides,
  }
}

function makeState(gameState: string, score = { home: 0, away: 0 }): LiveMatchState {
  return { fixtureId: 1, gameState, live: gameState !== 'NS2', score, events: [] }
}

function makeHomeMatch(overrides: Partial<HomeMatch>): HomeMatch {
  return {
    id: '1',
    fixtureId: 1,
    competition: 'FIFA World Cup',
    homeTeam: { id: 'france', name: 'France' },
    awayTeam: { id: 'england', name: 'England' },
    startsAt: new Date().toISOString(),
    status: 'scheduled',
    source: 'txline',
    ...overrides,
  }
}

// ---- gameStateToStatus ----
describe('gameStateToStatus', () => {
  it('maps H11 to live', () => expect(gameStateToStatus('H11')).toBe('live'))
  it('maps H21 to live', () => expect(gameStateToStatus('H21')).toBe('live'))
  it('maps ET1 to live', () => expect(gameStateToStatus('ET1')).toBe('live'))
  it('maps PE to live', () => expect(gameStateToStatus('PE')).toBe('live'))
  it('maps HT2 to halftime', () => expect(gameStateToStatus('HT2')).toBe('halftime'))
  it('maps HTET to halftime', () => expect(gameStateToStatus('HTET')).toBe('halftime'))
  it('maps END to finished', () => expect(gameStateToStatus('END')).toBe('finished'))
  it('maps F2 to finished', () => expect(gameStateToStatus('F2')).toBe('finished'))
  it('maps WPE to finished', () => expect(gameStateToStatus('WPE')).toBe('finished'))
  it('maps NS2 to scheduled', () => expect(gameStateToStatus('NS2')).toBe('scheduled'))
  it('maps unknown to scheduled', () => expect(gameStateToStatus('UNKNOWN')).toBe('scheduled'))
})

// ---- normalizeTeamId ----
describe('normalizeTeamId', () => {
  it('maps France', () => expect(normalizeTeamId('France')).toBe('france'))
  it('maps England', () => expect(normalizeTeamId('England')).toBe('england'))
  it('maps Argentina', () => expect(normalizeTeamId('Argentina')).toBe('argentina'))
  it('maps Spain', () => expect(normalizeTeamId('Spain')).toBe('spain'))
  it('maps Brazil', () => expect(normalizeTeamId('Brazil')).toBe('brazil'))
  it('handles unknown name', () => expect(normalizeTeamId('Côte d\'Ivoire')).toBe("côted'ivoire"))
  it('strips spaces', () => expect(normalizeTeamId('South Korea')).toBe('southkorea'))
})

// ---- normalizeFixtureToHomeMatch ----
describe('normalizeFixtureToHomeMatch', () => {
  it('produces scheduled status when no state', () => {
    const m = normalizeFixtureToHomeMatch(makeFixture(), null)
    expect(m.status).toBe('scheduled')
  })

  it('produces finished for END gameState', () => {
    const m = normalizeFixtureToHomeMatch(makeFixture(), makeState('END', { home: 4, away: 6 }))
    expect(m.status).toBe('finished')
    expect(m.homeScore).toBe(4)
    expect(m.awayScore).toBe(6)
  })

  it('produces live for H11 gameState', () => {
    const m = normalizeFixtureToHomeMatch(makeFixture(), makeState('H11', { home: 1, away: 0 }))
    expect(m.status).toBe('live')
  })

  it('maps team names to ids', () => {
    const m = normalizeFixtureToHomeMatch(makeFixture({ home: 'France', away: 'England' }), null)
    expect(m.homeTeam.id).toBe('france')
    expect(m.awayTeam.id).toBe('england')
  })

  it('carries competition', () => {
    const m = normalizeFixtureToHomeMatch(makeFixture(), null)
    expect(m.competition).toBe('FIFA World Cup')
  })
})

// ---- localDateStr / isLocalToday ----
describe('localDateStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = localDateStr(new Date('2026-07-18T12:00:00Z').getTime(), 'America/Sao_Paulo')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accounts for timezone offset (São Paulo is UTC-3)', () => {
    // 2026-07-18T01:00:00Z = 2026-07-17T22:00:00 in São Paulo
    const utcDate = new Date('2026-07-18T01:00:00Z').getTime()
    const brDate = localDateStr(utcDate, 'America/Sao_Paulo')
    expect(brDate).toBe('2026-07-17')
  })

  it('gives today for current time', () => {
    expect(isLocalToday(Date.now())).toBe(true)
  })

  it('gives false for yesterday', () => {
    const yesterday = Date.now() - 25 * 3600 * 1000
    expect(isLocalToday(yesterday)).toBe(false)
  })
})

// ---- selectHomeMatch ----
describe('selectHomeMatch', () => {
  it('returns null for empty list', () => {
    expect(selectHomeMatch([])).toBeNull()
  })

  it('prefers live over finished today', () => {
    const live = makeHomeMatch({ id: '1', status: 'live', startsAt: new Date().toISOString() })
    const finished = makeHomeMatch({ id: '2', status: 'finished', startsAt: new Date().toISOString() })
    expect(selectHomeMatch([finished, live])?.id).toBe('1')
  })

  it('prefers finished today over scheduled today', () => {
    const finished = makeHomeMatch({ id: '2', status: 'finished', startsAt: new Date().toISOString() })
    const scheduled = makeHomeMatch({ id: '3', status: 'scheduled', startsAt: new Date().toISOString() })
    expect(selectHomeMatch([scheduled, finished])?.id).toBe('2')
  })

  it('prefers scheduled today over future', () => {
    const today = makeHomeMatch({
      id: '3',
      status: 'scheduled',
      startsAt: new Date().toISOString(),
    })
    const future = makeHomeMatch({
      id: '4',
      status: 'scheduled',
      startsAt: new Date(Date.now() + 2 * 86400_000).toISOString(),
    })
    expect(selectHomeMatch([future, today])?.id).toBe('3')
  })

  it('falls back to next future when nothing today', () => {
    const tomorrow = new Date(Date.now() + 86400_000).toISOString()
    const dayAfter = new Date(Date.now() + 2 * 86400_000).toISOString()
    const a = makeHomeMatch({ id: '10', status: 'scheduled', startsAt: dayAfter })
    const b = makeHomeMatch({ id: '11', status: 'scheduled', startsAt: tomorrow })
    expect(selectHomeMatch([a, b])?.id).toBe('11')
  })

  // Validates with the real data scenario described in the user prompt
  it('France 4-6 England finished today is selected as chapter', () => {
    const france4eng6: HomeMatch = {
      id: '900100',
      fixtureId: 900100,
      competition: 'FIFA World Cup',
      stage: 'Bronze final',
      homeTeam: { id: 'france', name: 'France' },
      awayTeam: { id: 'england', name: 'England' },
      homeScore: 4,
      awayScore: 6,
      startsAt: new Date().toISOString(), // simulated as today
      status: 'finished',
      source: 'snapshot',
    }
    const spainArgFinal: HomeMatch = {
      id: '900101',
      fixtureId: 900101,
      competition: 'FIFA World Cup',
      stage: 'Final',
      homeTeam: { id: 'spain', name: 'Spain' },
      awayTeam: { id: 'argentina', name: 'Argentina' },
      startsAt: new Date(Date.now() + 86400_000).toISOString(), // tomorrow
      status: 'scheduled',
      source: 'snapshot',
    }
    const featured = selectHomeMatch([france4eng6, spainArgFinal])
    expect(featured?.id).toBe('900100')
    expect(featured?.status).toBe('finished')
    expect(featured?.homeScore).toBe(4)
    expect(featured?.awayScore).toBe(6)

    const upcoming = selectUpcoming([france4eng6, spainArgFinal], '900100')
    expect(upcoming[0].id).toBe('900101')
  })
})
