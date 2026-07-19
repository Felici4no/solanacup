import { useEffect, useRef, useState } from 'react'
import {
  markerForEvent,
  sortedMarkers,
  isPlayableMarker,
  pastClipEnd,
  youtubeWatchUrl,
  youtubeThumbUrl,
  formatVideoOffset,
  type MatchBroadcast,
  type EventVideoMarker,
} from './video'
import { TYPE_LABEL, type PulseEvent } from './pulse'
import { DemoTag } from './ui'

/* ============================================================
   OfficialMomentVideo — the official broadcast clip for the
   moment the fan is analysing in the Match Pulse.

   A layer ABOVE the Pulse, never a second selection system:
   the selected event arrives via props (the Pulse cursor is the
   single source of truth) and the in-player moment list only
   calls back into that same selection.

   Lazy by design: no iframe, no third-party request before the
   fan presses play — just the thumbnail facade. When the rights
   holder blocks embedding (status 'embed-disabled' or a runtime
   player error), it degrades to an elegant deep-link card that
   still opens the exact broadcast timestamp on YouTube.
   ============================================================ */

export type OfficialMomentVideoProps = {
  broadcast: MatchBroadcast
  markers: EventVideoMarker[]
  events: PulseEvent[]
  /** Pulse event under the cursor (shared selection), if any. */
  selectedEventId: string | null
  /** Current cursor minute — used for the "no clip" line. */
  selectedMinute: number
  /** Route list taps back through the Pulse's own selection. */
  onSelectEvent: (marker: EventVideoMarker) => void
  onUnavailable?: () => void
}

/* ---- Minimal IFrame Player API surface (no extra deps) ---- */
type YTPlayer = {
  loadVideoById: (opts: { videoId: string; startSeconds?: number }) => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}
type YTNamespace = {
  Player: new (el: HTMLElement, opts: unknown) => YTPlayer
}

let ytApiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const w = window as unknown as {
        YT?: YTNamespace & { loaded?: number }
        onYouTubeIframeAPIReady?: () => void
      }
      if (w.YT?.Player) {
        resolve(w.YT)
        return
      }
      const prev = w.onYouTubeIframeAPIReady
      w.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve(w.YT as YTNamespace)
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    })
  }
  return ytApiPromise
}

function momentTitle(ev: PulseEvent | null, minute: number): string {
  if (!ev) return `${minute}’ · Between moments`
  const kind = ev.type === 'card' ? `${ev.cardType === 'red' ? 'Red' : 'Yellow'} card` : TYPE_LABEL[ev.type]
  const cap = kind[0].toUpperCase() + kind.slice(1)
  return `${ev.minute}’ · ${cap}${ev.player ? ` · ${ev.player}` : ''}`
}

type Stage = 'idle' | 'loading' | 'ready' | 'error'

export function OfficialMomentVideo({
  broadcast,
  markers,
  events,
  selectedEventId,
  selectedMinute,
  onSelectEvent,
  onUnavailable,
}: OfficialMomentVideoProps) {
  const marker = markerForEvent(markers, selectedEventId)
  const playable = marker !== null && isPlayableMarker(marker)
  const embeddable = broadcast.status === 'available'
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null

  const [stage, setStage] = useState<Stage>('idle')
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const playingRef = useRef(false)
  const clipRef = useRef<EventVideoMarker | null>(null)
  clipRef.current = marker

  /* Boot the official player only after an explicit tap. */
  function bootPlayer() {
    const m = clipRef.current
    if (!m || stage === 'loading' || stage === 'ready') return
    setStage('loading')
    loadYouTubeApi().then((YT) => {
      if (!hostRef.current || !clipRef.current) return
      const inner = document.createElement('div')
      hostRef.current.appendChild(inner)
      playerRef.current = new YT.Player(inner, {
        width: '100%',
        height: '100%',
        videoId: m.videoId,
        playerVars: { start: Math.floor(m.startSeconds), autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => setStage('ready'),
          onStateChange: (e: { data: number }) => {
            playingRef.current = e.data === 1
          },
          onError: () => {
            setStage('error')
            onUnavailable?.()
          },
        },
      })
    })
  }

  /* Selection changed while the player is live → seek, don't reload. */
  useEffect(() => {
    if (!playerRef.current || stage !== 'ready' || !marker) return
    playerRef.current.seekTo(marker.startSeconds, true)
    playerRef.current.playVideo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker?.id, stage])

  /* Respect endSeconds when present: pause at the end of the clip. */
  useEffect(() => {
    if (stage !== 'ready') return
    const t = window.setInterval(() => {
      const p = playerRef.current
      const m = clipRef.current
      if (!p || !m || !playingRef.current) return
      if (pastClipEnd(m, p.getCurrentTime())) p.pauseVideo()
    }, 500)
    return () => window.clearInterval(t)
  }, [stage])

  useEffect(
    () => () => {
      playerRef.current?.destroy()
      playerRef.current = null
    },
    [],
  )

  const watchUrl = marker
    ? youtubeWatchUrl(broadcast.videoId, marker.startSeconds)
    : youtubeWatchUrl(broadcast.videoId)
  const list = sortedMarkers(markers)

  return (
    <section className="omv" aria-label="Official broadcast moment">
      <div className="omv-head">
        <span className="omv-now">{momentTitle(selectedEvent, selectedMinute)}</span>
        <DemoTag />
      </div>

      {playable && marker ? (
        <div className="omv-stage">
          {embeddable && stage === 'ready' ? null : (
            <img className="omv-thumb" src={youtubeThumbUrl(broadcast.videoId)} alt="" loading="lazy" />
          )}
          {embeddable ? (
            <>
              <div ref={hostRef} className="omv-player" hidden={stage !== 'ready'} />
              {stage !== 'ready' && stage !== 'error' && (
                <button
                  className="omv-poster"
                  onClick={bootPlayer}
                  aria-label={`Play official clip: ${marker.label}`}
                >
                  <span className="omv-play" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                  </span>
                  <span className="omv-poster-label">{stage === 'loading' ? 'Loading player…' : marker.label}</span>
                </button>
              )}
            </>
          ) : null}
          {(!embeddable || stage === 'error') && (
            <div className="omv-blocked">
              <p className="omv-blocked-line">
                {broadcast.status === 'unavailable'
                  ? 'This broadcast is currently unavailable.'
                  : 'Inline playback is disabled by the rights holder.'}
              </p>
              <a className="omv-blocked-open" href={watchUrl} target="_blank" rel="noopener noreferrer">
                Watch this moment on YouTube · {formatVideoOffset(marker.startSeconds)}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="omv-stage omv-none" role="note">
          <p>No official clip mapped for this moment</p>
        </div>
      )}

      <div className="omv-meta">
        <span className="omv-src">
          {broadcast.sourceLabel} · {broadcast.channelName}
        </span>
        <a className="omv-open" href={watchUrl} target="_blank" rel="noopener noreferrer">
          Open on YouTube
        </a>
      </div>

      <div className="omv-list" role="group" aria-label="Broadcast moments">
        {list.map((m) => (
          <button
            key={m.id}
            className="omv-item"
            aria-pressed={m.eventId === selectedEventId}
            onClick={() => onSelectEvent(m)}
          >
            <span className="omv-item-min num">{m.gameMinute}’</span>
            <span className="omv-item-label">{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
