import {
  profile,
  hallOfMemories,
  recentMemories,
  favoritePlayers,
  stadiums,
  timeline,
} from '../data'
import { MatchCover, MemoryStrip, PlayerThumb, StadiumThumb } from '../MatchCover'
import { competition, team, rgba } from '../assets'
import { useNav } from '../nav'
import MemoryCard from '../MemoryCard'
import { SectionHead } from '../ui'

export default function Profile() {
  const clubColor = team(profile.colorId).colors[0]
  const { openMatch } = useNav()
  return (
    <div className="page">
      {/* Visual autobiography header */}
      <section className="identity">
        <div
          className="avatar"
          style={{
            background: `radial-gradient(70% 60% at 50% 25%, ${rgba(clubColor, 0.7)}, transparent 65%), linear-gradient(180deg, #201f28, #14131a)`,
          }}
        >
          {profile.initials}
        </div>
        <h1 className="display">{profile.name}</h1>
        <p className="id-statement">{profile.statement}</p>
        <div className="id-stats">
          {profile.stats.map((s) => (
            <div className="st" key={s.l}>
              <div className="n num">{s.n}</div>
              <span className="l">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hall of Memories — poster grid */}
      <section className="section">
        <SectionHead label="Hall of Memories" more="Favorite four" />
        <div className="hall">
          {hallOfMemories.map((h) => (
            <button className="hall-item cover-tap" key={h.rank} onClick={() => openMatch(h.match)} aria-label={`Open memory ${h.rank}`}>
              <span className="hall-rank">{h.rank}</span>
              <MatchCover match={h.match} format="poster" />
            </button>
          ))}
        </div>
      </section>

      {/* Featured memory */}
      <section className="section">
        <SectionHead label="Featured memory" />
        <MemoryCard />
      </section>

      {/* Recent memories */}
      <section className="section">
        <SectionHead label="Recent memories" more="Chronological" />
        <div className="mem-list">
          {recentMemories.map((r) => (
            <MemoryStrip
              key={`${r.match.home}-${r.match.away}-${r.date}`}
              match={r.match}
              line={`${r.where} · ${r.date}`}
              action="Open"
              onClick={() => openMatch(r.match)}
            />
          ))}
        </div>
      </section>

      {/* Favorite players */}
      <section className="section">
        <SectionHead label="Favorite players" />
        <div className="players">
          {favoritePlayers.map((p) => (
            <article className="player" key={p.name}>
              <PlayerThumb name={p.name} colorId={p.colorId} />
              <h3 className="p-name">{p.name}</h3>
              <div className="p-stats">
                <div className="row"><span>Appearances</span><span className="num">{p.apps}</span></div>
                <div className="row"><span>Avg rating</span><span className="num">{p.rating}</span></div>
                <div className="row"><span>First — Last</span><span className="num">{p.first}–{p.last}</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Visited stadiums */}
      <section className="section">
        <SectionHead label="Visited stadiums" more="12 total" />
        <div className="stadium-grid">
          {stadiums.map((s) => (
            <div className="stadium-cell" key={s.name}>
              <StadiumThumb name={s.name} tint={s.tint} />
              <div className="sc-body">
                <div className="s-name">{s.name}</div>
                <div className="s-city">{s.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <SectionHead label="A life through sport" />
        <div className="timeline">
          {timeline.map((t) => (
            <div className={`tl ${t.mark ? 'mark' : ''}`} key={t.yr + t.ev}>
              <div className="yr num">{t.yr}</div>
              <p className="ev">{t.ev}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="caption" style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-4)' }}>
        {competition('worldcup').label} · {team(profile.colorId).name} · since {profile.since}
      </p>
    </div>
  )
}
