import { useState } from 'react'
import {
  todaysChapter,
  continueMemory,
  onThisDay,
  communityMoment,
  comingUp,
} from '../data'
import { MatchCover, SplitCover, MemoryStrip, CommunityStory, type MatchData } from '../MatchCover'
import { useNav } from '../nav'
import { Rating, SectionHead, Dot, Icon } from '../ui'

type Phase = 'pre' | 'live' | 'post' | 'none'

const PHASES: { id: Phase; label: string }[] = [
  { id: 'pre', label: 'Pre-match' },
  { id: 'live', label: 'Live' },
  { id: 'post', label: 'Full time' },
  { id: 'none', label: 'No match' },
]

// Temporal-state preview is a development aid only; it never occupies production layout.
const SHOW_STATE_SWITCHER = import.meta.env.DEV

export default function Home() {
  const [phase, setPhase] = useState<Phase>('pre')
  const [watching, setWatching] = useState(false)
  const { openMatch, openWatchlist } = useNav()

  const pick = (p: Phase) => {
    setPhase(p)
    setWatching(false)
  }

  // Build the hero match by temporal state. Pre-match carries no status chip —
  // the kickoff line already says "Tonight"; the chip appears once there is state.
  const heroMatch: MatchData = {
    ...todaysChapter,
    status: phase === 'live' ? 'You’re watching' : phase === 'post' ? 'Ended' : watching ? 'You’re in' : undefined,
    kickoff: phase === 'live' ? todaysChapter.minute : phase === 'post' ? undefined : todaysChapter.kickoff,
    score: phase === 'live' ? todaysChapter.liveScore : phase === 'post' ? todaysChapter.fullTime : undefined,
  }

  return (
    <div className="page">
      {/* Dev-only: preview all temporal + edge states (never in production layout) */}
      {SHOW_STATE_SWITCHER && (
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
      )}

      {/* SECTION 1 — Today's Chapter */}
      <section className="hero-first">
        <SectionHead label="Today’s Chapter" />
        {phase !== 'none' ? (
          <div className="hero-cover">
            <button className="cover-tap" onClick={() => openMatch(heroMatch)} aria-label="Open match detail">
              <SplitCover match={heroMatch} size="hero" />
            </button>
            <div className="hero-bar">
              {phase === 'pre' && !watching && (
                <button className="cta-block cta-watch" onClick={() => setWatching(true)}>
                  {Icon.Play} I’m Watching
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

      {/* COMING UP — split-cover rail (only when saved matches exist) */}
      {comingUp.length > 0 && (
        <section className="section coming-first">
          <div className="section-head">
            <span className="label">Coming up</span>
            <button className="more" onClick={openWatchlist}>
              See all →
            </button>
          </div>
          <div className="coming-rail">
            {comingUp.map((w, i) => (
              <div className="cu-card" key={i}>
                <button className="cover-tap" onClick={() => openMatch(w.match)} aria-label="Open match">
                  <SplitCover match={w.match} size="card" />
                </button>
                <div className="cu-meta">
                  <span className="d">{w.date}</span>
                  {w.venue && <span>· {w.venue}</span>}
                </div>
              </div>
            ))}
          </div>
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
      <SplitCover match={{ ...onThisDay.match, status: 'From your archive' }} size="hero" />
      <div className="hero-bar">
        <button className="cta-block ghost">Revisit this memory</button>
      </div>
      <p className="caption" style={{ marginTop: 16, textAlign: 'center' }}>
        No match in your life today — but this one, a year ago, is worth returning to.
      </p>
    </div>
  )
}
