import { useState } from 'react'
import {
  todaysChapter,
  continueMemory,
  onThisDay,
  communityMoment,
  comingUp,
} from '../data'
import { MatchCover, MemoryStrip, CommunityStory, type MatchData } from '../MatchCover'
import { useNav } from '../nav'
import { Rating, SectionHead, Dot } from '../ui'

type Phase = 'pre' | 'live' | 'post' | 'none'

const PHASES: { id: Phase; label: string }[] = [
  { id: 'pre', label: 'Pre-match' },
  { id: 'live', label: 'Live' },
  { id: 'post', label: 'Full time' },
  { id: 'none', label: 'No match' },
]

export default function Home() {
  const [phase, setPhase] = useState<Phase>('pre')
  const [watching, setWatching] = useState(false)
  const { openMatch, openWatchlist } = useNav()

  const pick = (p: Phase) => {
    setPhase(p)
    setWatching(false)
  }

  // Build the hero match by temporal state.
  const heroMatch: MatchData = {
    ...todaysChapter,
    status: phase === 'live' ? 'You’re watching' : phase === 'post' ? 'Ended' : watching ? 'You’re in' : 'Tonight',
    kickoff: phase === 'live' ? todaysChapter.minute : phase === 'post' ? undefined : todaysChapter.kickoff,
    score: phase === 'live' ? todaysChapter.liveScore : phase === 'post' ? todaysChapter.fullTime : undefined,
  }

  return (
    <div className="page">
      {/* Demo-only: preview all temporal + edge states */}
      <div className="statepeek" role="group" aria-label="Preview state">
        <span className="label">State</span>
        <div className="peek-pills">
          {PHASES.map((p) => (
            <button key={p.id} className="peek-pill" aria-pressed={phase === p.id} onClick={() => pick(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1 — Today's Chapter */}
      <section>
        <SectionHead label="Today’s Chapter" />
        {phase !== 'none' ? (
          <div className="hero-cover">
            <button className="cover-tap" onClick={() => openMatch(heroMatch)} aria-label="Open match detail">
              <MatchCover match={heroMatch} format="hero" />
            </button>
            <div className="hero-bar">
              {phase === 'pre' && !watching && (
                <button className="cta-block" onClick={() => setWatching(true)}>
                  I’m Watching
                </button>
              )}
              {phase === 'pre' && watching && (
                <div className="confirm" role="status">
                  <span className="c-left">
                    <span className="tick" aria-hidden />
                    <span className="c-text">Memory started</span>
                    <span className="c-sub num">· Kickoff 21:30</span>
                  </span>
                  <button className="undo" onClick={() => setWatching(false)}>
                    Undo
                  </button>
                </div>
              )}
              {phase === 'live' && <button className="cta-block ghost">Add a moment</button>}
              {phase === 'post' && <button className="cta-block">Complete your memory</button>}
            </div>
          </div>
        ) : (
          <NoMatchHero />
        )}
      </section>

      {/* COMING UP — compact watchlist rail (only when saved matches exist) */}
      {comingUp.length > 0 && (
        <section className="section">
          <SectionHead label="Coming up" more="Watchlist" />
          <div className="coming-rail">
            {comingUp.map((w, i) => (
              <div className="coming-card" key={i}>
                <button className="saved-badge" aria-label="Remove from Watchlist">✓</button>
                <button className="cover-tap" onClick={() => openMatch(w.match)} aria-label="Open match">
                  <MatchCover match={w.match} format="landscape" />
                </button>
                <div className="cc-meta">
                  <span className="cc-date num">{w.date}</span>
                  {w.venue && <span className="cc-venue">· {w.venue}</span>}
                </div>
              </div>
            ))}
          </div>
          <button
            className="wi-btn"
            style={{ marginTop: 16 }}
            onClick={openWatchlist}
          >
            See all upcoming chapters →
          </button>
        </section>
      )}

      {/* SECTION 2 — Continue a memory */}
      <section className="section">
        <SectionHead label="Continue a memory" />
        <MemoryStrip match={continueMemory.match} line={continueMemory.line} onClick={() => openMatch(continueMemory.match)} />
      </section>

      {/* SECTION 3 — On this day */}
      <section className="section">
        <SectionHead label="On this day" />
        <div className="otd-wrap">
          <button className="cover-tap" onClick={() => openMatch(onThisDay.match)} aria-label="Open match detail">
            <MatchCover match={onThisDay.match} format="landscape" />
          </button>
          <div className="otd-body">
            <span className="label otd-when">{onThisDay.when}</span>
            <div className="otd-row">
              <Rating value={onThisDay.rating} />
              <Dot />
              <span className="caption">{onThisDay.withWhom}</span>
              <Dot />
              <span className="caption">{onThisDay.moment}</span>
            </div>
            <p className="otd-excerpt">“{onThisDay.excerpt}”</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Community moment */}
      <section className="section">
        <SectionHead label="Community moment" />
        <CommunityStory match={communityMoment.match} insight={communityMoment.insight} kicker="Tonight at Morumbi" />
      </section>
    </div>
  )
}

/* Edge state — no match today, but still alive: revisit an archive fragment. */
function NoMatchHero() {
  return (
    <div className="hero-cover">
      <MatchCover
        match={{ ...onThisDay.match, status: 'From your archive' }}
        format="hero"
      />
      <div className="hero-bar">
        <button className="cta-block ghost">Revisit this memory</button>
      </div>
      <p className="caption" style={{ marginTop: 16, textAlign: 'center' }}>
        No match in your life today — but this one, a year ago, is worth returning to.
      </p>
    </div>
  )
}
