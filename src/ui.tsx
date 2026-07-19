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

/* Marks a surface built from seeded content, so illustrative data is
   never mistaken for real traction. */
export function DemoTag({ label = 'Demo data' }: { label?: string }) {
  return <span className="demo-tag">{label}</span>
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
/* Contextual, accessible error with a recovery action. Local component
   state is the primary feedback — this is not a toast. */
export function ActionError({
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className="action-error" role="alert">
      <span className="ae-msg">{message}</span>
      {onRetry && (
        <button className="ae-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}

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
  Gear: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.6v2.4M12 19v2.4M21.4 12H19M5 12H2.6M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7M18.6 18.6l-1.7-1.7M7.1 7.1L5.4 5.4" />
    </svg>
  ),
  Pin: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 21c4-4.4 6-7.4 6-10.4A6 6 0 0 0 6 10.6C6 13.6 8 16.6 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="10.4" r="2.1" />
    </svg>
  ),
  Pencil: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M15.4 5.6l3 3M4 20l1.2-4.2L15.4 5.6l3 3L8.2 18.8 4 20z" />
    </svg>
  ),
  Bookmark: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4.2L6 20V5a1 1 0 0 1 1-1z" />
    </svg>
  ),
  Ticket: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.4a1.6 1.6 0 0 0 0 3.2V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.4a1.6 1.6 0 0 0 0-3.2V9z" />
      <path d="M13 7.4v9.2" strokeDasharray="1.6 2" />
    </svg>
  ),
  Shirt: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M8.6 4L4 6.6 6.1 10l2.1-1.2V20h7.6V8.8L17.9 10 20 6.6 15.4 4a3.4 3.4 0 0 1-6.8 0z" />
    </svg>
  ),
  Trophy: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 4.5h8V8a4 4 0 0 1-8 0V4.5z" />
      <path d="M8 5.5H5.6A2.4 2.4 0 0 0 8.4 8M16 5.5h2.4A2.4 2.4 0 0 1 15.6 8" />
      <path d="M12 12v3M9.2 19.5h5.6M10 19.5l.5-3M14 19.5l-.5-3" />
    </svg>
  ),
  Flame: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M12 3.2c3 3.4 4.9 5.9 4.9 8.9a4.9 4.9 0 0 1-9.8 0c0-1.7.7-3 1.9-4.3.2 1.2.8 2 1.8 2.2C10 8.4 10.6 6 12 3.2z" />
    </svg>
  ),
  Chevron: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 6l6 6-6 6" />
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
  Bell: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.5 2 6.3H4c.8-.8 2-2.3 2-6.3Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  BellOff: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 0 1 9.6-4.8M18 9c0 4 1.2 5.5 2 6.3H8" />
      <path d="M10 19a2 2 0 0 0 4 0" />
      <path d="M4 3l16 18" />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  ),
  Share: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="M8.1 10.9l7.8-4.4M8.1 13.1l7.8 4.4" />
    </svg>
  ),
}
