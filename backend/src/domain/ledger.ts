/* ============================================================
   Ledger — a READ MODEL over Solana, not the source of truth.

   G3B is a real SPL token on devnet: the authoritative balance is
   always the on-chain token account. This ledger indexes what we
   did and why, so the product can show history, reconcile pending
   transactions and settle idempotently.

   Every entry therefore carries the chain coordinates.
   ============================================================ */

export type LedgerKind =
  /** Verified live check-in reward (mint → fan). */
  | 'watch_reward'
  /** Goal bonus while checked in (mint → fan). */
  | 'goal_bonus'
  /** Conviction locked for a Signal (fan → treasury, user-signed). */
  | 'signal_locked'
  /** Conviction returned at settlement, minus the cost (treasury → fan). */
  | 'signal_returned'
  /** Non-refundable Signal cost kept by the treasury. */
  | 'signal_cost'
  /** Discovery reward from the fixed pool (treasury → fan). */
  | 'discovery_reward'
  /** Pool remainder left by the per-fan cap; stays in the treasury. */
  | 'pool_residual'
  /** Explicitly marked demo-only correction. */
  | 'demo_adjustment'

/** Lifecycle of the underlying Solana transaction. */
export type TxStatus = 'pending' | 'confirmed' | 'failed'

export type LedgerEntry = {
  id: string
  /** Owner of the effect. `null` for treasury-side entries (e.g. residual). */
  userId: string | null
  kind: LedgerKind
  /** Signed G3B amount: positive credits the userId, negative debits it. */
  amount: number
  mintAddress: string
  transactionSignature: string | null
  status: TxStatus
  ref?: {
    signalId?: string
    roundId?: string
    momentId?: string
    matchId?: string
  }
  createdAt: string
  /** Whether the *actor* was simulated. G3B movement is always real. */
  source: 'live' | 'demo'
}

/**
 * Indexed (not authoritative) balance for a fan: the sum of confirmed
 * entries. Divergence from the on-chain balance means something is
 * pending or failed and needs reconciliation — the chain always wins.
 */
export function indexedBalance(entries: LedgerEntry[], userId: string): number {
  return entries
    .filter((e) => e.userId === userId && e.status === 'confirmed')
    .reduce((sum, e) => sum + e.amount, 0)
}

/** Entries still awaiting on-chain confirmation. */
export function pendingEntries(entries: LedgerEntry[]): LedgerEntry[] {
  return entries.filter((e) => e.status === 'pending')
}

/**
 * Idempotency guard: a settlement must never be written twice for the
 * same (roundId, signalId, kind) pair.
 */
export function hasSettlementEntry(
  entries: LedgerEntry[],
  roundId: string,
  signalId: string,
  kind: LedgerKind,
): boolean {
  return entries.some(
    (e) => e.kind === kind && e.ref?.roundId === roundId && e.ref?.signalId === signalId && e.status !== 'failed',
  )
}
