import { useRef, useState } from 'react'

/* ============================================================
   StarRange — the stars ARE the track. Tap a half-star, drag
   across, snap to 0.5, keyboard + screen-reader support.
   0.5–5.0 valid; null = not rated (0 is never a score).
   ============================================================ */

export const MATCH_STAR_LABELS = [
  'Forgettable',
  'Had its moments',
  'Memorable',
  'Remarkable',
  'Part of my story',
]
export const MOMENT_STAR_LABELS = [
  'Passed by',
  'Caught my attention',
  'Stayed with me',
  'Unforgettable',
  'Part of my story',
]

/* ---- Pure helpers (unit-tested in StarRange.test.ts) ---- */
export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
/** Snap any raw value to the nearest 0.5, clamped to the valid 0.5–5 range. */
export function snapRating(raw: number) {
  return clamp(Math.round(raw * 2) / 2, 0.5, 5)
}
/** Rating from a pointer's horizontal position inside the star track. */
export function ratingFromPointer(clientX: number, rectLeft: number, rectWidth: number) {
  if (rectWidth <= 0) return 0.5
  const raw = ((clientX - rectLeft) / rectWidth) * 5
  return snapRating(raw)
}
/** Semantic label for a value using a 5-band model (each band spans 1.0). */
export function labelFor(value: number | null, labels: string[]) {
  if (value == null) return ''
  return labels[clamp(Math.ceil(value) - 1, 0, 4)]
}
export function ariaValueText(value: number | null, labels: string[]) {
  if (value == null) return 'Not rated'
  return `${value} out of 5, ${labelFor(value, labels)}`
}

const STAR_PATH =
  'M12 2.1l2.79 6.02 6.61.62-4.98 4.39 1.46 6.48L12 16.9l-5.88 3.71 1.46-6.48L2.6 8.74l6.61-.62z'

function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(6)
    } catch {
      /* no-op */
    }
  }
}

/* Static half-star display for reveals and completed artifacts. */
export function MiniStars({
  value,
  community = false,
}: {
  value: number
  community?: boolean
}) {
  return (
    <span className={`ministars${community ? ' c' : ''}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const frac = clamp(value - i, 0, 1)
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex', width: 15, height: 15 }}>
            <svg className="e" viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
              <path d={STAR_PATH} />
            </svg>
            <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${frac * 100}%` }}>
              <svg className="f" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
                <path d={STAR_PATH} />
              </svg>
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function StarRange({
  value,
  onChange,
  labels,
  ariaLabel = 'Rating',
  showReadout = true,
}: {
  value: number | null
  onChange: (v: number | null) => void
  labels: string[]
  ariaLabel?: string
  showReadout?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [preview, setPreview] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const display = preview ?? value

  function readFromEvent(clientX: number) {
    const el = trackRef.current
    if (!el) return 0.5
    const r = el.getBoundingClientRect()
    return ratingFromPointer(clientX, r.left, r.width)
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    trackRef.current?.setPointerCapture(e.pointerId)
    const v = readFromEvent(e.clientX)
    setPreview(v)
    setDragging(true)
    haptic()
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const v = readFromEvent(e.clientX)
    setPreview((prev) => {
      if (prev !== v) haptic()
      return v
    })
  }
  function commit(e: React.PointerEvent) {
    if (!dragging) return
    trackRef.current?.releasePointerCapture?.(e.pointerId)
    const v = preview
    setDragging(false)
    setPreview(null)
    if (v != null) onChange(v) // persist only on release / tap
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const cur = value ?? 0
    let next: number | null = null
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = clamp(cur + 0.5, 0.5, 5)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value == null ? null : clamp(cur - 0.5, 0.5, 5)
        break
      case 'Home':
        next = 0.5
        break
      case 'End':
        next = 5
        break
      case 'Delete':
      case 'Backspace':
        onChange(null)
        e.preventDefault()
        return
      default:
        return
    }
    e.preventDefault()
    onChange(next)
  }

  return (
    <div className="starrange">
      <div
        ref={trackRef}
        className={`star-track${dragging ? ' dragging' : ''}`}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={display ?? undefined}
        aria-valuetext={ariaValueText(display, labels)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={commit}
        onPointerCancel={commit}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const frac = clamp((display ?? 0) - i, 0, 1)
          return (
            <span className="star-cell" key={i} aria-hidden>
              <svg className="star-bg" viewBox="0 0 24 24">
                <path d={STAR_PATH} />
              </svg>
              <span className="star-fillwrap" style={{ width: `${frac * 100}%` }}>
                <svg className="star-fg" viewBox="0 0 24 24">
                  <path d={STAR_PATH} />
                </svg>
              </span>
            </span>
          )
        })}
      </div>

      {showReadout && (
        <div className="star-readout" aria-hidden>
          {display == null ? (
            <span className="sr-empty">Tap or drag to rate</span>
          ) : (
            <>
              <span className="sr-num num">{display.toFixed(1)}</span>
              <span className="sr-label">— {labelFor(display, labels)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
