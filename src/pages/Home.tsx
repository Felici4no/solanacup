import { useCallback } from 'react'
import {
  continueMemory,
  onThisDay,
  communityMoment,
} from '../data'
import { MatchCover, SplitCover, MemoryStrip, CommunityStory, type MatchData } from '../MatchCover'
import { useNav } from '../nav'
import { Rating, SectionHead, Dot, Icon, DemoTag } from '../ui'
import { useHomeMatch } from '../useHomeMatch'
import type { HomeMatch } from '../homeMatch'

// State switcher visible only during development (never in production layout)
const SHOW_STATE_SWITCHER = import.meta.env.DEV

/** Convert a HomeMatch to the MatchData shape used by cover components. */
function homeMatchToMatchData(m: HomeMatch): MatchData & { minute?: string; liveScore?: string; fullTime?: string } {
  const isLiveOrHalf = m.status === 'live' || m.status === 'halftime'
  const isEnded = m.status === 'finished'
  const hasScore = m.homeScore !== undefined && m.awayScore !== undefined

  let status: string | undefined
  if (isLiveOrHalf) status = 'LIVE'
  else if (isEnded) status = 'ENDED'

  const scoreStr = hasScore ? `${m.homeScore} — ${m.awayScore}` : undefined

  return {
    home: m.homeTeam.id,
    away: m.awayTeam.id,
    competition: 'worldcup',
    stage: m.stage,
    status,
    score: isEnded ? scoreStr : undefined,
    kickoff: !isLiveOrHalf && !isEnded
      ? formatKickoff(m.startsAt)
      : undefined,
  }
}

/** Format an ISO kickoff string into a user-friendly label. */
function formatKickoff(iso: string): string {
  try {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    if (sameDay(d, today)) return `Hoje · ${timeStr}`
    if (sameDay(d, tomorrow)) return `Amanhã · ${timeStr}`
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) + ` · ${timeStr}`
  } catch {
    return iso
  }
}

/** CTA button for the hero section based on match status. */
function HeroCTA({ match, onOpen }: { match: HomeMatch; onOpen: () => void }) {
  switch (match.status) {
    case 'live':
    case 'halftime':
      return (
        <button className="cta-block ghost" onClick={onOpen}>
          {Icon.Play} I'm Watching
        </button>
      )
    case 'finished':
      return (
        <button className="cta-block" onClick={onOpen}>
          Complete your memory
        </button>
      )
    case 'scheduled':
      return (
        <button className="cta-block cta-watch" onClick={onOpen}>
          Add to Watchlist
        </button>
      )
    default:
      return null
  }
}

/** Discreet source label — only show technical detail in DEV, never "Verified by TxLINE" for replay/snapshot. */
function SourceBadge({ source }: { source: string }) {
  if (!SHOW_STATE_SWITCHER) return null
  const label =
    source === 'txline' ? 'LIVE · TxLINE' :
    source === 'replay' ? 'Replay · TxLINE data' :
    source === 'snapshot' ? 'Snapshot · TxLINE data' : null
  if (!label) return null
  return (
    <span
      style={{
        display: 'block',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--ink-3)',
        marginTop: 4,
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </span>
  )
}

export default function Home() {
  const { openMatch, openWatchlist } = useNav()
  const { featured, upcoming, source, loading } = useHomeMatch()

  // Build a MatchData from the live HomeMatch if available
  const heroMatchData = featured ? homeMatchToMatchData(featured) : null

  const handleOpenHero = useCallback(() => {
    if (heroMatchData) openMatch(heroMatchData)
  }, [heroMatchData, openMatch])

  return (
    <div className="page">
      {/* SECTION 1 — Today's Chapter */}
      <section className="hero-first">
        <SectionHead label="Today's Chapter" />

        {loading && !featured ? (
          <div className="hero-cover">
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: '0.85rem' }}>
              Loading…
            </div>
          </div>
        ) : heroMatchData ? (
          <div className="hero-cover">
            <button className="cover-tap" onClick={handleOpenHero} aria-label="Open match detail">
              <SplitCover match={heroMatchData} size="hero" />
            </button>
            <div className="hero-bar">
              <HeroCTA match={featured!} onOpen={handleOpenHero} />
            </div>
            <SourceBadge source={source} />
          </div>
        ) : (
          <NoMatchHero />
        )}
      </section>

      {/* COMING UP — from live data when available */}
      {upcoming.length > 0 && (
        <section className="section coming-first">
          <div className="section-head">
            <span className="label">Coming up</span>
            <button className="more" onClick={openWatchlist}>
              See all →
            </button>
          </div>
          <div className="coming-rail">
            {upcoming.map((m) => {
              const md = homeMatchToMatchData(m)
              return (
                <div className="cu-card" key={m.id}>
                  <button className="cover-tap" onClick={() => openMatch(md)} aria-label="Open match">
                    <SplitCover match={md} size="card" />
                  </button>
                  <div className="cu-meta">
                    <span className="d">{formatKickoff(m.startsAt)}</span>
                  </div>
                </div>
              )
            })}
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
            <p className="otd-excerpt">"{onThisDay.excerpt}"</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Community moment */}
      <section className="section">
        <div className="section-head"><span className="label">Community moment</span><DemoTag /></div>
        <CommunityStory match={communityMoment.match} insight={communityMoment.insight} kicker="Tonight at Morumbi" />
      </section>
    </div>
  )
}

/* Edge state — no match today (and no data at all). */
function NoMatchHero() {
  return (
    <div className="hero-cover">
      <SplitCover match={{ ...onThisDay.match, status: 'From your archive' }} size="hero" />
      <div className="hero-bar">
        <button className="cta-block ghost">Revisit this memory</button>
      </div>
      <p className="caption" style={{ marginTop: 16, textAlign: 'center' }}>
        No match today — but this one, a year ago, is worth returning to.
      </p>
    </div>
  )
}
