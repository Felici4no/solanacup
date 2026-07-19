import * as anchor from '@coral-xyz/anchor'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { config, SELECTED_LEAGUES, SERVICE_LEVEL, SUBSCRIPTION_WEEKS } from '../config.js'
import { activateApiToken } from '../txline/auth.js'
import idl from './idl/txoracle.json' with { type: 'json' }

/* ============================================================
   Free-tier World Cup subscription — faithful port of the
   official `tx-on-chain/examples/devnet` flow (users.ts +
   subscription_free_tier.ts):

   1. Ensure the wallet's TxL Token-2022 ATA exists (the free
      tier moves no TxL, but the account is part of `subscribe`).
   2. PDAs: ["pricing_matrix"] and ["token_treasury_v2"].
   3. program.methods.subscribe(serviceLevelId, weeks) — weeks
      must be a multiple of 4.
   4. Sign + send + confirm → txSig.
   5. Activate: sign `${txSig}:${leagues}:${jwt}` with the SAME
      wallet → POST /api/token/activate → API token.
   ============================================================ */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function subscribeAndActivate(wallet: Keypair, jwt: string): Promise<{ txSig: string; apiToken: string }> {
  if (SUBSCRIPTION_WEEKS < 4 || SUBSCRIPTION_WEEKS % 4 !== 0) {
    throw new Error(`Invalid subscription duration: ${SUBSCRIPTION_WEEKS} weeks. Must be a multiple of 4.`)
  }

  const connection = new Connection(config.rpcUrl, 'confirmed')
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(wallet), {
    commitment: 'confirmed',
  })
  const program = new anchor.Program(idl as anchor.Idl, provider)

  if (program.programId.toBase58() !== config.programId) {
    throw new Error(
      `IDL program (${program.programId.toBase58()}) ≠ configured ${config.network} program (${config.programId}). ` +
        'Networks must match end-to-end.',
    )
  }

  const tokenMint = new PublicKey(config.txlMint)
  const userTokenAccountAddress = getAssociatedTokenAddressSync(
    tokenMint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
  )

  // 1 — TxL Token-2022 ATA (create if missing)
  const accountInfo = await connection.getAccountInfo(userTokenAccountAddress)
  if (!accountInfo) {
    console.log('[subscribe] Creating TxL Token-2022 associated account…')
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userTokenAccountAddress,
        wallet.publicKey,
        tokenMint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    )
    await anchor.web3.sendAndConfirmTransaction(connection, tx, [wallet], { commitment: 'confirmed' })
    await delay(3000)
  }

  // RPC sync retry, as in the official example
  let userTokenAccount
  for (let attempts = 0; attempts < 5; attempts++) {
    try {
      userTokenAccount = await getAccount(connection, userTokenAccountAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)
      break
    } catch (err) {
      if ((err as Error).name === 'TokenAccountNotFoundError') {
        console.log(`[subscribe] RPC not synced. Retrying (${attempts + 1}/5)…`)
        await delay(2000)
      } else {
        throw err
      }
    }
  }
  if (!userTokenAccount) throw new Error('RPC failed to sync the new token account.')

  // 2 — PDAs (seeds verbatim from the official example)
  const [pricingMatrixPda] = PublicKey.findProgramAddressSync([Buffer.from('pricing_matrix')], program.programId)
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync([Buffer.from('token_treasury_v2')], program.programId)
  const tokenTreasuryVault = getAssociatedTokenAddressSync(tokenMint, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID)

  // 3 — subscribe(serviceLevelId, weeks)
  console.log(`[subscribe] On-chain subscribe: level ${SERVICE_LEVEL}, ${SUBSCRIPTION_WEEKS} weeks (${config.network})`)
  const tx = await program.methods
    .subscribe(SERVICE_LEVEL, SUBSCRIPTION_WEEKS)
    .accounts({
      user: wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint,
      userTokenAccount: userTokenAccount.address,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction()

  const latest = await connection.getLatestBlockhash('confirmed')
  tx.recentBlockhash = latest.blockhash
  tx.feePayer = wallet.publicKey
  tx.sign(wallet)

  const txSig = await connection.sendRawTransaction(tx.serialize())
  await connection.confirmTransaction(
    { signature: txSig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    'confirmed',
  )
  console.log(`[subscribe] Confirmed: ${txSig}`)

  // 5 — activation (same wallet signs the message)
  const apiToken = await activateApiToken(txSig, wallet, SELECTED_LEAGUES, jwt)
  console.log('[subscribe] API token activated.')
  return { txSig, apiToken }
}
