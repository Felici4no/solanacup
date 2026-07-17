import fs from 'node:fs'
import path from 'node:path'
import { Connection } from '@solana/web3.js'
import { config, PORT } from './config.js'
import { authState, renewJwt } from './txline/auth.js'
import { loadWallet } from './solana/wallet.js'
import { subscribeAndActivate } from './solana/subscribe.js'
import { FanToken } from './solana/fantoken.js'
import { WorldCupService } from './services/worldcup.js'
import { RewardsService } from './services/rewards.js'
import { createServer } from './api/server.js'

/* ============================================================
   Boot: guest JWT → activated API token (cached; on-chain
   subscribe only when needed) → VEZ mint → HTTP server.
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
  console.log(`[boot] Vez backend · network=${config.network} · txline=${config.host}`)

  // 1 — guest JWT (short-lived; auto-renewed on 401 by the client)
  await renewJwt()
  console.log('[boot] Guest JWT acquired.')

  // 2 — activated API token: env → cache → on-chain subscribe
  const wallet = loadWallet()
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

  // 3 — VEZ fan token
  const connection = new Connection(config.rpcUrl, 'confirmed')
  const fanToken = await FanToken.init(connection, wallet)

  // 4 — services + HTTP
  const worldCup = new WorldCupService()
  const rewards = new RewardsService(fanToken, worldCup)
  const app = createServer(worldCup, rewards, fanToken)
  app.listen(PORT, () => {
    console.log(`[boot] Vez backend listening on http://localhost:${PORT}`)
    console.log(`[boot] VEZ mint: ${fanToken.mint.toBase58()}`)
  })
}

main().catch((err) => {
  console.error('[boot] Fatal:', err)
  process.exit(1)
})
