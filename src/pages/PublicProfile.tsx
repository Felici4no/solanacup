import { useSyncExternalStore } from 'react'
import { profile, recentMemories, stadiums } from '../data'
import { MatchCover } from '../MatchCover'
import { Crest, team } from '../assets'
import { MiniStars } from '../StarRange'
import { DemoTag, Icon } from '../ui'
import { demoStore, PUBLIC_USERNAME, SEEDED_SIGNALS } from '../demo/repository'
import { navigate, profileUrl } from '../router'
import { ShareLinkButton } from '../share'
import { PublicShell, PublicNotFound } from './PublicShell'

/* /u/:username — the shareable public face of a demo profile.
   Reads ONLY public data: bio, clubs, stats, stadiums, ratings, public
   chapters and seeded Signals. Private annotations, watchlist state and
   settings never reach this surface (enforced in demo/repository.ts).
   Simulated social data is identified ONCE, at the top. */

export default function PublicProfile({ username }: { username: string }) {
  useSyncExternalStore(demoStore.subscribe, demoStore.getSnapshot, demoStore.getSnapshot)
  const accent = team(profile.colorId).colors[0]

  if (username !== PUBLIC_USERNAME) {
    return (
      <PublicShell ambient={['#2b303a', '#24222b']} cta={{ label: 'Open demo', to: '/welcome' }}>
        <PublicNotFound what="profile" />
      </PublicShell>
    )
  }

  const chapters = demoStore.publicChapters()

  return (
    <PublicShell ambient={[accent, '#2a2430']} intensity={0.6} cta={{ label: 'Open demo', to: '/welcome' }}>
      <div className="page pf-page">
        {/* identity — public bio only */}
        <section className="pf-id">
          <span className="pub-avatar" style={{ background: accent }} aria-hidden>
            {profile.initials}
          </span>
          <div className="pf-id-body">
            <h1 className="pf-name">{profile.name}</h1>
            <p className="pf-loc">
              <span className="pf-loc-ic">{Icon.Pin}</span>
              {profile.location}
            </p>
            <p className="pf-tag">{profile.tagline}</p>
            <div className="pub-idtags">
              <span className="pub-demo-chip">Demo profile</span>
              {/* simulated social data — identified once, here, for the whole page */}
              <DemoTag label="Simulated social data" />
            </div>
          </div>
        </section>

        <div className="pub-share">
          <ShareLinkButton label="Copy profile link" title={`${profile.name} · GAM3BOOK`} url={profileUrl(username)} />
        </div>

        {/* stats — partidas · este ano · estádios */}
        <section className="pf-stats">
          {profile.stats.map((s) => (
            <div className="pf-stat" key={s.l}>
              <div className="n num">{s.n}</div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </section>

        {/* clubes */}
        <section className="pf-sec">
          <div className="pf-sec-head">
            <span className="label">Clubes do coração</span>
          </div>
          <div className="pub-clubs">
            {profile.clubs.map((c) => (
              <span className="pub-club" key={c.id}>
                <Crest id={team(c.id).id} size={22} />
                {c.label}
              </span>
            ))}
          </div>
        </section>

        {/* memórias públicas (visitor chapters + seeded) */}
        <section className="pf-sec">
          <div className="pf-sec-head">
            <span className="label">Memórias públicas</span>
          </div>
          {chapters.map((ch) => (
            <button className="pub-chapter" key={ch.id} onClick={() => navigate(`/chapters/${ch.id}`)}>
              <div className="pub-ch-cover" aria-hidden>
                <MatchCover match={ch.match} format="thumb" />
              </div>
              <span className="pub-ch-body">
                <span className="pub-ch-teams">
                  {team(ch.match.home).name} {ch.match.score ?? ''} {team(ch.match.away).name}
                </span>
                {ch.memory.moment && (
                  <span className="pub-ch-moment num">
                    {ch.memory.moment.min} · {ch.memory.moment.type} · {ch.memory.moment.player}
                  </span>
                )}
                <span className="pub-ch-note">“{ch.memory.note}”</span>
                <span className="pub-ch-stars">
                  <MiniStars value={ch.memory.rating} />
                </span>
              </span>
            </button>
          ))}
        </section>

        {/* avaliações */}
        <section className="pf-sec">
          <div className="pf-sec-head">
            <span className="label">Avaliações</span>
          </div>
          {recentMemories.map((r) => (
            <div className="pub-rating" key={r.date}>
              <span className="pub-rating-match">
                {team(r.match.home).name} {r.match.score} {team(r.match.away).name}
              </span>
              <span className="pub-rating-meta">
                {r.date} · {r.where}
              </span>
              <MiniStars value={r.rating} />
            </div>
          ))}
        </section>

        {/* estádios */}
        <section className="pf-sec">
          <div className="pf-sec-head">
            <span className="label">Estádios</span>
          </div>
          <div className="pub-clubs">
            {stadiums.map((s) => (
              <span className="pub-club" key={s.name}>
                <span className="pub-dot" style={{ background: s.tint }} aria-hidden />
                {s.name} · {s.city}
              </span>
            ))}
          </div>
        </section>

        {/* listas */}
        <section className="pf-sec">
          <div className="pf-sec-head">
            <span className="label">Listas</span>
          </div>
          {profile.collections.map((c) => (
            <div className="pub-list-row" key={c.label}>
              <span>{c.label}</span>
              <span className="num">{c.count}</span>
            </div>
          ))}
        </section>

        {/* Signals — seeded flavour of the fan-token loop */}
        <section className="pf-sec">
          <div className="pf-sec-head">
            <span className="label">Signals</span>
          </div>
          {SEEDED_SIGNALS.map((s) => (
            <div className="pub-list-row" key={s.id}>
              <span>{s.label}</span>
              <span className="pub-signal-detail">{s.detail}</span>
            </div>
          ))}
        </section>

        <div className="pub-cta">
          <button className="pub-enter solid" onClick={() => navigate('/welcome')}>
            Create your own chapter — explore the demo
          </button>
        </div>
      </div>
    </PublicShell>
  )
}
