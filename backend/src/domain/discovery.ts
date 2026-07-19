import { SIGNAL_RULES, type Badge, type Signal } from './signals.js'

/* ============================================================
   Discovery reward — pure distribution maths.

   weight = sqrt(amount) * early * verifiedWatch * quality
   reward = min(pool * weight / totalWeight, pool * MAX_USER_SHARE)

   sqrt() damps conviction size; the per-fan cap bounds whales
   outright. Whatever the cap leaves undistributed is residual and
   stays in the treasury/pool — it is never credited to a user.
   ============================================================ */

/** Backing first is what the reward is for. */
export function earlyMultiplier(entryRank: number): number {
  if (entryRank <= 1) return 2.0
  if (entryRank <= 3) return 1.5
  if (entryRank <= 10) return 1.2
  return 1.0
}

/** Rewards fans who actually watched, verified by TxLINE. */
export function verifiedWatchMultiplier(verified: boolean): number {
  return verified ? 1.5 : 1.0
}

/** MVP: neutral. Comment length is not a quality proxy. */
export function qualityMultiplier(): number {
  return 1
}

export type WeightInput = {
  amount: number
  entryRank: number
  verifiedWatch: boolean
}

export function signalWeight(input: WeightInput): number {
  return (
    Math.sqrt(Math.max(0, input.amount)) *
    earlyMultiplier(input.entryRank) *
    verifiedWatchMultiplier(input.verifiedWatch) *
    qualityMultiplier()
  )
}

export type DistributionInput = {
  discoveryPool: number
  entries: Array<{ signalId: string; userId: string } & WeightInput>
}

export type DistributionRow = {
  signalId: string
  userId: string
  weight: number
  /** Discovery reward from the pool (already capped). */
  reward: number
  /** True when the per-fan cap trimmed this reward. */
  capped: boolean
}

export type Distribution = {
  rows: DistributionRow[]
  totalWeight: number
  distributed: number
  /** Stays in the treasury; never attributed to a userId. */
  residual: number
}

/**
 * Split a fixed discovery pool across the round's Signals.
 * Invariant: sum(rewards) + residual === discoveryPool, and
 * sum(rewards) <= discoveryPool always.
 */
export function distributeDiscoveryPool(input: DistributionInput): Distribution {
  const pool = Math.max(0, input.discoveryPool)
  const rows = input.entries.map((e) => ({
    signalId: e.signalId,
    userId: e.userId,
    weight: signalWeight(e),
    reward: 0,
    capped: false,
  }))
  const totalWeight = rows.reduce((sum, r) => sum + r.weight, 0)

  if (totalWeight <= 0 || pool <= 0) {
    return { rows, totalWeight, distributed: 0, residual: pool }
  }

  const cap = pool * SIGNAL_RULES.MAX_USER_POOL_SHARE
  let distributed = 0
  for (const row of rows) {
    const raw = (pool * row.weight) / totalWeight
    const reward = round6(Math.min(raw, cap))
    row.reward = reward
    row.capped = reward < raw
    distributed += reward
  }
  distributed = round6(distributed)

  return { rows, totalWeight, distributed, residual: round6(pool - distributed) }
}

/** Avoid float dust breaking the pool invariant. */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

/* ---- Badges: derived from rules, never set by the client ---- */

export type BadgeInput = {
  entryRank: number
  resonanceSupporters: number
}

export function badgesFor(input: BadgeInput): Badge[] {
  const badges: Badge[] = []
  if (input.entryRank === 1) badges.push('first_call')
  if (input.entryRank <= 3) badges.push('early_supporter')
  if (input.resonanceSupporters >= 10) badges.push('crowd_pick')
  return badges
}

/* ---- Settlement amounts ---- */

export type SettlementAmounts = {
  amountLocked: number
  costRetained: number
  amountReturned: number
}

/**
 * A Signal costs a fixed, non-refundable amount; the rest of the
 * conviction lock returns to the fan on settlement.
 */
export function settlementAmounts(signal: Pick<Signal, 'amount'>): SettlementAmounts {
  const cost = Math.min(SIGNAL_RULES.COST, signal.amount)
  return {
    amountLocked: signal.amount,
    costRetained: cost,
    amountReturned: round6(signal.amount - cost),
  }
}
