import { config } from '../config.js'
import { authState, renewJwt } from './auth.js'

/* ============================================================
   Authenticated TxLINE fetch — mirrors the official users.ts
   interceptor pattern: inject `Authorization: Bearer {jwt}` +
   `X-Api-Token`, and on 401 renew the guest JWT once (single
   flight) and retry the request with the same API token.
   ============================================================ */

let renewing: Promise<string> | null = null

async function renewOnce(): Promise<string> {
  if (!renewing) {
    renewing = renewJwt().finally(() => {
      renewing = null
    })
  }
  return renewing
}

export function txlineHeaders(): Record<string, string> {
  const h: Record<string, string> = {}
  if (authState.jwt) h.Authorization = `Bearer ${authState.jwt}`
  if (authState.apiToken) h['X-Api-Token'] = authState.apiToken
  return h
}

/** GET {apiBaseUrl}{path} with auth + one 401-renewal retry. */
export async function txlineGet<T>(path: string): Promise<T> {
  const url = `${config.apiBaseUrl}${path}`
  let res = await fetch(url, { headers: txlineHeaders() })

  if (res.status === 401) {
    await renewOnce()
    res = await fetch(url, { headers: txlineHeaders() })
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new TxlineHttpError(res.status, `${path} → ${res.status} ${body}`)
  }
  return (await res.json()) as T
}

export class TxlineHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'TxlineHttpError'
  }
}
