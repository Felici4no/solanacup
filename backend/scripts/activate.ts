import fs from 'node:fs'
import path from 'node:path'
import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import { config } from '../src/config.js'
import { authState, renewJwt } from '../src/txline/auth.js'
import { loadWallet } from '../src/solana/wallet.js'
import { subscribeAndActivate } from '../src/solana/subscribe.js'

/* One-shot TxLINE free-tier activation (equivalent of the official
   subscription_free_tier.ts): subscribe on-chain + activate, then
   cache the API token for the server. Requires SOL for fees —
   on devnet, tries an airdrop automatically. */

async function main() {
  console.log(`[activate] network=${config.network} host=${config.host}`)
  const wallet = loadWallet()
  console.log(`[activate] wallet=${wallet.publicKey.toBase58()}`)

  const connection = new Connection(config.rpcUrl, 'confirmed')
  const balance = await connection.getBalance(wallet.publicKey)
  console.log(`[activate] balance=${balance / LAMPORTS_PER_SOL} SOL`)

  if (balance < 0.01 * LAMPORTS_PER_SOL && config.network === 'devnet') {
    console.log('[activate] Requesting devnet airdrop (1 SOL)…')
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
      await connection.confirmTransaction(sig, 'confirmed')
      console.log('[activate] Airdrop confirmed.')
    } catch (err) {
      console.error('[activate] Airdrop failed (rate-limited?). Fund the wallet via https://pinestake.com/en/faucet and retry.')
      throw err
    }
  }

  await renewJwt()
  const { txSig, apiToken } = await subscribeAndActivate(wallet, authState.jwt)

  const cache = path.resolve('.txline/token.json')
  fs.mkdirSync(path.dirname(cache), { recursive: true })
  fs.writeFileSync(cache, JSON.stringify({ network: config.network, apiToken, txSig }, null, 2))

  console.log('[activate] Done.')
  console.log(`[activate] txSig=${txSig}`)
  console.log(`[activate] API token cached at ${cache}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
