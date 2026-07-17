import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddressSync,
  getAccount,
} from '@solana/spl-token'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { config } from '../config.js'

/* ============================================================
   VEZ fan token — classic SPL mint on devnet.
   The backend wallet is mint authority; fans earn VEZ for
   verified live check-ins ("I'm Watching") and goal bonuses.
   ============================================================ */

export const VEZ_DECIMALS = 6
const UNIT = 10 ** VEZ_DECIMALS

export class FanToken {
  private constructor(
    private readonly connection: Connection,
    private readonly authority: Keypair,
    public readonly mint: PublicKey,
  ) {}

  /** Use VEZ_MINT from env or create a fresh devnet mint on first boot. */
  static async init(connection: Connection, authority: Keypair): Promise<FanToken> {
    const existing = process.env.VEZ_MINT
    if (existing) {
      return new FanToken(connection, authority, new PublicKey(existing))
    }
    if (config.network === 'mainnet') {
      throw new Error('Refusing to create a fan-token mint on mainnet automatically — set VEZ_MINT.')
    }
    console.log('[vez] Creating VEZ fan-token mint on devnet…')
    const mint = await createMint(connection, authority, authority.publicKey, null, VEZ_DECIMALS)
    console.log(`[vez] Mint: ${mint.toBase58()} (set VEZ_MINT to reuse it)`)
    return new FanToken(connection, authority, mint)
  }

  /** Mint `amount` whole VEZ to a fan wallet (creates the ATA if needed). */
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

  /** Whole-VEZ balance of a fan wallet (0 if no account). */
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
