import { useState } from 'react'
import { recentSearches, suggested, searchResults } from '../data'
import { MatchCover, PlayerThumb, StadiumThumb } from '../MatchCover'
import { Crest, competition, team } from '../assets'
import { useNav } from '../nav'
import { SectionHead, Dot, Icon } from '../ui'

export default function Search() {
  const [q, setQ] = useState('')
  const active = q.trim().length > 0
  const { openMatch } = useNav()

  return (
    <div className="page">
      <div className="search-field">
        {Icon.Search2}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the entire history of sport"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {!active ? (
        <>
          <section className="section" style={{ marginTop: 36 }}>
            <SectionHead label="Recent" />
            {recentSearches.map((r) => (
              <button className="recent-row" key={r} onClick={() => setQ(r)}>
                {Icon.Clock}
                <span className="txt">{r}</span>
                {Icon.Arrow}
              </button>
            ))}
          </section>

          <section className="section">
            <SectionHead label="Clubs" />
            <div className="stiles">
              {suggested.clubs.map((c) => (
                <button className="stile" key={c.id} onClick={() => setQ(c.label)}>
                  <Crest id={c.id} size={40} />
                  <span>
                    <span className="stile-label" style={{ display: 'block' }}>{c.label}</span>
                    <span className="stile-sub">{team(c.id).city}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <SectionHead label="Players" />
            <div className="stiles">
              {suggested.players.map((p) => (
                <button className="stile" key={p.name} onClick={() => setQ(p.name)}>
                  <span style={{ width: 40, flex: '0 0 auto' }}>
                    <PlayerThumb name={p.name} colorId={p.colorId} />
                  </span>
                  <span>
                    <span className="stile-label" style={{ display: 'block' }}>{p.name}</span>
                    <span className="stile-sub">{p.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <SectionHead label="Stadiums" />
            <div className="stiles">
              {suggested.stadiums.map((s) => (
                <button className="stile" key={s.name} onClick={() => setQ(s.name)}>
                  <span style={{ width: 44, flex: '0 0 auto' }}>
                    <StadiumThumb name={s.name} tint={s.tint} />
                  </span>
                  <span>
                    <span className="stile-label" style={{ display: 'block' }}>{s.name}</span>
                    <span className="stile-sub">{s.city}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <SectionHead label="Competitions" />
            <div className="stiles">
              {suggested.competitions.map((c) => (
                <button className="stile" key={c.id} onClick={() => setQ(c.label)}>
                  <span
                    style={{
                      width: 40, height: 40, flex: '0 0 auto', borderRadius: 6,
                      background: competition(c.id).accent + '22',
                      border: `1px solid ${competition(c.id).accent}55`,
                      display: 'grid', placeItems: 'center',
                      fontFamily: 'var(--serif)', color: competition(c.id).accent,
                    }}
                  >
                    {c.label.charAt(0)}
                  </span>
                  <span className="stile-label">{c.label}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="section" style={{ marginTop: 28 }}>
          <SectionHead label={`Archive · “${q}”`} />
          {searchResults.map((r) => (
            <button className="sresult" key={`${r.match.home}-${r.match.away}`} onClick={() => openMatch(r.match)}>
              <div className="sthumb">
                <MatchCover match={r.match} format="thumb" />
              </div>
              <div className="sbody">
                <h3 className="s-title">
                  {team(r.match.home).name} vs {team(r.match.away).name}
                </h3>
                <div className="s-sub">
                  <span className="caption">{competition(r.match.competition).label}</span>
                  <Dot />
                  <span className="caption num">{r.match.date}</span>
                </div>
              </div>
              <div className="s-mem">
                <span className="n num">{r.memories}</span>
                <span className="label" style={{ display: 'block', marginTop: 2 }}>
                  memories
                </span>
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
