import 'dotenv/config'

/* ============================================================
   Network configuration — per TxLINE docs, the Solana RPC,
   program ID, TxL mint, guest JWT host and activation endpoint
   must ALL be on the same network.
   ============================================================ */

export type Network = 'devnet' | 'mainnet'

export type NetworkConfig = {
  network: Network
  host: string
  apiBaseUrl: string
  jwtUrl: string
  rpcUrl: string
  programId: string
  txlMint: string
}

const NETWORKS: Record<Network, Omit<NetworkConfig, 'network' | 'rpcUrl'> & { defaultRpc: string }> = {
  devnet: {
    host: 'https://txline-dev.txodds.com',
    apiBaseUrl: 'https://txline-dev.txodds.com/api',
    jwtUrl: 'https://txline-dev.txodds.com/auth/guest/start',
    defaultRpc: 'https://api.devnet.solana.com',
    programId: '6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J',
    txlMint: '4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG',
  },
  mainnet: {
    host: 'https://txline.txodds.com',
    apiBaseUrl: 'https://txline.txodds.com/api',
    jwtUrl: 'https://txline.txodds.com/auth/guest/start',
    defaultRpc: 'https://api.mainnet-beta.solana.com',
    programId: '9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA',
    txlMint: 'Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL',
  },
}

const network = (process.env.NETWORK ?? 'devnet') as Network
if (network !== 'devnet' && network !== 'mainnet') {
  throw new Error(`Invalid NETWORK "${network}" — use devnet or mainnet`)
}

const n = NETWORKS[network]
export const config: NetworkConfig = {
  network,
  host: n.host,
  apiBaseUrl: n.apiBaseUrl,
  jwtUrl: n.jwtUrl,
  rpcUrl: process.env.RPC_URL ?? n.defaultRpc,
  programId: n.programId,
  txlMint: n.txlMint,
}

/* ---- World Cup free tier (documentation/worldcup) ---- */
// FIFA World Cup competition id in TxLINE (used by the official free-tier example)
export const WORLD_CUP_COMPETITION_ID = 72
// Level 1: WC & Int Friendlies, 60s delay on mainnet (devnet sampling 0).
// Level 12: WC & Int Friendlies in real-time (mainnet).
export const SERVICE_LEVEL = Number(process.env.TXLINE_SERVICE_LEVEL ?? 1)
// Subscriptions are sold in 4-week blocks — multiples of 4 only.
export const SUBSCRIPTION_WEEKS = Number(process.env.TXLINE_WEEKS ?? 4)
// Standard bundle → empty league selection → activation message `txSig::jwt`
export const SELECTED_LEAGUES: number[] = []

export const PORT = Number(process.env.PORT ?? 8787)

/** Days since the Unix epoch (UTC) — the unit TxLINE uses for fixture queries. */
export function epochDay(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / 86_400_000)
}
