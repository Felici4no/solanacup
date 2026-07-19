/* ============================================================
   Official broadcast video — a layer ABOVE the Match Pulse.
   The Pulse selection stays the single source of truth; this
   module only resolves "which official clip shows the moment
   the fan is already analysing" and never drives selection.

   gameMinute and startSeconds are DIFFERENT quantities:
   the match clock vs. the offset inside the broadcast VOD
   (pre-show, halftime and stoppages make them unrelated).
   Timestamps here were located manually against the official
   CazéTV stream — never derived as gameMinute * 60.
   Pure logic is unit-tested (video.test.ts).
   ============================================================ */

export type BroadcastStatus = 'available' | 'unavailable' | 'embed-disabled'

export type MatchBroadcast = {
  id: string
  matchId: string
  provider: 'youtube'
  videoId: string
  channelName: string
  sourceLabel: string
  status: BroadcastStatus
  source: 'manual' | 'demo'
}

export type VideoEventType =
  | 'goal'
  | 'foul'
  | 'card'
  | 'save'
  | 'substitution'
  | 'chance'
  | 'custom'

export type EventVideoMarker = {
  id: string
  matchId: string
  /** Stable id of the existing PulseEvent this clip shows. */
  eventId: string
  videoId: string
  startSeconds: number
  endSeconds?: number
  label: string
  gameMinute: number
  eventType: VideoEventType
  source: 'manual' | 'demo'
}

/* ---- Pure helpers ---- */

/** The clip for a Pulse event, or null — events without video stay first-class. */
export function markerForEvent(
  markers: EventVideoMarker[],
  eventId: string | null | undefined,
): EventVideoMarker | null {
  if (!eventId) return null
  return markers.find((m) => m.eventId === eventId) ?? null
}

/** Compact in-player navigation list, in match-clock order. */
export function sortedMarkers(markers: EventVideoMarker[]): EventVideoMarker[] {
  return [...markers].sort((a, b) => a.gameMinute - b.gameMinute || a.startSeconds - b.startSeconds)
}

/** A marker is playable only with a sane manual timestamp. */
export function isPlayableMarker(m: EventVideoMarker): boolean {
  return (
    Number.isFinite(m.startSeconds) &&
    m.startSeconds >= 0 &&
    (m.endSeconds === undefined || m.endSeconds > m.startSeconds)
  )
}

/** Respect endSeconds when present: has playback left the clip window? */
export function pastClipEnd(m: EventVideoMarker, currentSeconds: number): boolean {
  return m.endSeconds !== undefined && currentSeconds >= m.endSeconds
}

/** Timestamped watch URL — the origin of the content, never hidden. */
export function youtubeWatchUrl(videoId: string, startSeconds?: number): string {
  const t = startSeconds !== undefined && startSeconds > 0 ? `&t=${Math.floor(startSeconds)}s` : ''
  return `https://www.youtube.com/watch?v=${videoId}${t}`
}

export function youtubeThumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

/** "4:45:12" — where in the broadcast a clip lives (display only). */
export function formatVideoOffset(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(ss).padStart(2, '0')}`
}

/* ============================================================
   SEED — one demonstration match, located by hand.
   England 1–2 Argentina · FIFA World Cup 2026 semifinal ·
   Atlanta. Official CazéTV full-broadcast VOD; each offset was
   found manually in the stream (kickoff 2:59:53, 2nd half
   4:05:40), so the match clock and the VOD clock differ by
   hours. All demo-tagged; no video is downloaded or re-hosted.
   ============================================================ */

export const WC_MATCH_ID = 'wc26-sf-eng-arg'

export const matchBroadcast: MatchBroadcast = {
  id: 'bc-wc26-sf-eng-arg',
  matchId: WC_MATCH_ID,
  provider: 'youtube',
  videoId: 'QcmQ_zCf8vc', // JOGO COMPLETO: INGLATERRA X ARGENTINA | SEMIFINAL
  channelName: 'CazéTV',
  sourceLabel: 'Official broadcast moment',
  // Verified in a real browser: the official embed plays and seeks.
  // (Headless probes get error 150 from YouTube's bot checks — the
  // component still degrades to the timestamped deep-link fallback
  // whenever the player reports a runtime error.)
  status: 'available',
  source: 'demo',
}

export const eventVideoMarkers: EventVideoMarker[] = [
  {
    id: 'vm-e41',
    matchId: WC_MATCH_ID,
    eventId: 'e41',
    videoId: matchBroadcast.videoId,
    startSeconds: 13245, // 3:40:45 — counter breaks, Rogers pulled back
    endSeconds: 13300,
    label: 'Yellow card · Lisandro Martínez',
    gameMinute: 41,
    eventType: 'card',
    source: 'demo',
  },
  {
    id: 'vm-e55',
    matchId: WC_MATCH_ID,
    eventId: 'e55',
    videoId: matchBroadcast.videoId,
    startSeconds: 15315, // 4:15:15 — Kane's long ball starts the move
    endSeconds: 15420,
    label: 'Goal · Anthony Gordon',
    gameMinute: 55,
    eventType: 'goal',
    source: 'demo',
  },
  {
    id: 'vm-e64',
    matchId: WC_MATCH_ID,
    eventId: 'e64',
    videoId: matchBroadcast.videoId,
    startSeconds: 15848, // 4:24:08 — first substitution board goes up
    endSeconds: 15872,
    label: 'Substitution · Nico González on',
    gameMinute: 64,
    eventType: 'substitution',
    source: 'demo',
  },
  {
    id: 'vm-e82',
    matchId: WC_MATCH_ID,
    eventId: 'e82',
    videoId: matchBroadcast.videoId,
    startSeconds: 17017, // 4:43:37 — De Paul lets fly, blocked
    endSeconds: 17038,
    label: 'De Paul strike blocked',
    gameMinute: 82,
    eventType: 'chance',
    source: 'demo',
  },
  {
    id: 'vm-e83',
    matchId: WC_MATCH_ID,
    eventId: 'e83',
    videoId: matchBroadcast.videoId,
    startSeconds: 17045, // 4:44:05 — Messi receives and shoots wide
    endSeconds: 17068,
    label: 'Chance · Messi',
    gameMinute: 83,
    eventType: 'chance',
    source: 'demo',
  },
  {
    id: 'vm-e84',
    matchId: WC_MATCH_ID,
    eventId: 'e84',
    videoId: matchBroadcast.videoId,
    startSeconds: 17095, // 4:44:55 — the bomb Pickford tips behind
    endSeconds: 17112,
    label: 'Save · Pickford',
    gameMinute: 84,
    eventType: 'save',
    source: 'demo',
  },
  {
    id: 'vm-e85',
    matchId: WC_MATCH_ID,
    eventId: 'e85',
    videoId: matchBroadcast.videoId,
    startSeconds: 17112, // 4:45:12 — short corner, Messi lays it back
    endSeconds: 17195,
    label: 'Goal · Enzo Fernández',
    gameMinute: 85,
    eventType: 'goal',
    source: 'demo',
  },
  {
    id: 'vm-e90',
    matchId: WC_MATCH_ID,
    eventId: 'e90',
    videoId: matchBroadcast.videoId,
    startSeconds: 17512, // 4:51:52 — Messi's cross, Lautaro's header
    endSeconds: 17590,
    label: 'Goal · Lautaro Martínez',
    gameMinute: 90,
    eventType: 'goal',
    source: 'demo',
  },
]
