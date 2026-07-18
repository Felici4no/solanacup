/* ============================================================
   Live data client — talks to the GAM3BOOK backend (TxLINE World Cup
   + G3B fan token). Enabled only when VITE_LIVE_API is set, so
   the app runs unchanged without a backend.
   ============================================================ */

export const LIVE_API = import.meta.env.VITE_LIVE_API as string | undefined

// Demo fan wallet — a real integration would use the connected wallet.
export const DEMO_WALLET = '6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J'

export type LiveEventType =
  | 'goal'
  | 'penalty'
  | 'red_card'
  | 'yellow_card'
  | 'corner'
  | 'var'
  | 'state'
  | 'other'

export type LiveEvent = {
  fixtureId: number
  minute: number | null
  type: LiveEventType
  team: 'home' | 'away' | null
  gameState: string
  ts: number
  seq: number
}

export type LiveFixture = {
  fixtureId: number
  competition: string
  home: string
  away: string
  kickoff: number
}

export type LiveMatchState = {
  fixtureId: number
  gameState: string
  live: boolean
  score: { home: number; away: number }
  events: LiveEvent[]
}

export type Health = {
  ok: boolean
  network: string
  dataSource: 'txline' | 'replay'
  txlineActivated: boolean
  tokenMint: string
  tokenSimulated: boolean
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${LIVE_API}${path}`, init)
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export const live = {
  health: () => j<Health>('/health'),
  fixtures: () => j<LiveFixture[]>('/api/wc/fixtures'),
  matchState: (id: number) => j<LiveMatchState>(`/api/wc/matches/${id}`),
  balance: (wallet: string) => j<{ balance: number }>(`/api/fan/balance/${wallet}`),
  // Reads the JSON body for success (200) AND rejection (409) — a failed
  // check-in is a valid { ok:false, code } result, not a thrown error.
  checkin: async (wallet: string, fixtureId: number) => {
    const res = await fetch(`${LIVE_API}/api/fan/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, fixtureId }),
    })
    return res.json() as Promise<{
      ok: boolean
      code?: string
      reward?: number
      txSig?: string
      gameState?: string
    }>
  },

  /** Subscribe to the live event stream for one fixture. */
  stream(fixtureId: number, onEvent: (e: LiveEvent) => void): () => void {
    const es = new EventSource(`${LIVE_API}/api/wc/stream?fixtureId=${fixtureId}`)
    es.onmessage = (ev) => {
      try {
        onEvent(JSON.parse(ev.data) as LiveEvent)
      } catch {
        /* ignore malformed */
      }
    }
    return () => es.close()
  },
}
