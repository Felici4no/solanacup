import { useState } from 'react'
import { watchlist, type WatchMatch } from '../data'
import { MatchCover } from '../MatchCover'
import { competition, team } from '../assets'
import { useNav } from '../nav'

const GROUPS: { key: keyof typeof watchlist; title: string }[] = [
  { key: 'today', title: 'Today' },
  { key: 'week', title: 'This week' },
  { key: 'later', title: 'Later' },
  { key: 'pastUnregistered', title: 'Not yet registered' },
]

export default function Watchlist() {
  return (
    <div className="page">
      <div className="wl-intro">
        <h1 className="title">Upcoming chapters.</h1>
        <p className="body" style={{ marginTop: 8 }}>
          The matches you intend to live next — a personal program, not a fixture list.
        </p>
      </div>

      {GROUPS.map(({ key, title }) => {
        const items = watchlist[key]
        if (!items.length) return null
        return (
          <section className="wl-group" key={key}>
            <div className="wl-group-title">
              <span className="label">{title}</span>
              <span className="n num">{items.length}</span>
            </div>
            {items.map((w, i) => (
              <WatchItem key={i} w={w} past={key === 'pastUnregistered'} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function WatchItem({ w, past }: { w: WatchMatch; past?: boolean }) {
  const { openMatch } = useNav()
  const [reminder, setReminder] = useState(true)
  const h = team(w.match.home)
  const a = team(w.match.away)
  const comp = competition(w.match.competition)

  return (
    <div className="watch-item">
      <button className="wi-cover cover-tap" onClick={() => openMatch(w.match)} aria-label={`Open ${h.name} vs ${a.name}`}>
        <MatchCover match={w.match} format="thumb" />
      </button>
      <div className="wi-body">
        <h3 className="wi-teams">
          {h.name} <span className="vs">vs</span> {a.name}
        </h3>
        <div className="wi-meta">
          <span>{comp.label}</span>
          <span className="num">{w.date}</span>
          {w.venue && <span>{w.venue}</span>}
          {w.broadcast && <span className="broadcast">{w.broadcast}</span>}
        </div>
        {w.note && <p className="caption" style={{ color: 'var(--ink-2)' }}>{w.note}</p>}
        {w.friends && (
          <span className="wi-friends">
            <span className="dots">
              {w.friends.map((f, i) => (
                <i key={i} style={{ background: f.color }}>{f.mono}</i>
              ))}
            </span>
            {w.friends.length} people you follow also plan to watch
          </span>
        )}
        <div className="wi-actions">
          {past ? (
            <button className="wi-btn primary" onClick={() => openMatch(w.match)}>Write the memory</button>
          ) : (
            <>
              <button className="wi-btn primary">I’m Watching</button>
              <button className="wi-btn" aria-pressed={reminder} onClick={() => setReminder(!reminder)}>
                {reminder ? '◉ Reminder on' : '○ Reminder'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
