import { watchlist, type WatchMatch } from '../data'
import { MatchCover } from '../MatchCover'
import { competition, team } from '../assets'
import { useNav } from '../nav'
import { useWatchlist, matchId } from '../watchlist'
import { useAction } from '../repository'
import { Button } from '../Button'
import { Icon, ActionError } from '../ui'

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
  const { openMatch, openWatchlistMatch } = useNav()
  const wl = useWatchlist()
  const id = matchId(w.match)
  const reminder = wl.reminderOn(id)
  const watching = wl.isWatching(id)
  const watch = useAction(() => wl.setWatching(id, !watching))
  const rem = useAction(() => wl.toggleReminder(id))
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
            <Button variant="primary" size="sm" onClick={() => openMatch(w.match)}>
              Write the memory
            </Button>
          ) : (
            <>
              <Button
                variant={watching ? 'secondary' : 'primary'}
                size="sm"
                iconStart={watching ? Icon.Check : undefined}
                aria-pressed={watching}
                loading={watch.pending}
                onClick={() => watch.run()}
              >
                {watching ? 'Watching' : 'I’m Watching'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={reminder}
                loading={rem.pending}
                iconStart={reminder ? Icon.Bell : Icon.BellOff}
                onClick={() => rem.run()}
              >
                {reminder ? 'Reminder on' : 'Reminder off'}
              </Button>
              <Button variant="text" size="sm" iconEnd={Icon.Chevron} onClick={() => openWatchlistMatch(w.match)}>
                Manage
              </Button>
            </>
          )}
        </div>
        {watch.failed && <ActionError message="Couldn’t update this match." onRetry={watch.retry} />}
        {rem.failed && (
          <ActionError
            message={`Couldn’t update the reminder. It is still ${reminder ? 'on' : 'off'}.`}
            onRetry={rem.retry}
          />
        )}
      </div>
    </div>
  )
}
