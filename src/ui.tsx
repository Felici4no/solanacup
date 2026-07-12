/* Shared editorial primitives */

export function Rating({
  value,
  max = 5,
  onPhoto = false,
}: {
  value: number
  max?: number
  onPhoto?: boolean
}) {
  return (
    <span
      className={`rating${onPhoto ? ' on-photo' : ''}`}
      aria-label={`${value} of ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <i key={i} className={i < value ? 'on' : ''} />
      ))}
    </span>
  )
}

export function Dot() {
  return <span className="dotsep" aria-hidden />
}

export function SectionHead({
  label,
  more,
}: {
  label: string
  more?: string
}) {
  return (
    <div className="section-head">
      <span className="label">{label}</span>
      {more && <span className="more">{more}</span>}
    </div>
  )
}

/* Thin-line iconography (1px) */
export const Icon = {
  Home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 10.5 12 4l8 6.5M6 9.5V20h12V9.5" strokeLinejoin="round" />
    </svg>
  ),
  Radar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  Pulse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h3.5l2-6 3.5 12 2.5-8 1.5 2H21" />
    </svg>
  ),
  Search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
    </svg>
  ),
  Profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="12" cy="8.5" r="4" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" />
    </svg>
  ),
  Archive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3.5" y="5" width="17" height="4.2" rx="0.8" />
      <path d="M5.5 9.2V18a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.2" strokeLinecap="round" />
      <path d="M10 13h4" strokeLinecap="round" />
    </svg>
  ),
  Play: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.4v13.2L19 12z" />
    </svg>
  ),
  ProfileSmall: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="12" cy="9" r="3.4" />
      <path d="M5.5 19.5c0-3.2 2.9-5.2 6.5-5.2s6.5 2 6.5 5.2" strokeLinecap="round" />
    </svg>
  ),
  Arrow: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ flex: '0 0 auto' }}>
      <path d="M5 12h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Search2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" width="18" height="18">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" strokeLinecap="round" />
    </svg>
  ),
  Clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" width="16" height="16">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}
