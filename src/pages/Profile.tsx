import { useState } from 'react'
import { profile } from '../data'
import { TeamSmoke } from '../MatchCover'
import { Crest, team, darken } from '../assets'
import { useNav } from '../nav'
import { Icon } from '../ui'

/* Perfil — quem esta pessoa se tornou através do esporte.
   Identidade · clubes do coração · memória marcante · coleções · sequência. */

const ICONS: Record<string, JSX.Element> = {
  ticket: Icon.Ticket,
  shirt: Icon.Shirt,
  trophy: Icon.Trophy,
}

export default function Profile() {
  const m = profile.marcante
  const { openProfileEdit, openWatchlist } = useNav()
  return (
    <div className="page pf-page">
      {/* 1 — identidade */}
      <section className="pf-id">
        <ProfileAvatar onEdit={openProfileEdit} />
        <div className="pf-id-body">
          <h1 className="pf-name">{profile.name}</h1>
          <p className="pf-loc">
            <span className="pf-loc-ic">{Icon.Pin}</span>
            {profile.location}
          </p>
          <p className="pf-tag">{profile.tagline}</p>
        </div>
      </section>

      {/* 2 — stats */}
      <section className="pf-stats">
        {profile.stats.map((s) => (
          <div className="pf-stat" key={s.l}>
            <div className="n num">{s.n}</div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </section>

      {/* 3 — clubes do coração */}
      <section className="pf-sec">
        <div className="pf-sec-head">
          <span className="label">Clubes do coração</span>
          <button className="pf-edit" onClick={openProfileEdit}>Editar</button>
        </div>
        <div className="pf-clubs">
          {profile.clubs.map((c) => (
            <ClubCard key={c.id} id={c.id} label={c.label} />
          ))}
        </div>
      </section>

      {/* 4 — memória marcante */}
      <section className="pf-sec">
        <div className="pf-sec-head">
          <span className="label">Memória marcante</span>
        </div>
        <article className="mm-card">
          <div
            className="mm-img"
            style={{ '--flare': team(m.home).colors[0] } as React.CSSProperties}
            aria-hidden
          >
            <span className="mm-crowd" />
            <span className="mm-flare" />
          </div>
          <div className="mm-body">
            <div className="mm-top">
              <span className="mm-date num">{m.date}</span>
              <BookmarkButton />
            </div>
            <h3 className="mm-title">{m.title}</h3>
            <span className="mm-meta">{m.meta}</span>
            <p className="mm-quote">“{m.quote}”</p>
          </div>
        </article>
      </section>

      {/* 5 — minhas coleções */}
      <section className="pf-sec">
        <div className="pf-sec-head">
          <span className="label">Minhas coleções</span>
        </div>
        <div className="pf-collections">
          {profile.collections.map((c) => (
            <div className="col-card" key={c.label}>
              <span className="col-icon">{ICONS[c.icon]}</span>
              <div className="col-text">
                <span className="col-label">{c.label}</span>
                <span className="col-count num">{c.count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6 — sequência ativa */}
      <section className="pf-sec">
        <button className="streak-card" onClick={openWatchlist} aria-label="Ver sequência de partidas acompanhadas">
          <span className="streak-icon">{Icon.Flame}</span>
          <div className="streak-body">
            <span className="streak-label">Sequência ativa</span>
            <span className="streak-title">{profile.streak.count}</span>
            <span className="streak-sub">{profile.streak.sub}</span>
          </div>
          <span className="streak-chev">{Icon.Chevron}</span>
        </button>
      </section>
    </div>
  )
}

/* Circular avatar — warm stadium light, a supporter silhouette, gold ring. */
function ProfileAvatar({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="pf-avatar">
      <span className="pf-av-bg" aria-hidden />
      <span className="pf-av-crowd" aria-hidden />
      <svg className="pf-av-figure" viewBox="0 0 100 100" aria-hidden>
        <g fill="#08080a">
          <circle cx="50" cy="52" r="7.6" />
          <path d="M39 66 Q39 60 50 60 Q61 60 61 66 L64 100 L36 100 Z" />
          <path d="M41 63 L27 44 L31.5 41 L47 59 Z" />
          <path d="M59 63 L73 44 L68.5 41 L53 59 Z" />
        </g>
      </svg>
      <button className="pf-av-edit" aria-label="Editar perfil" onClick={onEdit}>
        {Icon.Pencil}
      </button>
    </div>
  )
}

/* Bookmark toggle with a real, visible pressed state. */
function BookmarkButton() {
  const [saved, setSaved] = useState(true)
  return (
    <button
      className={`mm-bookmark${saved ? ' on' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Remover dos salvos' : 'Salvar memória'}
      onClick={() => setSaved((s) => !s)}
    >
      {Icon.Bookmark}
    </button>
  )
}

/* Club-of-the-heart card — single-team atmosphere + crest + name. */
function ClubCard({ id, label }: { id: string; label: string }) {
  const c = team(id).colors[0]
  const bg = `linear-gradient(180deg, ${darken(c, 0.62)}, #0d0c10 78%)`
  return (
    <div className="club-card" style={{ background: bg }}>
      <TeamSmoke home={id} single />
      <span className="atmos-grain" aria-hidden />
      <div className="club-crest">
        <Crest id={id} size={42} />
      </div>
      <span className="club-name">{label}</span>
    </div>
  )
}
