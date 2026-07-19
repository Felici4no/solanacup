import { EventSource } from 'eventsource'
import { config } from '../config.js'
import { authState, renewJwt } from './auth.js'
import { txlineGet } from './client.js'
import type { Fixture, Odds, Scores, StreamHandlers } from './types.js'

/* ============================================================
   Typed TxLINE data endpoints — paths exactly as in the OpenAPI
   spec (docs/txline-openapi.yaml).
   ============================================================ */

/** GET /api/fixtures/snapshot — latest fixtures, optionally filtered. */
export function fixturesSnapshot(params: { startEpochDay?: number; competitionId?: number } = {}) {
  const q = new URLSearchParams()
  if (params.startEpochDay != null) q.set('startEpochDay', String(params.startEpochDay))
  if (params.competitionId != null) q.set('competitionId', String(params.competitionId))
  const qs = q.toString()
  return txlineGet<Fixture[]>(`/fixtures/snapshot${qs ? `?${qs}` : ''}`)
}

/** GET /api/scores/snapshot/{fixtureId} — latest score actions (or asOf ms). */
export function scoresSnapshot(fixtureId: number, asOf?: number) {
  const qs = asOf != null ? `?asOf=${asOf}` : ''
  return txlineGet<Scores[]>(`/scores/snapshot/${fixtureId}${qs}`)
}

/** GET /api/scores/historical/{fixtureId} */
export function scoresHistorical(fixtureId: number) {
  return txlineGet<Scores[]>(`/scores/historical/${fixtureId}`)
}

/** GET /api/odds/snapshot/{fixtureId} — StablePrice snapshot (or asOf ms). */
export function oddsSnapshot(fixtureId: number, asOf?: number) {
  const qs = asOf != null ? `?asOf=${asOf}` : ''
  return txlineGet<Odds[]>(`/odds/snapshot/${fixtureId}${qs}`)
}

/* ============================================================
   SSE streams — /api/scores/stream and /api/odds/stream.
   Uses the `eventsource` package with a custom fetch that injects
   the auth headers and renews the guest JWT on 401/403, exactly
   like the official free-tier example. `Last-Event-ID` resume is
   handled by the EventSource client itself.
   ============================================================ */

function openStream<T>(path: string, handlers: StreamHandlers<T>): EventSource {
  const url = `${config.apiBaseUrl}${path}`

  const es = new EventSource(url, {
    fetch: async (input, init) => {
      const attempt = (jwt: string) =>
        fetch(input, {
          ...init,
          headers: {
            ...(init?.headers as Record<string, string>),
            'Accept-Encoding': 'deflate',
            Authorization: `Bearer ${jwt}`,
            'X-Api-Token': authState.apiToken,
          },
        })

      let res = await attempt(authState.jwt)
      if (res.status === 401 || res.status === 403) {
        const jwt = await renewJwt()
        res = await attempt(jwt)
      }
      return res
    },
  })

  es.onopen = () => handlers.onOpen?.()
  es.onerror = (err) => handlers.onError?.(err)

  // Heartbeats arrive as `event: heartbeat` with optional `{"Ts": ...}` data.
  es.addEventListener('heartbeat', (ev) => {
    let ts: number | null = null
    try {
      ts = (JSON.parse((ev as MessageEvent).data) as { Ts?: number }).Ts ?? null
    } catch {
      /* heartbeat without body */
    }
    handlers.onHeartbeat?.(ts)
  })

  // Data messages: `id` = `timestamp:index`, data = one JSON record.
  es.onmessage = (ev) => {
    try {
      handlers.onData(JSON.parse(ev.data) as T, ev.lastEventId || null)
    } catch (err) {
      handlers.onError?.(err)
    }
  }

  return es
}

/** GET /api/scores/stream (SSE) — optionally filtered to one fixture. */
export function scoresStream(handlers: StreamHandlers<Scores>, fixtureId?: number): EventSource {
  const qs = fixtureId != null ? `?fixtureId=${fixtureId}` : ''
  return openStream<Scores>(`/scores/stream${qs}`, handlers)
}

/** GET /api/odds/stream (SSE). */
export function oddsStream(handlers: StreamHandlers<Odds>, fixtureId?: number): EventSource {
  const qs = fixtureId != null ? `?fixtureId=${fixtureId}` : ''
  return openStream<Odds>(`/odds/stream${qs}`, handlers)
}
