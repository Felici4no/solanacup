import { MatchCover, type MatchData } from '../MatchCover'
import { competition, team } from '../assets'
import { useNav } from '../nav'
import { useWatchlist, matchId } from '../watchlist'
import { Button } from '../Button'
import { Icon } from '../ui'

/* /watchlist/:matchId — manage a single saved match. */
export default function WatchlistMatch({ match }: { match: MatchData }) {
  const { openMatch, back } = useNav()
  const wl = useWatchlist()
  const id = matchId(match)
  const saved = wl.isSaved(id)
  const reminder = wl.reminderOn(id)
  const h = team(match.home)
  const a = team(match.away)
  const comp = competition(match.competition)

  return (
    <div className="page">
      <div className="wl-intro">
        <h1 className="title" style={{ fontSize: '1.5rem' }}>
          {h.name} vs {a.name}
        </h1>
        <p className="body" style={{ marginTop: 6 }}>
          {comp.label}
          {match.stage ? ` · ${match.stage}` : ''}
        </p>
      </div>

      <button className="cover-tap" onClick={() => openMatch(match)} aria-label="Open match" style={{ display: 'block', marginBottom: 20 }}>
        <MatchCover match={match} format="landscape" />
      </button>

      {saved ? (
        <>
          <p className="nr-sub" style={{ marginBottom: 16 }}>
            <span className="nr-ic">{Icon.Check}</span>
            Saved to Watchlist{reminder ? ' · Reminder on' : ' · Reminder off'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="primary" size="lg" block onClick={() => openMatch(match)}>
              Open match
            </Button>
            <Button
              variant="secondary"
              size="md"
              block
              aria-pressed={reminder}
              iconStart={reminder ? Icon.Bell : Icon.BellOff}
              onClick={() => wl.toggleReminder(id)}
            >
              {reminder ? 'Turn Reminder Off' : 'Turn Reminder On'}
            </Button>
            <Button variant="destructive" size="md" block onClick={() => wl.remove(id)}>
              Remove from Watchlist
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="wl-promo" style={{ marginBottom: 16 }}>
            <span className="wp-title">Add this match to your Watchlist</span>
            <span className="wp-sub">Plan to watch it and receive a reminder.</span>
          </div>
          <Button variant="primary" size="lg" block onClick={() => wl.add(id)}>
            Add to Watchlist
          </Button>
          <div style={{ marginTop: 10 }}>
            <Button variant="text" size="md" onClick={back}>
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
