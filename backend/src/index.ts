import fs from 'node:fs'
import path from 'node:path'
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { config, PORT } from './config.js'
import { authState, renewJwt } from './txline/auth.js'
import { loadWallet } from './solana/wallet.js'
import { subscribeAndActivate } from './solana/subscribe.js'
import { FanToken } from './solana/fantoken.js'
import { MockFanToken } from './solana/mockfantoken.js'
import { WorldCupService } from './services/worldcup.js'
import { ReplayWorldCup } from './services/replay.js'
import { RewardsService } from './services/rewards.js'
import type { Rewarder, WorldCupSource } from './services/source.js'
import { createServer } from './api/server.js'

const REPLAY = process.env.REPLAY === '1' || process.env.REPLAY === 'true'

/* ============================================================
   Boot: guest JWT → activated API token (cached; on-chain
   subscribe only when needed) → G3B mint → HTTP server.
   ============================================================ */

const TOKEN_CACHE = path.resolve('.txline/token.json')

function loadCachedToken(): string | null {
  try {
    const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE, 'utf8')) as { network: string; apiToken: string }
    return cached.network === config.network ? cached.apiToken : null
  } catch {
    return null
  }
}
function cacheToken(apiToken: string) {
  fs.mkdirSync(path.dirname(TOKEN_CACHE), { recursive: true })
  fs.writeFileSync(TOKEN_CACHE, JSON.stringify({ network: config.network, apiToken }, null, 2))
}

async function main() {
  console.log(`[boot] GAM3BOOK backend · network=${config.network} · txline=${config.host}${REPLAY ? ' · REPLAY' : ''}`)

  const wallet = loadWallet()
  const connection = new Connection(config.rpcUrl, 'confirmed')

  let worldCup: WorldCupSource
  let fanToken: Rewarder

  if (REPLAY) {
    // Scripted live match + simulated G3B (unless the wallet is actually funded).
    console.log('[boot] REPLAY mode — scripted World Cup match, no on-chain subscribe required.')
    worldCup = new ReplayWorldCup()
    const lamports = await connection.getBalance(wallet.publicKey).catch(() => 0)
    if (process.env.G3B_MINT || lamports > 0.02 * LAMPORTS_PER_SOL) {
      fanToken = await FanToken.init(connection, wallet)
      console.log('[boot] Funded wallet — minting real G3B.')
    } else {
      fanToken = new MockFanToken()
      console.log('[boot] Wallet unfunded — G3B rewards are SIMULATED (fund the wallet to mint real tokens).')
    }
  } else {
    // Live TxLINE path.
    await renewJwt()
    console.log('[boot] Guest JWT acquired.')

    const fromEnv = process.env.TXLINE_API_TOKEN
    const fromCache = loadCachedToken()
    if (fromEnv) {
      authState.apiToken = fromEnv
      console.log('[boot] Using TXLINE_API_TOKEN from env.')
    } else if (fromCache) {
      authState.apiToken = fromCache
      console.log('[boot] Using cached API token (.txline/token.json).')
    } else {
      console.log('[boot] No API token — running on-chain free-tier subscription…')
      const { apiToken } = await subscribeAndActivate(wallet, authState.jwt)
      authState.apiToken = apiToken
      cacheToken(apiToken)
    }

    worldCup = new WorldCupService()
    fanToken = await FanToken.init(connection, wallet)
  }

  const rewards = new RewardsService(fanToken, worldCup)
  const app = createServer(worldCup, rewards, fanToken)
  app.listen(PORT, () => {
    console.log(`[boot] GAM3BOOK backend on http://localhost:${PORT} · source=${worldCup.kind} · G3B=${fanToken.mint.toBase58()}${fanToken.simulated ? ' (simulated)' : ''}`)
  })
}

main().catch((err) => {
  console.error('[boot] Fatal:', err)
  process.exit(1)
})
