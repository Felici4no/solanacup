import { hallOfMemories, recentMemories, stadiums, timeline } from '../data'
import { MatchCover, MemoryStrip, StadiumThumb } from '../MatchCover'
import { useNav } from '../nav'
import { SectionHead } from '../ui'

/* Archive — everything the user chose to keep: covers, memories, places, years. */
export default function Archive() {
  const { openMatch } = useNav()
  return (
    <div className="page">
      <div style={{ marginTop: 8 }}>
        <h1 className="title">Your archive.</h1>
        <p className="body" style={{ marginTop: 8 }}>
          The matches, places and years you chose to keep.
        </p>
      </div>

      {/* Hall of Memories — poster grid */}
      <section className="section">
        <SectionHead label="Hall of Memories" more="Favorite four" />
        <div className="hall">
          {hallOfMemories.map((h) => (
            <button
              className="hall-item cover-tap"
              key={h.rank}
              onClick={() => openMatch(h.match)}
              aria-label={`Open memory ${h.rank}`}
            >
              <span className="hall-rank">{h.rank}</span>
              <MatchCover match={h.match} format="poster" />
            </button>
          ))}
        </div>
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
    </div>
  )
}
