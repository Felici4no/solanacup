import { radarLead, radarStories } from '../data'
import { MatchCover } from '../MatchCover'
import { competition, team } from '../assets'
import { useNav } from '../nav'
import { Dot } from '../ui'

function meta(m: (typeof radarStories)[number]) {
  const c = competition(m.match.competition)
  return (
    <div className="rmeta">
      <span className="caption">{c.label}</span>
      <Dot />
      <span className="caption num">{m.match.date}</span>
      <Dot />
      <span className="caption num">{m.meta}</span>
    </div>
  )
}

export default function Radar() {
  const { openMatch } = useNav()
  return (
    <div className="page">
      <div style={{ marginTop: 8 }}>
        <h1 className="title">Stories worth remembering.</h1>
        <p className="body" style={{ marginTop: 8 }}>
          Not rankings. The matches people carried home.
        </p>
      </div>

      {/* Lead story */}
      <section className="section rlead">
        <button className="cover-tap" onClick={() => openMatch(radarLead.match)} aria-label="Open match detail">
          <MatchCover match={radarLead.match} format="landscape" />
        </button>
        <blockquote className="rquote">“{radarLead.quote}”</blockquote>
        <div className="rmeta">
          <span className="caption">{competition(radarLead.match.competition).label}</span>
          <Dot />
          <span className="caption num">{radarLead.match.date}</span>
          <Dot />
          <span className="caption num">{radarLead.meta}</span>
        </div>
      </section>

      {/* Following stories */}
      {radarStories.map((s) => (
        <section className="rstory" key={`${s.match.home}-${s.match.away}`}>
          <button className="cover-tap" onClick={() => openMatch(s.match)} aria-label="Open match detail">
            <MatchCover match={s.match} format="landscape" />
          </button>
          <blockquote className="rquote">“{s.quote}”</blockquote>
          {meta(s)}
        </section>
      ))}

      <section className="section">
        <p className="caption" style={{ color: 'var(--ink-4)' }}>
          People also remembered a quiet {team('saopaulo').name} draw that meant
          everything to the few who were there.
        </p>
      </section>
    </div>
  )
}
