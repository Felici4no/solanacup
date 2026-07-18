import { createHash } from 'node:crypto'

/* ============================================================
   Match moments — the anchor a Signal points at.

   Infrastructure-neutral: no fs, no Solana, no HTTP. A moment is
   derived from official TxLINE data; the identity must survive a
   replay restart, so it is either TxLINE's own event id or a
   deterministic hash of the event's defining fields.
   ============================================================ */

export type BroadcastProvider = 'youtube'

export type BroadcastClip = {
  provider: BroadcastProvider
  channelName: string
  videoId: string
  startSeconds: number
  endSeconds?: number
  /** Shown next to the embed, e.g. "Official broadcast moment". */
  sourceLabel: string
}

export type MomentType = 'goal' | 'save' | 'card' | 'substitution' | 'chance' | 'custom'

export type MatchMoment = {
  id: string
  matchId: string
  minute: number
  stoppageTime?: number
  type: MomentType
  title: string
  playerId?: string
  description?: string
  broadcastClip?: BroadcastClip
  dataSource: 'txline' | 'replay' | 'manual'
}

/** The fields that define a moment's identity. */
export type MomentIdentity = {
  matchId: string
  minute: number
  stoppageTime?: number
  type: MomentType
  team?: 'home' | 'away' | null
  playerId?: string
  /** TxLINE sequence number for the underlying score record. */
  seq?: number
  /** TxLINE's own event id, when the feed provides one. */
  txlineEventId?: string | number
}

/**
 * Stable moment id.
 *
 * Prefers TxLINE's own event identifier. When absent (replay, manual
 * seeds), derives a deterministic hash over the fields that make the
 * event unique, so the same event always yields the same id across
 * process restarts — Signals emitted before a restart stay anchored.
 */
export function momentId(identity: MomentIdentity): string {
  if (identity.txlineEventId != null && `${identity.txlineEventId}`.length > 0) {
    return `tx_${identity.txlineEventId}`
  }
  const parts = [
    identity.matchId,
    identity.minute,
    identity.stoppageTime ?? 0,
    identity.type,
    identity.team ?? '',
    identity.playerId ?? '',
    identity.seq ?? '',
  ].join('|')
  return `mh_${createHash('sha256').update(parts).digest('hex').slice(0, 16)}`
}
