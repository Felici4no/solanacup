import { Keypair, PublicKey } from '@solana/web3.js'
import type { Rewarder } from '../services/source.js'

/* ============================================================
   Simulated G3B rewarder — used in replay mode when the backend
   wallet has no devnet SOL. It records balances in memory so the
   full check-in → reward → balance loop is visible, and is
   clearly flagged `simulated: true`. Swap for the real FanToken
   the moment the mint authority is funded.
   ============================================================ */
export class MockFanToken implements Rewarder {
  readonly simulated = true
  readonly mint: PublicKey
  private balances = new Map<string, number>()

  constructor() {
    // A deterministic-looking placeholder mint so /api/fan/token has an address.
    this.mint = Keypair.generate().publicKey
  }

  async reward(fanWallet: PublicKey, amount: number): Promise<string> {
    const key = fanWallet.toBase58()
    this.balances.set(key, (this.balances.get(key) ?? 0) + amount)
    // A fake but signature-shaped id so the UI can render it.
    return `SIMULATED-${Keypair.generate().publicKey.toBase58().slice(0, 24)}`
  }

  async balance(fanWallet: PublicKey): Promise<number> {
    return this.balances.get(fanWallet.toBase58()) ?? 0
  }
}
