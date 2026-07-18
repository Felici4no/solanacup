import { describe, it, expect } from 'vitest'
import { momentId } from '../src/domain/moments.js'
import {
  SIGNAL_RULES,
  validateSignalAmount,
  validateSignalIncrease,
} from '../src/domain/signals.js'
import {
  earlyMultiplier,
  verifiedWatchMultiplier,
  qualityMultiplier,
  signalWeight,
  distributeDiscoveryPool,
  badgesFor,
  settlementAmounts,
} from '../src/domain/discovery.js'
import {
  indexedBalance,
  pendingEntries,
  hasSettlementEntry,
  type LedgerEntry,
} from '../src/domain/ledger.js'

/* ============================================================ moment identity */
describe('momentId', () => {
  const base = { matchId: '900026', minute: 87, type: 'goal' as const, team: 'home' as const, playerId: 'calleri', seq: 11 }

  it('prefers the TxLINE event id when the feed provides one', () => {
    expect(momentId({ ...base, txlineEventId: 55123 })).toBe('tx_55123')
  })

  it('is deterministic across restarts when hashing', () => {
    expect(momentId(base)).toBe(momentId({ ...base }))
    expect(momentId(base)).toMatch(/^mh_[0-9a-f]{16}$/)
  })

  it('distinguishes events that differ in any defining field', () => {
    const ids = new Set([
      momentId(base),
      momentId({ ...base, minute: 88 }),
      momentId({ ...base, stoppageTime: 2 }),
      momentId({ ...base, type: 'chance' }),
      momentId({ ...base, team: 'away' }),
      momentId({ ...base, playerId: 'luciano' }),
      momentId({ ...base, seq: 12 }),
    ])
    expect(ids.size).toBe(7)
  })
})

/* ============================================================ signal rules */
describe('signal rules', () => {
  it('enforces the conviction range', () => {
    expect(validateSignalAmount(SIGNAL_RULES.MIN_AMOUNT)).toBeNull()
    expect(validateSignalAmount(SIGNAL_RULES.MAX_AMOUNT)).toBeNull()
    expect(validateSignalAmount(4)).toBe('below_minimum')
    expect(validateSignalAmount(101)).toBe('above_maximum')
    expect(validateSignalAmount(Number.NaN)).toBe('below_minimum')
  })

  it('allows updates only as increases, still bounded by the maximum', () => {
    expect(validateSignalIncrease(10, 25)).toBeNull()
    expect(validateSignalIncrease(10, 10)).toBe('not_an_increase')
    expect(validateSignalIncrease(10, 5)).toBe('not_an_increase')
    expect(validateSignalIncrease(10, 120)).toBe('above_maximum')
  })
})

/* ============================================================ weighting */
describe('weighting', () => {
  it('rewards backing first', () => {
    expect(earlyMultiplier(1)).toBe(2.0)
    expect(earlyMultiplier(3)).toBe(1.5)
    expect(earlyMultiplier(10)).toBe(1.2)
    expect(earlyMultiplier(50)).toBe(1.0)
  })

  it('rewards a verified watch session', () => {
    expect(verifiedWatchMultiplier(true)).toBe(1.5)
    expect(verifiedWatchMultiplier(false)).toBe(1.0)
  })

  it('keeps quality neutral in the MVP', () => {
    expect(qualityMultiplier()).toBe(1)
  })

  it('damps conviction size with sqrt — 100x stake is only 10x weight', () => {
    const small = signalWeight({ amount: 1, entryRank: 20, verifiedWatch: false })
    const whale = signalWeight({ amount: 100, entryRank: 20, verifiedWatch: false })
    expect(whale / small).toBeCloseTo(10, 6)
  })
})

/* ============================================================ distribution */
describe('distributeDiscoveryPool', () => {
  const entries = [
    { signalId: 's1', userId: 'u1', amount: 25, entryRank: 1, verifiedWatch: true },
    { signalId: 's2', userId: 'u2', amount: 25, entryRank: 2, verifiedWatch: false },
    { signalId: 's3', userId: 'u3', amount: 25, entryRank: 8, verifiedWatch: false },
    { signalId: 's4', userId: 'u4', amount: 25, entryRank: 30, verifiedWatch: false },
  ]

  it('never distributes more than the pool', () => {
    const d = distributeDiscoveryPool({ discoveryPool: 100, entries })
    expect(d.distributed).toBeLessThanOrEqual(100)
    expect(d.distributed + d.residual).toBeCloseTo(100, 6)
  })

  it('caps any single fan at 25% of the pool and leaves the rest as residual', () => {
    const d = distributeDiscoveryPool({
      discoveryPool: 100,
      entries: [
        { signalId: 's1', userId: 'whale', amount: 100, entryRank: 1, verifiedWatch: true },
        { signalId: 's2', userId: 'small', amount: 5, entryRank: 40, verifiedWatch: false },
      ],
    })
    const whale = d.rows.find((r) => r.userId === 'whale')!
    expect(whale.reward).toBeLessThanOrEqual(25)
    expect(whale.capped).toBe(true)
    expect(d.residual).toBeGreaterThan(0)
    // residual is never attributed to a user
    expect(d.rows.reduce((s, r) => s + r.reward, 0)).toBeCloseTo(d.distributed, 6)
  })

  it('ranks earlier backers above later ones at equal conviction', () => {
    const d = distributeDiscoveryPool({ discoveryPool: 100, entries })
    const byId = Object.fromEntries(d.rows.map((r) => [r.signalId, r.reward]))
    expect(byId.s1).toBeGreaterThan(byId.s2)
    expect(byId.s2).toBeGreaterThan(byId.s3)
    expect(byId.s3).toBeGreaterThan(byId.s4)
  })

  it('handles an empty round without dividing by zero', () => {
    const d = distributeDiscoveryPool({ discoveryPool: 100, entries: [] })
    expect(d.distributed).toBe(0)
    expect(d.residual).toBe(100)
  })

  it('handles a zero pool', () => {
    const d = distributeDiscoveryPool({ discoveryPool: 0, entries })
    expect(d.distributed).toBe(0)
    expect(d.residual).toBe(0)
  })
})

/* ============================================================ badges */
describe('badgesFor', () => {
  it('awards first call only to entry rank 1', () => {
    expect(badgesFor({ entryRank: 1, resonanceSupporters: 1 })).toContain('first_call')
    expect(badgesFor({ entryRank: 2, resonanceSupporters: 1 })).not.toContain('first_call')
  })
  it('awards early supporter to the first three', () => {
    expect(badgesFor({ entryRank: 3, resonanceSupporters: 1 })).toContain('early_supporter')
    expect(badgesFor({ entryRank: 4, resonanceSupporters: 1 })).not.toContain('early_supporter')
  })
  it('awards crowd pick once the moment resonates widely', () => {
    expect(badgesFor({ entryRank: 5, resonanceSupporters: 10 })).toContain('crowd_pick')
    expect(badgesFor({ entryRank: 5, resonanceSupporters: 9 })).not.toContain('crowd_pick')
  })
})

/* ============================================================ settlement amounts */
describe('settlementAmounts', () => {
  it('retains the fixed cost and returns the rest of the conviction lock', () => {
    expect(settlementAmounts({ amount: 25 })).toEqual({
      amountLocked: 25,
      costRetained: 1,
      amountReturned: 24,
    })
  })
  it('never returns a negative amount', () => {
    const s = settlementAmounts({ amount: 0.5 })
    expect(s.costRetained).toBe(0.5)
    expect(s.amountReturned).toBe(0)
  })
})

/* ============================================================ ledger read model */
describe('ledger read model', () => {
  const mint = 'MintAddr111'
  const entry = (over: Partial<LedgerEntry>): LedgerEntry => ({
    id: 'e1',
    userId: 'u1',
    kind: 'watch_reward',
    amount: 10,
    mintAddress: mint,
    transactionSignature: 'sig1',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    source: 'live',
    ...over,
  })

  it('sums only confirmed entries for the user', () => {
    const entries = [
      entry({ id: 'a', amount: 10 }),
      entry({ id: 'b', kind: 'signal_locked', amount: -25 }),
      entry({ id: 'c', kind: 'discovery_reward', amount: 12, status: 'pending' }),
      entry({ id: 'd', userId: 'other', amount: 999 }),
    ]
    expect(indexedBalance(entries, 'u1')).toBe(-15)
  })

  it('surfaces pending entries for reconciliation against the chain', () => {
    const entries = [entry({ id: 'a' }), entry({ id: 'b', status: 'pending', transactionSignature: null })]
    expect(pendingEntries(entries).map((e) => e.id)).toEqual(['b'])
  })

  it('detects an existing settlement entry so settlement stays idempotent', () => {
    const entries = [
      entry({ id: 'r1', kind: 'discovery_reward', ref: { roundId: 'rd1', signalId: 's1' } }),
      entry({ id: 'r2', kind: 'discovery_reward', ref: { roundId: 'rd1', signalId: 's2' }, status: 'failed' }),
    ]
    expect(hasSettlementEntry(entries, 'rd1', 's1', 'discovery_reward')).toBe(true)
    // a failed attempt must not block a retry
    expect(hasSettlementEntry(entries, 'rd1', 's2', 'discovery_reward')).toBe(false)
    expect(hasSettlementEntry(entries, 'rd1', 's3', 'discovery_reward')).toBe(false)
  })

  it('treasury-side entries carry no userId', () => {
    const residual = entry({ id: 'res', userId: null, kind: 'pool_residual', amount: 40 })
    expect(residual.userId).toBeNull()
    expect(indexedBalance([residual], 'u1')).toBe(0)
  })
})
