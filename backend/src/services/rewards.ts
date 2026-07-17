import fs from 'node:fs'
import path from 'node:path'
import { PublicKey } from '@solana/web3.js'
import type { FanToken } from '../solana/fantoken.js'
import type { WorldCupService } from './worldcup.js'

/* ============================================================
   VEZ rewards — the "I'm Watching" ritual becomes an on-chain
   fan moment, but only when TxLINE confirms the match is live.

   - Check-in on a LIVE fixture ......... 10 VEZ
   - Goal while checked-in (per goal) ...  5 VEZ (paid on claim)
   One check-in per wallet per fixture.
   ============================================================ */

export const CHECKIN_REWARD = 10
export const GOAL_BONUS = 5

type CheckinRecord = {
  wallet: string
  fixtureId: number
  at: number
  txSig: string
  goalsAtCheckin: number
  bonusPaidGoals: number
}

type RewardsState = { checkins: CheckinRecord[] }

const STATE_FILE = path.resolve('.vez/state.json')

function loadState(): RewardsState {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as RewardsState
  } catch {
    return { checkins: [] }
  }
}
function saveState(state: RewardsState) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

export class RewardsService {
  private state = loadState()

  constructor(
    private readonly fanToken: FanToken,
    private readonly worldCup: WorldCupService,
  ) {}

  findCheckin(wallet: string, fixtureId: number) {
    return this.state.checkins.find((c) => c.wallet === wallet && c.fixtureId === fixtureId)
  }

  /** Verified check-in: fixture must be live on TxLINE right now. */
  async checkin(walletStr: string, fixtureId: number) {
    const wallet = new PublicKey(walletStr) // throws on invalid address

    const existing = this.findCheckin(walletStr, fixtureId)
    if (existing) {
      return { ok: false as const, code: 'already_checked_in' as const, checkin: existing }
    }

    const match = await this.worldCup.getMatchState(fixtureId)
    if (!match.live) {
      return { ok: false as const, code: 'not_live' as const, gameState: match.gameState }
    }

    const txSig = await this.fanToken.reward(wallet, CHECKIN_REWARD)
    const record: CheckinRecord = {
      wallet: walletStr,
      fixtureId,
      at: Date.now(),
      txSig,
      goalsAtCheckin: match.score.home + match.score.away,
      bonusPaidGoals: 0,
    }
    this.state.checkins.push(record)
    saveState(this.state)
    return { ok: true as const, reward: CHECKIN_REWARD, txSig, match }
  }

  /** Claim goal bonuses: 5 VEZ per goal scored since the check-in. */
  async claimGoalBonus(walletStr: string, fixtureId: number) {
    const checkin = this.findCheckin(walletStr, fixtureId)
    if (!checkin) return { ok: false as const, code: 'no_checkin' as const }

    const match = await this.worldCup.getMatchState(fixtureId)
    const goalsSince = Math.max(0, match.score.home + match.score.away - checkin.goalsAtCheckin)
    const unpaid = goalsSince - checkin.bonusPaidGoals
    if (unpaid <= 0) {
      return { ok: false as const, code: 'nothing_to_claim' as const, goalsSince }
    }

    const amount = unpaid * GOAL_BONUS
    const txSig = await this.fanToken.reward(new PublicKey(walletStr), amount)
    checkin.bonusPaidGoals += unpaid
    saveState(this.state)
    return { ok: true as const, goals: unpaid, reward: amount, txSig }
  }

  async balance(walletStr: string): Promise<number> {
    return this.fanToken.balance(new PublicKey(walletStr))
  }
}
