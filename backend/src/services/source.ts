import type { PublicKey } from '@solana/web3.js'
import type { AppFixture, MatchState, PulseEvent } from './worldcup.js'

/* ============================================================
   Pluggable World Cup data source. TxLINE (real) and Replay
   (scripted) implement the same shape, so the API, rewards and
   frontend are identical whether data is live or replayed.
   ============================================================ */

export type LiveEvent = PulseEvent & { fixtureId: number }

export interface Subscription {
  close(): void
}

export interface WorldCupSource {
  readonly kind: 'txline' | 'replay'
  getFixtures(): Promise<AppFixture[]>
  getMatchState(fixtureId: number): Promise<MatchState>
  streamScores(onEvent: (e: LiveEvent) => void, fixtureId?: number): Subscription
}

/** Anything that can mint/report G3B — real SPL token or a mock for replay. */
export interface Rewarder {
  readonly mint: PublicKey
  readonly simulated: boolean
  reward(fanWallet: PublicKey, amount: number): Promise<string>
  balance(fanWallet: PublicKey): Promise<number>
}
