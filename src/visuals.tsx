import { team, rgba, Flag, type FlagCode } from './assets'

/* ============================================================
   Asset architecture with graceful fallbacks:
   1 photograph → 2 generated scene → 3 team-color → 4 crest/flag
   → 5 neutral. Only tiers 2–4 are implemented; `image`/`model3d`
   slots are ready for future photography and 3D without rewrites.
   ============================================================ */

export type StadiumInfo = {
  name: string
  city?: string
  country?: string
  capacity?: string
  club?: string
  tint?: string
  image?: string // future photograph
  model3d?: string // future 3D model URL
}

export function StadiumVisual({
  stadium: s,
  showMeta = true,
}: {
  stadium: StadiumInfo
  showMeta?: boolean
}) {
  const tint = s.tint ?? '#3a4a5e'
  return (
    <div className="stadium-visual">
      <div className="sv-scene" role="img" aria-label={`${s.name}${s.city ? `, ${s.city}` : ''} — illustration`}>
        {s.image ? (
          <img src={s.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <StadiumScene tint={tint} />
        )}
        {s.model3d && <span className="sv-3d">3D preview</span>}
      </div>
      {showMeta && (
        <div className="sv-body">
          <div className="sv-name">{s.name}</div>
          <div className="sv-meta">
            {(s.city || s.country) && <span>{[s.city, s.country].filter(Boolean).join(', ')}</span>}
            {s.capacity && <span><b>{s.capacity}</b> capacity</span>}
            {s.club && <span>{s.club}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

/* Architectural line-drawing scene — a recognizable "place", not an icon. */
function StadiumScene({ tint }: { tint: string }) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(90% 70% at 50% -20%, ${rgba(tint, 0.55)}, transparent 60%), linear-gradient(180deg, #1a1922, #0f0e15)`,
        }}
      />
      <svg viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {/* floodlight bloom */}
        <ellipse cx="40" cy="0" rx="46" ry="30" fill={rgba('#ffffff', 0.06)} />
        <ellipse cx="160" cy="0" rx="46" ry="30" fill={rgba('#ffffff', 0.06)} />
        {/* bowl */}
        <ellipse cx="100" cy="120" rx="112" ry="52" fill="none" stroke={rgba(tint, 0.7)} strokeWidth="1" />
        <ellipse cx="100" cy="122" rx="86" ry="40" fill="none" stroke={rgba('#ffffff', 0.18)} strokeWidth="0.7" />
        {/* pitch */}
        <ellipse cx="100" cy="124" rx="60" ry="27" fill={rgba('#7db38a', 0.13)} stroke={rgba('#9fd7ab', 0.22)} strokeWidth="0.6" />
        <line x1="100" y1="98" x2="100" y2="150" stroke={rgba('#ffffff', 0.16)} strokeWidth="0.5" />
        <circle cx="100" cy="124" r="9" fill="none" stroke={rgba('#ffffff', 0.16)} strokeWidth="0.5" />
        {/* roof struts */}
        <path d="M4 60 Q100 24 196 60" fill="none" stroke={rgba(tint, 0.5)} strokeWidth="1" />
      </svg>
      <div className="sv-crowd" />
    </>
  )
}

/* ============================================================ PLAYER */
export type PlayerInfo = {
  name: string
  colorId?: string
  number?: number | string
  position?: string
  flag?: FlagCode
  image?: string // future portrait
  model3d?: string
}

export function PlayerVisual({ player: p }: { player: PlayerInfo }) {
  const t = p.colorId ? team(p.colorId) : null
  const c = t ? t.colors[0] : '#4a4a55'
  return (
    <div className="player-visual">
      <div className="pv-portrait" role="img" aria-label={p.name}>
        {p.image ? (
          <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(72% 60% at 50% 22%, ${rgba(c, 0.62)}, transparent 66%), linear-gradient(180deg, #201f28, #14131a)`,
            }}
          />
        )}
        {p.number != null && <span className="pv-num">{p.number}</span>}
        {p.flag && (
          <span className="pv-flag">
            <Flag code={p.flag} size={20} shape="roundel" label={p.name} />
          </span>
        )}
        <span className="pv-scrim" />
        {!p.image && <span className="pv-mono">{p.name.charAt(0)}</span>}
        <div className="pv-body">
          <div className="pv-name">{p.name}</div>
          {p.position && <div className="pv-pos">{p.position}</div>}
        </div>
      </div>
    </div>
  )
}
