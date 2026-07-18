import express from 'express'
import cors from 'cors'
import { config } from '../config.js'
import { authState } from '../txline/auth.js'
import { TxlineHttpError } from '../txline/client.js'
import type { RewardsService } from '../services/rewards.js'
import type { Rewarder, WorldCupSource } from '../services/source.js'
import { CHECKIN_REWARD, GOAL_BONUS } from '../services/rewards.js'
import { TOKEN_DECIMALS } from '../solana/fantoken.js'
import { TOKEN_SYMBOL } from '../brand.js'

/* ============================================================
   REST + SSE surface consumed by the GAM3BOOK frontend.
   ============================================================ */

export function createServer(worldCup: WorldCupSource, rewards: RewardsService, fanToken: Rewarder) {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      network: config.network,
      txlineHost: config.host,
      dataSource: worldCup.kind,
      txlineActivated: Boolean(authState.apiToken),
      tokenMint: fanToken.mint.toBase58(),
      tokenSimulated: fanToken.simulated,
    })
  })

  /* ---- World Cup data (normalized for GAM3BOOK) ---- */

  app.get('/api/wc/fixtures', async (_req, res) => {
    try {
      res.json(await worldCup.getFixtures())
    } catch (err) {
      sendTxlineError(res, err)
    }
  })

  app.get('/api/wc/matches/:fixtureId', async (req, res) => {
    const fixtureId = Number(req.params.fixtureId)
    if (!Number.isInteger(fixtureId)) return res.status(400).json({ error: 'invalid fixtureId' })
    try {
      res.json(await worldCup.getMatchState(fixtureId))
    } catch (err) {
      sendTxlineError(res, err)
    }
  })

  /** SSE re-broadcast of the TxLINE scores stream, normalized. */
  app.get('/api/wc/stream', (req, res) => {
    const fixtureId = req.query.fixtureId != null ? Number(req.query.fixtureId) : undefined
    if (fixtureId != null && !Number.isInteger(fixtureId)) {
      return res.status(400).json({ error: 'invalid fixtureId' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const upstream = worldCup.streamScores((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }, fixtureId)

    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: {"ts":${Date.now()}}\n\n`)
    }, 25_000)

    req.on('close', () => {
      clearInterval(heartbeat)
      upstream.close()
    })
  })

  /* ---- G3B fan token ---- */

  app.get('/api/fan/token', (_req, res) => {
    res.json({
      mint: fanToken.mint.toBase58(),
      symbol: TOKEN_SYMBOL,
      decimals: TOKEN_DECIMALS,
      network: config.network,
      simulated: fanToken.simulated,
      rewards: { checkin: CHECKIN_REWARD, goalBonus: GOAL_BONUS },
    })
  })

  app.post('/api/fan/checkin', async (req, res) => {
    const { wallet, fixtureId } = req.body ?? {}
    if (typeof wallet !== 'string' || !Number.isInteger(fixtureId)) {
      return res.status(400).json({ error: 'body must be { wallet: string, fixtureId: integer }' })
    }
    try {
      const result = await rewards.checkin(wallet, fixtureId)
      res.status(result.ok ? 200 : 409).json(result)
    } catch (err) {
      sendTxlineError(res, err)
    }
  })

  app.post('/api/fan/claim-goals', async (req, res) => {
    const { wallet, fixtureId } = req.body ?? {}
    if (typeof wallet !== 'string' || !Number.isInteger(fixtureId)) {
      return res.status(400).json({ error: 'body must be { wallet: string, fixtureId: integer }' })
    }
    try {
      const result = await rewards.claimGoalBonus(wallet, fixtureId)
      res.status(result.ok ? 200 : 409).json(result)
    } catch (err) {
      sendTxlineError(res, err)
    }
  })

  app.get('/api/fan/balance/:wallet', async (req, res) => {
    try {
      res.json({ wallet: req.params.wallet, balance: await rewards.balance(req.params.wallet) })
    } catch (err) {
      res.status(400).json({ error: (err as Error).message })
    }
  })

  return app
}

function sendTxlineError(res: express.Response, err: unknown) {
  if (err instanceof TxlineHttpError) {
    // 403 from TxLINE = token/permissions; surface it honestly
    return res.status(err.status === 403 ? 502 : 502).json({ error: 'txline_upstream', detail: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'internal', detail: (err as Error).message })
}
