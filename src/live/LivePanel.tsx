import { useEffect, useMemo, useRef, useState } from 'react'
import { DEMO_WALLET, live, type Health, type LiveEvent, type LiveFixture } from './client'
import { TOKEN_SYMBOL } from '../brand'

/* ============================================================
   Live from TxLINE — the backend connection made visible inside
   GAM3BOOK. Shows the live World Cup fixture, a ticking score, events
   streaming in, and the "I'm Watching → earn G3B" fan loop.
   Rendered only when VITE_LIVE_API is set.
   ============================================================ */

const TYPE_LABEL: Record<LiveEvent['type'], string> = {
  goal: 'Goal',
  penalty: 'Penalty',
  red_card: 'Red card',
  yellow_card: 'Yellow card',
  corner: 'Corner',
  var: 'VAR',
  state: 'Phase',
  other: 'Chance',
}

export function LivePanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [fixture, setFixture] = useState<LiveFixture | null>(null)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [checkin, setCheckin] = useState<{ status: 'idle' | 'pending' | 'ok' | 'err'; msg?: string }>({ status: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Single source of truth: fold the deduped event list.
  const score = useMemo(() => {
    const s = { home: 0, away: 0 }
    for (const e of events) if ((e.type === 'goal' || e.type === 'penalty') && e.team) s[e.team]++
    return s
  }, [events])
  const live_ = events.length > 0 && events[events.length - 1].gameState !== 'END'

  useEffect(() => {
    let stop: (() => void) | undefined
    ;(async () => {
      try {
        const [h, fixtures] = await Promise.all([live.health(), live.fixtures()])
        setHealth(h)
        const f = fixtures[0]
        if (!f) return
        setFixture(f)
        const state = await live.matchState(f.fixtureId)
        setEvents(state.events)
        live.balance(DEMO_WALLET).then((b) => setBalance(b.balance)).catch(() => {})
        stop = live.stream(f.fixtureId, (e) => {
          setEvents((prev) => (prev.some((p) => p.seq === e.seq) ? prev : [...prev, e].sort((a, b) => a.seq - b.seq)))
        })
      } catch (err) {
        setError((err as Error).message)
      }
    })()
    return () => stop?.()
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [events])

  async function doCheckin() {
    if (!fixture) return
    setCheckin({ status: 'pending' })
    try {
      const r = await live.checkin(DEMO_WALLET, fixture.fixtureId)
      if (r.ok) {
        setCheckin({ status: 'ok', msg: `+${r.reward} ${TOKEN_SYMBOL}` })
        const b = await live.balance(DEMO_WALLET)
        setBalance(b.balance)
      } else {
        setCheckin({ status: 'err', msg: r.code === 'not_live' ? 'Match not live' : r.code === 'already_checked_in' ? 'Already checked in' : r.code ?? 'Failed' })
      }
    } catch {
      setCheckin({ status: 'err', msg: 'Backend unreachable' })
    }
  }

  if (error) {
    return (
      <div className="live-panel live-off">
        <span className="live-dot off" /> Live backend offline — {error}
      </div>
    )
  }
  if (!fixture) return <div className="live-panel live-off"><span className="live-dot off" /> Connecting to TxLINE…</div>

  return (
    <div className="live-panel">
      <div className="live-head">
        <span className="live-tag">
          <span className={`live-dot${live_ ? ' on' : ''}`} />
          {live_ ? 'LIVE' : 'FULL TIME'} · TxLINE
        </span>
        <span className="live-src">
          {health?.dataSource === 'replay' ? 'replay' : 'live'} · {health?.network}
        </span>
      </div>

      <div className="live-score">
        <span className="lt">{fixture.home}</span>
        <span className="ls num">{score.home} — {score.away}</span>
        <span className="lt">{fixture.away}</span>
      </div>
      <div className="live-comp">{fixture.competition}</div>

      <div className="live-events" ref={listRef}>
        {events.map((e) => (
          <div className={`live-ev${e.type === 'goal' || e.type === 'penalty' ? ' goal' : ''}`} key={e.seq}>
            <span className="lev-min num">{e.minute ?? '·'}′</span>
            <span className="lev-type">{TYPE_LABEL[e.type]}</span>
            {e.team && <span className="lev-team">{e.team === 'home' ? fixture.home : fixture.away}</span>}
          </div>
        ))}
      </div>

      <div className="live-fan">
        <button className="live-checkin" disabled={checkin.status === 'pending' || !live_} onClick={doCheckin}>
          {checkin.status === 'pending' ? 'Checking in…' : `I’m Watching → earn ${TOKEN_SYMBOL}`}
        </button>
        <span className="live-balance">
          {checkin.status === 'ok' && <b className="live-reward">{checkin.msg}</b>}
          {checkin.status === 'err' && <span className="live-err">{checkin.msg}</span>}
          {balance != null && <span className="live-bal num">{balance} {TOKEN_SYMBOL}{health?.tokenSimulated ? ' (sim)' : ''}</span>}
        </span>
      </div>
    </div>
  )
}
