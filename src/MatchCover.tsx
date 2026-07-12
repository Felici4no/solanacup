import {
  team,
  competition,
  coverGradient,
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
