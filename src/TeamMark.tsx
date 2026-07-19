/* ============================================================
   TeamMark — the one component that renders team identity:
   REAL official club crests and national flags from the central
   teamIdentity registry, with a restrained neutral fallback for
   teams whose real asset is missing. No generative fake crests.
   ============================================================ */

import { getTeamIdentity } from './teamIdentity'

export type TeamMarkShape = 'roundel' | 'shield' | 'rect'
export type TeamMarkVariant = 'crest' | 'flag' | 'auto'

export type TeamMarkProps = {
  teamId: string
  size?: number
  shape?: TeamMarkShape
  variant?: TeamMarkVariant
  /** Eager-load above-the-fold marks (hero covers). */
  priority?: boolean
  /** Accessible-label override; defaults to the team name. */
  label?: string
}

export function TeamMark({
  teamId,
  size = 40,
  shape,
  variant = 'auto',
  priority = false,
  label,
}: TeamMarkProps) {
  const identity = getTeamIdentity(teamId)
  const use =
    variant === 'auto' ? (identity.kind === 'club' ? 'crest' : 'flag') : variant
  const src = use === 'crest' ? identity.crestSrc : identity.flagSrc
  const resolvedShape: TeamMarkShape =
    shape ?? (use === 'flag' ? 'roundel' : 'shield')
  const alt = `${label ?? identity.name} ${use === 'flag' ? 'flag' : 'crest'}`
  const w = use === 'flag' && resolvedShape === 'rect' ? (size * 5) / 4 : size

  if (src) {
    const isFlag = use === 'flag'
    const cls = [
      'teammark',
      isFlag ? 'teammark-flag' : 'teammark-crest',
      `teammark-${resolvedShape}`,
      // soft neutral plate keeps white-heavy crests legible on dark
      !isFlag && resolvedShape !== 'rect' ? 'teammark-support' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <span
        className={cls}
        role="img"
        aria-label={alt}
        style={{ width: w, height: size }}
      >
        <img
          className="teammark-img"
          src={src}
          alt={identity.name}
          width={w}
          height={size}
          loading={priority ? 'eager' : 'lazy'}
          draggable={false}
        />
      </span>
    )
  }

  /* Neutral fallback — outline mark + monogram, never a fake crest. */
  return (
    <span
      className={`teammark teammark-fallback teammark-${resolvedShape}`}
      role="img"
      aria-label={alt}
      style={{ width: w, height: size }}
    >
      <svg viewBox="0 0 48 48" width={w} height={size} aria-hidden>
        {resolvedShape === 'roundel' ? (
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke={identity.neutralOnDark}
            strokeOpacity="0.42"
            strokeWidth="1.4"
          />
        ) : (
          <path
            d="M24 2 L44 9 V25 C44 37 35 44 24 47 C13 44 4 37 4 25 V9 Z"
            fill="none"
            stroke={identity.neutralOnDark}
            strokeOpacity="0.42"
            strokeWidth="1.4"
          />
        )}
      </svg>
      <span
        className="teammark-mono"
        style={{ color: identity.neutralOnDark, fontSize: size * 0.26 }}
      >
        {identity.shortName}
      </span>
    </span>
  )
}
