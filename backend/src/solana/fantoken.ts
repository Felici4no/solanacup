import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  getAccount,
} from '@solana/spl-token'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { config } from '../config.js'
import type { Rewarder } from '../services/source.js'

/* ============================================================
   G3B fan token — classic SPL mint on devnet.
   The backend wallet is mint authority; fans earn G3B for
   verified live check-ins ("I'm Watching") and goal bonuses.
   ============================================================ */

export const TOKEN_DECIMALS = 6
const UNIT = 10 ** TOKEN_DECIMALS

export class FanToken implements Rewarder {
  readonly simulated = false

  private constructor(
    private readonly connection: Connection,
    private readonly authority: Keypair,
    public readonly mint: PublicKey,
  ) {}

  /** Use G3B_MINT from env or create a fresh devnet mint on first boot. */
  static async init(connection: Connection, authority: Keypair): Promise<FanToken> {
    const existing = process.env.G3B_MINT
    if (existing) {
      return new FanToken(connection, authority, new PublicKey(existing))
    }
    if (config.network === 'mainnet') {
      throw new Error('Refusing to create a fan-token mint on mainnet automatically — set G3B_MINT.')
    }
    console.log('[g3b] Creating G3B fan-token mint on devnet…')
    const mint = await createMint(connection, authority, authority.publicKey, null, TOKEN_DECIMALS)
    console.log(`[g3b] Mint: ${mint.toBase58()} (set G3B_MINT to reuse it)`)
    return new FanToken(connection, authority, mint)
  }

  /** Mint `amount` whole G3B to a fan wallet (creates the ATA if needed). */
  async reward(fanWallet: PublicKey, amount: number): Promise<string> {
    const ata = await getOrCreateAssociatedTokenAccount(this.connection, this.authority, this.mint, fanWallet)
    const sig = await mintTo(
      this.connection,
      this.authority,
      this.mint,
      ata.address,
      this.authority,
      BigInt(Math.round(amount * UNIT)),
    )
    return sig
  }

  /** Whole-G3B balance of a fan wallet (0 if no account). */
  async balance(fanWallet: PublicKey): Promise<number> {
    try {
      const ata = getAssociatedTokenAddressSync(this.mint, fanWallet)
      const account = await getAccount(this.connection, ata)
      return Number(account.amount) / UNIT
    } catch {
      return 0
    }
  }
}
