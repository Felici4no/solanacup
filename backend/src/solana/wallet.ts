import fs from 'node:fs'
import path from 'node:path'
import { Keypair } from '@solana/web3.js'

/* Load the backend wallet:
   - WALLET_SECRET: JSON byte-array in the env, or
   - ANCHOR_WALLET: path to a solana-keygen JSON file (official example convention).
   Generates + persists a new keypair at the ANCHOR_WALLET path if missing,
   so a devnet demo can bootstrap itself (fund it via faucet afterwards). */
export function loadWallet(): Keypair {
  const secret = process.env.WALLET_SECRET
  if (secret) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret) as number[]))
  }

  const walletPath = process.env.ANCHOR_WALLET ?? './.keys/backend-wallet.json'
  if (fs.existsSync(walletPath)) {
    const raw = fs.readFileSync(walletPath, 'utf8')
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]))
  }

  const kp = Keypair.generate()
  fs.mkdirSync(path.dirname(walletPath), { recursive: true })
  fs.writeFileSync(walletPath, JSON.stringify(Array.from(kp.secretKey)))
  console.log(`[wallet] Generated new keypair at ${walletPath}`)
  console.log(`[wallet] Address: ${kp.publicKey.toBase58()} — fund it with devnet SOL (faucet) before subscribing.`)
  return kp
}
