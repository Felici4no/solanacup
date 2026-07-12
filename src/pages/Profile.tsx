import { profile, favoritePlayers } from '../data'
import { PlayerThumb } from '../MatchCover'
import { competition, team, rgba } from '../assets'
import MemoryCard from '../MemoryCard'
import { SectionHead } from '../ui'

/* Perfil — who this person became through sport. The memory archive lives
   in the Archive tab; this page carries identity and highlights. */
export default function Profile() {
  const clubColor = team(profile.colorId).colors[0]
  return (
    <div className="page">
      {/* Editorial identity */}
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

      {/* The featured memory artifact */}
      <section className="section">
        <SectionHead label="Featured memory" />
        <MemoryCard />
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

      <p className="caption" style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-4)' }}>
        {competition('worldcup').label} · {team(profile.colorId).name} · since {profile.since}
      </p>
    </div>
  )
}
