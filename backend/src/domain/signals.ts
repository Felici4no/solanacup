/* ============================================================
   Signals — a fan backs a moment with G3B conviction.

   Vocabulary (never financial): Signal, back, conviction,
   discovery reward, first call, early supporter, scout score.

   TxLINE confirms the event happened. Later supporters do NOT
   validate it — they measure its RESONANCE (how far it echoed).
   ============================================================ */

export type SignalTarget =
  | { type: 'moment'; momentId: string }
  /** Reserved for Player Conviction (later phase). */
  | { type: 'player'; playerId: string; matchId?: string }

export type SignalStatus = 'open' | 'settled' | 'cancelled'

/** Simulated actors are always distinguishable from real ones. */
export type Provenance = 'live' | 'demo'

export type Signal = {
  id: string
  userId: string
  target: SignalTarget
  /** G3B locked as conviction (on-chain transfer to the treasury). */
  amount: number
  comment?: string
  /** 1 = first call. */
  entryRank: number
  createdAt: string
  status: SignalStatus
  source: Provenance
  /** Signature of the user-signed transfer that funded this Signal. */
  lockTxSignature?: string
}

export type RoundStatus = 'open' | 'settling' | 'settled'

export type SignalRound = {
  id: string
  target: SignalTarget
  /** Fixed G3B available as discovery rewards for this round. */
  discoveryPool: number
  opensAt: string
  closesAt: string
  status: RoundStatus
  /** How far the moment echoed: distinct fans who backed it. */
  resonanceSupporters: number
  totalSignaled: number
  source: Provenance
}

export type Badge = 'first_call' | 'early_supporter' | 'crowd_pick'

export type SignalSettlement = {
  id: string
  roundId: string
  signalId: string
  userId: string
  /** Conviction originally locked. */
  amountLocked: number
  /** Non-refundable Signal cost kept by the treasury. */
  costRetained: number
  /** amountLocked − costRetained, returned on settlement. */
  amountReturned: number
  /** Paid from the fixed discovery pool. */
  rewardAmount: number
  weight: number
  badges: Badge[]
  settledAt: string
}

/* ---- Economic parameters (backend-owned; never trusted from the client) ---- */
export const SIGNAL_RULES = {
  /** Minimum conviction per Signal, in G3B. */
  MIN_AMOUNT: 5,
  /** Maximum conviction per Signal, in G3B (whale damping, step 1). */
  MAX_AMOUNT: 100,
  /** Non-refundable cost per Signal — the anti-spam floor. */
  COST: 1,
  /** No single fan may take more than this share of a discovery pool. */
  MAX_USER_POOL_SHARE: 0.25,
} as const

export type SignalRuleViolation =
  | 'below_minimum'
  | 'above_maximum'
  | 'not_an_increase'
  | 'round_closed'

/** Validate a new Signal amount against the rules. */
export function validateSignalAmount(amount: number): SignalRuleViolation | null {
  if (!Number.isFinite(amount)) return 'below_minimum'
  if (amount < SIGNAL_RULES.MIN_AMOUNT) return 'below_minimum'
  if (amount > SIGNAL_RULES.MAX_AMOUNT) return 'above_maximum'
  return null
}

/**
 * A fan holds one active position per target. Updating may only
 * INCREASE conviction, and never past the maximum.
 */
export function validateSignalIncrease(current: number, next: number): SignalRuleViolation | null {
  if (next <= current) return 'not_an_increase'
  return validateSignalAmount(next)
}
