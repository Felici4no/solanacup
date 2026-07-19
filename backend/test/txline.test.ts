import { describe, it, expect } from 'vitest'
import nacl from 'tweetnacl'
import { Keypair } from '@solana/web3.js'
import { buildActivationMessage, signActivationMessage } from '../src/txline/auth.js'
import { epochDay } from '../src/config.js'
import {
  normalizeFixture,
  normalizeScore,
  buildMatchState,
  isLiveState,
  isEndedState,
} from '../src/services/worldcup.js'
import type { Fixture, Scores } from '../src/txline/types.js'

/* ============================================================ activation */
describe('activation message (quickstart format, followed verbatim)', () => {
  it('standard bundle (empty leagues) → `txSig::jwt`', () => {
    expect(buildActivationMessage('SIG', [], 'JWT')).toBe('SIG::JWT')
  })
  it('league selection joins with commas', () => {
    expect(buildActivationMessage('SIG', [72, 101], 'JWT')).toBe('SIG:72,101:JWT')
  })
  it('detached ed25519 signature verifies against the wallet pubkey', () => {
    const wallet = Keypair.generate()
    const message = buildActivationMessage('3xY…sig', [], 'eyJ…jwt')
    const b64 = signActivationMessage(message, wallet)
    const ok = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      Uint8Array.from(Buffer.from(b64, 'base64')),
      wallet.publicKey.toBytes(),
    )
    expect(ok).toBe(true)
  })
})

/* ============================================================ epoch day */
describe('epochDay', () => {
  it('is days since the Unix epoch (UTC)', () => {
    expect(epochDay(0)).toBe(0)
    expect(epochDay(86_400_000)).toBe(1)
    expect(epochDay(86_399_999)).toBe(0)
    // 2026-06-11 (WC kickoff era) sanity: matches the official example magnitude (~20 6xx)
    expect(epochDay(Date.UTC(2026, 5, 11))).toBe(20615)
  })
})

/* ============================================================ normalization */
const FIXTURE: Fixture = {
  Ts: 1_700_000_000_000,
  StartTime: 1_780_000_000_000,
  Competition: 'World Cup',
  CompetitionId: 72,
  FixtureGroupId: 1,
  Participant1Id: 501,
  Participant1: 'Brazil',
  Participant2Id: 502,
  Participant2: 'England',
  FixtureId: 9001,
  Participant1IsHome: true,
}

function score(partial: Partial<Scores> & { action?: string }): Scores {
  return {
    fixtureId: 9001,
    gameState: 'H11',
    startTime: FIXTURE.StartTime,
    isTeam: true,
    fixtureGroupId: 1,
    competitionId: 72,
    countryId: 0,
    sportId: 1,
    participant1IsHome: true,
    participant1Id: 501,
    participant2Id: 502,
    action: '{}',
    id: 1,
    ts: Date.now(),
    connectionId: 1,
    seq: 1,
    ...partial,
  }
}

describe('fixture normalization', () => {
  it('maps home/away respecting Participant1IsHome', () => {
    const f = normalizeFixture(FIXTURE)
    expect(f).toMatchObject({ home: 'Brazil', away: 'England', homeId: 501, awayId: 502, fixtureId: 9001 })
  })
  it('swaps sides when Participant1 is not home', () => {
    const f = normalizeFixture({ ...FIXTURE, Participant1IsHome: false })
    expect(f).toMatchObject({ home: 'England', away: 'Brazil', homeId: 502, awayId: 501 })
  })
})

describe('score normalization', () => {
  it('classifies a goal with team + minute', () => {
    const e = normalizeScore(score({ action: JSON.stringify({ Goal: true, Participant: 501, Minutes: 87 }) }))
    expect(e).toMatchObject({ type: 'goal', team: 'home', minute: 87 })
  })
  it('classifies penalty goals, cards and corners', () => {
    expect(normalizeScore(score({ action: JSON.stringify({ Goal: true, Penalty: true, Participant: 502 }) })).type).toBe('penalty')
    expect(normalizeScore(score({ action: JSON.stringify({ YellowCard: true, Participant: 502 }) }))).toMatchObject({ type: 'yellow_card', team: 'away' })
    expect(normalizeScore(score({ action: JSON.stringify({ RedCard: true }) })).type).toBe('red_card')
    expect(normalizeScore(score({ action: JSON.stringify({ Corner: true, Participant: 501 }) })).type).toBe('corner')
  })
  it('tolerates malformed action JSON', () => {
    expect(normalizeScore(score({ action: 'not-json' })).type).toBe('other')
  })
})

describe('match state', () => {
  it('counts goals into a score and takes the latest gameState', () => {
    const records = [
      score({ seq: 1, action: JSON.stringify({ Goal: true, Participant: 501, Minutes: 12 }) }),
      score({ seq: 2, action: JSON.stringify({ Goal: true, Participant: 502, Minutes: 40 }) }),
      score({ seq: 3, gameState: 'H21', action: JSON.stringify({ Goal: true, Participant: 501, Minutes: 84 }) }),
    ]
    const m = buildMatchState(9001, records)
    expect(m.score).toEqual({ home: 2, away: 1 })
    expect(m.gameState).toBe('H21')
    expect(m.live).toBe(true)
  })
  it('live/ended state classification', () => {
    expect(isLiveState('H11')).toBe(true)
    expect(isLiveState('ET2')).toBe(true)
    expect(isLiveState('NS2')).toBe(false)
    expect(isEndedState('END')).toBe(true)
    expect(isEndedState('H11')).toBe(false)
  })
})
