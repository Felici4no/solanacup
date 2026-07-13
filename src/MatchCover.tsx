import {
  team,
  competition,
  coverGradient,
  darken,
  Crest,
  rgba,
} from './assets'

export type MatchData = {
  home: string
  away: string
  competition: string
  stage?: string
  date?: string
  kickoff?: string
  venue?: string
  status?: string
  score?: string
  variant?: 'night' | 'historic'
}

type Format = 'hero' | 'poster' | 'landscape' | 'thumb'

/* Stadium-night atmosphere: floodlight glow + crowd speckle. Generative,
   so every cover reads as "a match" without stock photography. */
function Atmosphere({ historic }: { historic?: boolean }) {
  return (
    <>
      <span className="atmos-flood" aria-hidden />
      <span className={`atmos-crowd${historic ? ' is-historic' : ''}`} aria-hidden />
      <span className="atmos-grain" aria-hidden />
    </>
  )
}

export function MatchCover({
  match: m,
  format = 'poster',
  className = '',
}: {
  match: MatchData
  format?: Format
  className?: string
}) {
  const h = team(m.home)
  const a = team(m.away)
  const comp = competition(m.competition)
  const historic = m.variant === 'historic'
  const bg = coverGradient(h, a, m.variant ?? 'night')
  const crestSize =
    format === 'hero' ? 46 : format === 'thumb' ? 22 : format === 'poster' ? 30 : 34

  return (
    <div
      className={`cover cover-${format} ${className}`}
      style={{ background: bg, borderColor: rgba(a.colors[0], 0.28) }}
    >
      <Atmosphere historic={historic} />
      {!historic && <TeamSmoke home={m.home} away={m.away} />}
      <span className="cover-scrim" aria-hidden />

      <div className="cover-in">
        <div className="cover-top">
          <span
            className="comp-tag"
            style={{ color: comp.accent, borderColor: rgba(comp.accent, 0.5) }}
          >
            {format === 'poster' ? comp.short : comp.label}
            {m.stage && (format === 'hero' || format === 'landscape') ? ` · ${m.stage}` : ''}
          </span>
          {m.status && format !== 'thumb' && format !== 'poster' && (
            <span className={`cover-status${/live|watching/i.test(m.status) ? ' is-live' : ''}`}>
              {/live|watching/i.test(m.status) && <span className="beat" aria-hidden />}
              {m.status}
            </span>
          )}
        </div>

        <div className="cover-crests" aria-hidden={format === 'thumb'}>
          <Crest id={h.id} size={crestSize} />
          {m.score ? (
            <span className="cover-score num">{m.score}</span>
          ) : (
            <span className="cover-vs">vs</span>
          )}
          <Crest id={a.id} size={crestSize} />
        </div>

        <div className="cover-foot">
          <h3 className="cover-teams">
            <span>{h.name}</span>
            <span className="cover-teams-sep" aria-hidden>
              —
            </span>
            <span>{a.name}</span>
          </h3>
          {format !== 'thumb' && (m.venue || m.kickoff || m.date) && (
            <p className="cover-meta">
              {m.venue && <span>{m.venue}</span>}
              {(m.kickoff || m.date) && (
                <span className="num">{m.kickoff ?? m.date}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   SplitCover — cinematic split-identity match poster, rebuilt to
   the reference: red smoke × graphite smoke, gold light beam,
   embers, grounded stadium. Fully generated (CSS/SVG), no photos.
   ============================================================ */

// deterministic embers on the red (home) side
const EMBERS = [
  [8, 30, 1.6, 0.7], [14, 62, 1.1, 0.5], [6, 78, 2, 0.55], [20, 22, 0.9, 0.6],
  [24, 48, 1.4, 0.45], [12, 44, 0.8, 0.7], [30, 68, 1.2, 0.4], [4, 52, 1.3, 0.5],
  [18, 84, 1.7, 0.5], [34, 34, 1, 0.5], [10, 16, 1.1, 0.45], [26, 88, 0.9, 0.55],
  [38, 56, 1.4, 0.35], [16, 72, 0.8, 0.6], [22, 38, 1.1, 0.5], [30, 20, 0.9, 0.4],
  [42, 74, 1.2, 0.3], [9, 90, 1, 0.5],
] as const

/* Reusable team smoke — cloud that follows a team's colour. Single team, or
   split (home left, away right). Used on every team/matchup representation. */
export function TeamSmoke({
  home,
  away,
  single = false,
}: {
  home: string
  away?: string
  single?: boolean
}) {
  const hc = team(home).colors[0]
  if (single || !away) {
    return (
      <span
        className="tsmoke tsmoke-full"
        style={{ background: `radial-gradient(64% 60% at 50% 40%, ${hc}, ${darken(hc, 0.4)} 52%, transparent 82%)` }}
        aria-hidden
      />
    )
  }
  const ac = team(away).colors[0]
  return (
    <>
      <span
        className="tsmoke tsmoke-l"
        style={{ background: `radial-gradient(66% 70% at 30% 44%, ${hc}, ${darken(hc, 0.4)} 52%, transparent 80%)` }}
        aria-hidden
      />
      <span
        className="tsmoke tsmoke-r"
        style={{ background: `radial-gradient(66% 70% at 72% 34%, ${ac}, ${darken(ac, 0.42)} 50%, transparent 80%)` }}
        aria-hidden
      />
    </>
  )
}

export function SplitCover({
  match: m,
  size = 'hero',
}: {
  match: MatchData
  size?: 'hero' | 'card'
}) {
  const h = team(m.home)
  const a = team(m.away)
  const comp = competition(m.competition)
  const hs = h.colors[0]
  const as_ = a.colors[0]
  const hero = size === 'hero'
  const crest = hero ? 54 : 34
  const live = m.status ? /live|watching/i.test(m.status) : false

  // Layer 1 — base split: deep team color left, graphite right, dark seam.
  const base = [
    `radial-gradient(70% 62% at 26% 40%, ${rgba(hs, 0.5)}, transparent 66%)`,
    `radial-gradient(66% 60% at 78% 30%, ${rgba(as_, 0.34)}, transparent 70%)`,
    `linear-gradient(100deg, ${darken(hs, 0.46)} 0%, ${darken(hs, 0.78)} 44%, #0a0809 52%, ${darken(as_, 0.82)} 62%, ${darken(as_, 0.6)} 100%)`,
  ].join(', ')

  return (
    <div className={`splitcover sc-${size}`} style={{ background: base }}>
      {/* 2 — smoke (follows both team colours) */}
      <TeamSmoke home={m.home} away={m.away} />
      {/* 3 — embers (home side) */}
      {hero && (
        <svg className="pk-embers" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {EMBERS.map(([x, y, r, o], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#ffb066" opacity={o} />
          ))}
        </svg>
      )}
      {/* 8 — stadium grounded in the lower composition */}
      <StadiumSilhouette homeColor={hs} />
      {/* 4 — gold light beam through the centre */}
      <span className="pk-beam-glow" aria-hidden />
      <span className="pk-beam" aria-hidden />
      {/* 10 — vignette */}
      <span className="pk-vignette" aria-hidden />
      <span className="atmos-grain" aria-hidden />

      {m.status && hero && (
        <span className={`cover-status sc-status${live ? ' is-live' : ''}`}>
          {live && <span className="beat" aria-hidden />}
          {m.status}
        </span>
      )}

      <div className="sc-in">
        {hero ? (
          <div className="sc-comp">
            <span className="c-name">{comp.label}</span>
            {m.stage && <span className="c-stage">{m.stage}</span>}
          </div>
        ) : (
          <span aria-hidden />
        )}
        <div className="sc-teams">
          <div className="sc-side">
            <Crest id={h.id} size={crest} />
            <span className="n">{h.name}</span>
          </div>
          {m.score ? (
            <span className="sc-vs score num">{m.score}</span>
          ) : (
            <span className="sc-vs" aria-label="versus">VS</span>
          )}
          <div className="sc-side">
            <Crest id={a.id} size={crest} />
            <span className="n">{a.name}</span>
          </div>
        </div>
        <div className="sc-foot">
          {(m.kickoff || m.date) && <span className="t">{m.kickoff ?? m.date}</span>}
          {m.venue && <span className="v">{m.venue}</span>}
        </div>
      </div>
    </div>
  )
}

/* Architectural bowl silhouette anchored in the lower composition,
   lit red on the home side. */
function StadiumSilhouette({ homeColor }: { homeColor: string }) {
  return (
    <div className="pk-stadium" aria-hidden>
      <span className="pk-stadium-glow" style={{ background: `radial-gradient(60% 100% at 18% 100%, ${rgba(homeColor, 0.55)}, transparent 70%)` }} />
      <svg viewBox="0 0 200 96" preserveAspectRatio="xMidYMax slice">
        {/* filled bowl grounded at the base */}
        <path d="M0 96 V72 Q100 34 200 72 V96 Z" fill="rgba(6,5,7,0.8)" />
        <path d="M0 96 V80 Q100 48 200 80 V96 Z" fill="rgba(3,2,4,0.9)" />
        <ellipse cx="100" cy="106" rx="98" ry="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.7" />
        <ellipse cx="100" cy="112" rx="122" ry="40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" />
        <ellipse cx="100" cy="118" rx="148" ry="50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.7" />
        <path d="M8 70 Q100 32 192 70" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" />
      </svg>
    </div>
  )
}

/* Horizontal image-led item — returning to an unfinished page. */
export function MemoryStrip({
  match,
  line,
  action = 'Continue',
  onClick,
}: {
  match: MatchData
  line: string
  action?: string
  onClick?: () => void
}) {
  const h = team(match.home)
  const a = team(match.away)
  return (
    <button className="strip" onClick={onClick}>
      <div className="strip-thumb">
        <MatchCover match={match} format="thumb" />
      </div>
      <div className="strip-body">
        <h4 className="strip-teams">
          {h.name} <span className="strip-vs">vs</span> {a.name}
        </h4>
        <p className="strip-line">{line}</p>
        <span className="strip-action">
          {action}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h13m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </button>
  )
}

/* Generative stadium thumbnail — roof arc + crowd + floodlight, no photo. */
export function StadiumThumb({
  name,
  tint = '#3a4a5e',
}: {
  name: string
  tint?: string
}) {
  return (
    <div
      className="stadium-thumb"
      role="img"
      aria-label={`${name} illustration`}
      style={{
        background: `radial-gradient(80% 60% at 50% -10%, ${rgba(
          tint,
          0.5,
        )}, transparent 60%), linear-gradient(180deg, #1a1922 0%, #101018 100%)`,
      }}
    >
      <svg className="st-arc" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
        <ellipse cx="50" cy="66" rx="52" ry="26" fill="none" stroke={rgba(tint, 0.6)} strokeWidth="1" />
        <ellipse cx="50" cy="70" rx="40" ry="20" fill={rgba('#7db38a', 0.14)} stroke={rgba('#9fd7ab', 0.2)} strokeWidth="0.6" />
        <line x1="50" y1="52" x2="50" y2="88" stroke={rgba('#ffffff', 0.16)} strokeWidth="0.5" />
      </svg>
      <span className="st-crowd" aria-hidden />
    </div>
  )
}

/* Generative player portrait — monogram over team-colored gradient. */
export function PlayerThumb({
  name,
  colorId,
}: {
  name: string
  colorId?: string
}) {
  const t = colorId ? team(colorId) : null
  const c = t ? t.colors[0] : '#4a4a55'
  return (
    <div
      className="player-thumb"
      role="img"
      aria-label={name}
      style={{
        background: `radial-gradient(70% 60% at 50% 20%, ${rgba(
          c,
          0.6,
        )}, transparent 65%), linear-gradient(180deg, #201f28, #14131a)`,
      }}
    >
      <span className="pt-mono">{name.charAt(0)}</span>
    </div>
  )
}

/* Full-bleed community story — collective insight over a crowd atmosphere. */
export function CommunityStory({
  match,
  insight,
  kicker = 'Community moment',
}: {
  match: MatchData
  insight: string
  kicker?: string
}) {
  const h = team(match.home)
  const a = team(match.away)
  return (
    <div
      className="community-story"
      style={{ background: coverGradient(h, a, match.variant ?? 'night') }}
    >
      <Atmosphere />
      <span className="cover-scrim strong" aria-hidden />
      <div className="cs-in">
        <span className="cs-kicker">{kicker}</span>
        <p className="cs-insight">{insight}</p>
        <span className="cs-context">
          {competition(match.competition).label} · {h.name} vs {a.name}
        </span>
      </div>
    </div>
  )
}
