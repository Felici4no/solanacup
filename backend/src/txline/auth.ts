import nacl from 'tweetnacl'
import type { Keypair } from '@solana/web3.js'
import { config } from '../config.js'
import type { ActivationPayload } from './types.js'

/* ============================================================
   TxLINE authentication — two-token model, per the quickstart:
   1. Guest JWT  : POST {host}/auth/guest/start  → { token }
   2. API token  : POST {host}/api/token/activate with the signed
                   activation message. Long-lived; reused across
                   JWT renewals.
   On 401, renew the guest JWT from the same host and retry with
   the SAME activated API token.
   ============================================================ */

export const authState = {
  jwt: '',
  apiToken: '',
}

/** POST /auth/guest/start → { token } (no body, no headers). */
export async function fetchGuestJwt(): Promise<string> {
  const res = await fetch(config.jwtUrl, { method: 'POST' })
  if (!res.ok) throw new Error(`guest/start failed: ${res.status} ${await res.text()}`)
  const body = (await res.json()) as { token: string }
  if (!body.token) throw new Error('guest/start returned no token')
  return body.token
}

export async function renewJwt(): Promise<string> {
  authState.jwt = await fetchGuestJwt()
  return authState.jwt
}

/* ---- Activation message (quickstart, followed verbatim) ----
   message = `${txSig}:${leagues.join(",")}:${jwt}`
   Standard bundle (empty leagues) → `${txSig}::${jwt}`.
   UTF-8 bytes, ed25519 detached signature, base64. The signing
   wallet MUST be the wallet that sent the subscribe transaction. */

export function buildActivationMessage(txSig: string, leagues: number[], jwt: string): string {
  return `${txSig}:${leagues.join(',')}:${jwt}`
}

export function signActivationMessage(message: string, wallet: Keypair): string {
  const bytes = new TextEncoder().encode(message)
  const signature = nacl.sign.detached(bytes, wallet.secretKey)
  return Buffer.from(signature).toString('base64')
}

/** POST /api/token/activate → activated API token. */
export async function activateApiToken(
  txSig: string,
  wallet: Keypair,
  leagues: number[],
  jwt: string,
): Promise<string> {
  const message = buildActivationMessage(txSig, leagues, jwt)
  const walletSignature = signActivationMessage(message, wallet)
  const payload: ActivationPayload = { txSig, walletSignature, leagues }

  const res = await fetch(`${config.apiBaseUrl}/token/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    // Per the docs: on 403 verify message accuracy, wallet consistency,
    // base64 encoding, network alignment and activation host.
    throw new Error(`token/activate failed: ${res.status} ${await res.text()}`)
  }
  const body = (await res.json().catch(() => null)) as { token?: string } | string | null
  const token = typeof body === 'string' ? body : body?.token
  if (!token) throw new Error('token/activate returned no token')
  return token
}
