import { BRAND, featuredMemory as m } from './data'
import { MatchCover } from './MatchCover'
import { competition, team } from './assets'
import { Rating } from './ui'

/* Featured memory — a printable editorial artifact: cover + museum label. */
export default function MemoryCard() {
  const comp = competition(m.match.competition)
  return (
    <article className="featured">
      <MatchCover match={m.match} format="landscape" />
      <div className="f-body">
        <span className="label" style={{ color: comp.accent }}>
          {comp.label} · {m.match.stage} · {m.match.date}
        </span>
        <div className="f-grid">
          <div className="f-field">
            <span className="l">Personal rating</span>
            <div className="v">
              <Rating value={m.rating} />
            </div>
          </div>
          <div className="f-field">
            <span className="l">Where watched</span>
            <span className="v">{m.where}</span>
          </div>
          <div className="f-field">
            <span className="l">With whom</span>
            <span className="v">{m.withWhom}</span>
          </div>
          <div className="f-field">
            <span className="l">Favorite player</span>
            <span className="v">{m.player}</span>
          </div>
          <div className="f-field" style={{ gridColumn: '1 / -1' }}>
            <span className="l">Favorite moment</span>
            <span className="v">{m.moment}</span>
          </div>
        </div>
        <div className="f-note">
          <span className="l" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            Personal note
          </span>
          <p style={{ marginTop: 12 }}>“{m.note}”</p>
        </div>
        <div className="f-foot">
          <span className="wordmark" style={{ paddingLeft: 0, fontSize: '0.62rem' }}>
            {BRAND.toUpperCase()}
          </span>
          <span className="caption num">
            N° {m.id} · {team(m.match.home).name}
          </span>
        </div>
      </div>
    </article>
  )
}
