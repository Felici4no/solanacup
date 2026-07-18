import { useEffect, useMemo, useRef, useState } from 'react'
import { LIVE_API } from '../live/client'
import { LivePanel } from '../live/LivePanel'
import {
  pulseMatch,
  pulseAnnotations,
  eventsInRange,
  sequenceStats,
  formatStats,
  findSequenceForMinute,
  stepImportant,
  clampMinute,
  resolveAnchor,
  anchorLabel,
  annotationsForAnchor,
  createAnnotation,
  promoteToMemory,
  densitySamples,
  densityAt,
  densityPhrase,
  defaultCursor,
  maxMinuteFor,
  majorEvents,
  focusedRange,
  shouldAskQuestion,
  castVote,
  INITIAL_VOTE,
  ordinal,
  eventLabel,
  type EventType,
  type Anchor,
  type PulseEvent,
  type TemporalAnnotation,
  type VoteState,
} from '../pulse'
import { competition, team } from '../assets'
import { StarRange, MiniStars, MOMENT_STAR_LABELS, labelFor } from '../StarRange'
import { OfficialMomentVideo } from '../OfficialMomentVideo'
import { matchBroadcast, eventVideoMarkers } from '../video'

const M = pulseMatch
const pct = (m: number) => (Math.min(95, Math.max(0, m)) / 95) * 100
const CONTEXT_TAGS = ['At the stadium', 'Watching abroad', 'Watched with family', 'First match at this stadium', 'Neutral supporter']

/* Shape-first event glyphs — distinguishable without relying on colour. */
function EventGlyph({ type }: { type: EventType }) {
  switch (type) {
    case 'goal':
      return (<svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /></svg>)
    case 'save':
      return (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l7 2.4v5c0 4.6-3 7.5-7 9-4-1.5-7-4.4-7-9v-5z" strokeLinejoin="round" /></svg>)
    case 'shot':
      return (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M10 6h8v8" /></svg>)
    case 'chance':
      return (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l9 9-9 9-9-9z" strokeLinejoin="round" /></svg>)
    case 'card':
      return (<svg viewBox="0 0 24 24" aria-hidden><rect x="8" y="3.5" width="8" height="17" rx="1.6" fill="#e2b23a" /></svg>)
    case 'sub':
      return (<svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5v14M9 19l-2.5-2.5M9 19l2.5-2.5M15 19V5M15 5l-2.5 2.5M15 5l2.5 2.5" /></svg>)
    case 'corner':
      return (<svg viewBox="0 0 24 24" aria-hidden><path d="M7 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M7.6 5h8l-3 3 3 3h-8z" fill="currentColor" /></svg>)
  }
}

function keyMinute(start: number, end: number): number {
  const evs = eventsInRange(M.events, start, end)
  const goal = [...evs].reverse().find((e) => e.type === 'goal')
  return (goal ?? evs[evs.length - 1] ?? { minute: end }).minute
}

type ActionId = 'react' | 'annotate' | 'community'

export default function MatchPulse() {
  const [mode, setMode] = useState<'live' | 'post'>('post')
  const [cursor, setCursor] = useState(() => defaultCursor('post', M.events))
  const [sequenceFocus, setSequenceFocus] = useState(false)
  const [annotations, setAnnotations] = useState<TemporalAnnotation[]>(pulseAnnotations)
  const [action, setAction] = useState<ActionId | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const scrubbing = useRef(false)

  const maxMin = maxMinuteFor(mode)
  const visibleEvents = useMemo(() => M.events.filter((e) => e.minute <= maxMin), [maxMin])
  const homeC = team(M.home).colors[0]
  const awayC = team(M.away).colors[0]

  const anchor = resolveAnchor(cursor, sequenceFocus, M.events, M.sequences)
  const eventAtCursor = M.events.find((e) => e.minute === cursor)
  const activeSeq = findSequenceForMinute(cursor, M.sequences)
  const focus = focusedRange(cursor, M.sequences, visibleEvents)
  const samples = useMemo(() => densitySamples(M.events, annotations), [annotations])
  const densVal = densityAt(samples, cursor)
  const anchorAnnos = annotationsForAnchor(annotations, anchor)

  function setCursorTo(m: number, seqFocus = false) {
    setCursor(clampMinute(m, 0, maxMin))
    setSequenceFocus(seqFocus)
    setAction(null)
  }
  function selectSequence(seqId: string) {
    const seq = M.sequences.find((s) => s.id === seqId)!
    setCursor(keyMinute(seq.start, seq.end))
    setSequenceFocus(true)
    setAction(null)
  }

  useEffect(() => {
    setCursor(defaultCursor(mode, M.events))
    setSequenceFocus(false)
    setAction(null)
  }, [mode])

  /* ---- pointer scrub ---- */
  function minuteFromX(clientX: number) {
    const el = canvasRef.current
    if (!el) return cursor
    const r = el.getBoundingClientRect()
    if (r.width <= 0) return cursor
    let m = Math.round(((clientX - r.left) / r.width) * 95)
    const near = M.events.reduce((b, e) => (Math.abs(e.minute - m) < Math.abs(b.minute - m) ? e : b))
    if (Math.abs(near.minute - m) <= 1.5 && near.minute <= maxMin) m = near.minute
    return clampMinute(m, 0, maxMin)
  }
  function onPointerDown(e: React.PointerEvent) {
    scrubbing.current = true
    canvasRef.current?.setPointerCapture(e.pointerId)
    setCursorTo(minuteFromX(e.clientX))
  }
  function onPointerMove(e: React.PointerEvent) {
    if (scrubbing.current) setCursorTo(minuteFromX(e.clientX))
  }
  function onPointerUp(e: React.PointerEvent) {
    scrubbing.current = false
    canvasRef.current?.releasePointerCapture?.(e.pointerId)
  }
  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': setCursorTo(stepImportant(visibleEvents, cursor, 1, maxMin)); break
      case 'ArrowLeft': case 'ArrowDown': setCursorTo(stepImportant(visibleEvents, cursor, -1, maxMin)); break
      case 'Home': setCursorTo(0); break
      case 'End': setCursorTo(maxMin); break
      case 'Enter': case ' ': if (activeSeq) selectSequence(activeSeq.id); break
      default: return
    }
    e.preventDefault()
  }

  const annoCount = anchorAnnos.length
  const valueText =
    (eventAtCursor ? eventLabel(eventAtCursor) : `${ordinal(cursor)} minute, no official event`) +
    (activeSeq ? `, inside ${activeSeq.name} sequence` : '') +
    `, ${annoCount} community ${annoCount === 1 ? 'annotation' : 'annotations'}`

  return (
    <div className="page">
      {/* Live World Cup data from the GAM3BOOK backend (TxLINE), when enabled. */}
      {LIVE_API && <LivePanel />}

      {/* demo-only mode switch */}
      <div className="statepeek" role="group" aria-label="Match mode">
        <span className="label">Mode</span>
        <div className="peek-pills">
          <button className="peek-pill" aria-pressed={mode === 'post'} onClick={() => setMode('post')}>Full time</button>
          <button className="peek-pill" aria-pressed={mode === 'live'} onClick={() => setMode('live')}>Live</button>
        </div>
      </div>

      {/* simplified header */}
      <div className="mp-head">
        <div className="mp-strip" style={{ background: `linear-gradient(90deg, ${homeC}, ${awayC})` }} />
        <div className="mp-teams">
          {team(M.home).name} <span className="sc num">{M.score}</span> {team(M.away).name}
        </div>
        <div className="mp-sub">
          <span>{competition(M.competition).label} · {M.stage}</span>
          {mode === 'live' ? (
            <span className="live"><span className="beat" aria-hidden />Live · {cursor}’</span>
          ) : (
            <span>Full time · {M.venue}</span>
          )}
        </div>
      </div>

      {/* Official broadcast clip for the selected moment — a layer above the
          Pulse. It only READS the cursor selection; taps on its moment list
          route back through setCursorTo, so selection stays single-source. */}
      {mode === 'post' && (
        <OfficialMomentVideo
          broadcast={matchBroadcast}
          markers={eventVideoMarkers}
          events={visibleEvents}
          selectedEventId={eventAtCursor?.id ?? null}
          selectedMinute={cursor}
          onSelectEvent={(m) => setCursorTo(m.gameMinute)}
        />
      )}

      <p className="mp-hint">Tap or drag through the match.</p>

      <div className="mp-cols">
        <div className="mp-left">
          {/* LEVEL 1 — overview */}
          <div
            ref={canvasRef}
            className="ov"
            role="slider"
            tabIndex={0}
            aria-label="Match timeline"
            aria-valuemin={0}
            aria-valuemax={maxMin}
            aria-valuenow={cursor}
            aria-valuetext={valueText}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            <svg className="ov-wave" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path className="area" d={areaPath(samples)} />
              <path className="line" d={linePath(samples)} />
            </svg>
            <span className="ov-ht" style={{ left: `${pct(45)}%` }} aria-hidden />
            {mode === 'post' &&
              M.sequences.map((s) => {
                const on = sequenceFocus && activeSeq?.id === s.id
                return (
                  <button
                    key={s.id}
                    className={`ov-band${on ? ' active' : ''}`}
                    style={{ left: `${pct(s.start)}%`, width: `${pct(s.end) - pct(s.start)}%` }}
                    aria-label={`Sequence ${s.name}, ${s.start} to ${s.end} minutes`}
                    aria-pressed={on}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => selectSequence(s.id)}
                  >
                    <span className="bl">{s.name}</span>
                  </button>
                )
              })}
            {majorEvents(visibleEvents).map((e) => {
              const on = cursor === e.minute && !sequenceFocus
              return (
                <button
                  key={e.id}
                  className={`ov-goal${e.decisive ? ' decisive' : ''}${on ? ' on' : ''}`}
                  style={{ left: `${pct(e.minute)}%` }}
                  aria-label={eventLabel(e)}
                  aria-pressed={on}
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={() => setCursorTo(e.minute)}
                >
                  <span className="dot"><EventGlyph type="goal" /></span>
                </button>
              )
            })}
            <span className="ov-cursor" style={{ left: `${pct(cursor)}%` }} aria-hidden>
              <span className="knob" />
              <span className="bub num">{cursor}’</span>
            </span>
            <span className="ov-axis e0">0’</span>
            <span className="ov-axis" style={{ left: `${pct(45)}%` }}>HT</span>
            <span className="ov-axis e90">90’+</span>
          </div>

          {/* prev / next important moment */}
          <div className="mp-nav">
            <button className="b" aria-label="Previous moment" onClick={() => setCursorTo(stepImportant(visibleEvents, cursor, -1, maxMin))}>‹</button>
            <span className="h">Move between moments</span>
            <button className="b" aria-label="Next moment" onClick={() => setCursorTo(stepImportant(visibleEvents, cursor, 1, maxMin))}>›</button>
          </div>

          {/* LEVEL 2 — focused range */}
          {focus && (
            <div className="focus" role="group" aria-label={`Focused range, ${focus.start} to ${focus.end} minutes`}>
              <div className="focus-head">
                <span className="fh-label">Focused</span>
                <span className="fh-range num">{focus.start}’–{focus.end}’ · {focus.label}</span>
              </div>
              <div className="focus-row">
                {eventsInRange(visibleEvents, focus.start, focus.end).map((e) => {
                  const on = cursor === e.minute && !sequenceFocus
                  return (
                    <button
                      key={e.id}
                      className={`focus-chip ${e.type}${on ? ' on' : ''}`}
                      aria-label={eventLabel(e)}
                      aria-pressed={on}
                      onClick={() => setCursorTo(e.minute)}
                    >
                      <span className="fc-min">{e.minute}’</span>
                      <EventGlyph type={e.type} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* selected-moment summary + progressive actions (sheet / side panel) */}
        <div className="mp-right">
          <div className="sheet">
            <div className="sheet-head">
              <span className="sheet-min num">{sequenceFocus && activeSeq ? `${activeSeq.start}’` : `${cursor}’`}</span>
              <span className="sheet-kind">
                <span className="k-a">{anchor.type === 'sequence' ? 'Sequence' : anchor.type === 'event' ? 'Event' : 'Minute'}</span>
                <span className="k-v">{anchorLabel(anchor)}</span>
              </span>
            </div>

            {anchor.type === 'event' && activeSeq && !sequenceFocus && (
              <button className="sheet-inside" onClick={() => selectSequence(activeSeq.id)}>
                Inside {activeSeq.name} · {activeSeq.start}’–{activeSeq.end}’ →
              </button>
            )}
            {anchor.type === 'sequence' && (
              <p className="sheet-inside" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {formatStats(sequenceStats(eventsInRange(visibleEvents, anchor.minute, anchor.endMinute))).map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </p>
            )}
            {anchor.type === 'time' && <p className="sheet-inside" style={{ color: 'var(--ink-3)' }}>No official event here</p>}

            <p className="sheet-density">This was {densityPhrase(densVal)}.</p>

            {/* actions */}
            {mode === 'post' ? (
              <div className="act-tabs" role="group" aria-label="Actions">
                {(['react', 'annotate', 'community'] as ActionId[]).map((a) => (
                  <button key={a} className="act-tab" aria-expanded={action === a}
                    onClick={() => setAction(action === a ? null : a)}>
                    {a === 'react' ? 'React' : a === 'annotate' ? 'Annotate' : 'Community'}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="act-tabs">
                  <button className="act-tab" aria-expanded={action === 'react'} onClick={() => setAction(action === 'react' ? null : 'react')}>React</button>
                </div>
                <button className="act-primary" onClick={() => setAction('annotate')}>Add a moment at {cursor}’</button>
              </>
            )}

            {action === 'react' && (
              <div className="act-panel">
                {shouldAskQuestion(anchor) && (
                  <VoteBlock key={anchorLabel(anchor)} anchor={anchor} />
                )}
                <div style={{ marginTop: shouldAskQuestion(anchor) ? 24 : 0 }}>
                  <ImpactBlock key={`imp-${cursor}-${sequenceFocus}`} community={(eventAtCursor ?? M.events.find((e) => e.minute === cursor) ?? nearestForImpact(cursor)).impact} />
                </div>
              </div>
            )}

            {action === 'annotate' && (
              <div className="act-panel">
                <Composer
                  anchor={anchor}
                  live={mode === 'live'}
                  onSave={(text, tags, share) => {
                    const a = createAnnotation({
                      anchorType: anchor.type, minute: anchor.minute,
                      endMinute: anchor.type === 'sequence' ? anchor.endMinute : undefined,
                      eventId: anchor.type === 'event' ? anchor.eventId : undefined,
                      sequenceId: anchor.type === 'sequence' ? anchor.sequenceId : undefined,
                      text, contextTags: tags, mine: true, fromLive: mode === 'live',
                      visibility: share ? 'community' : 'private',
                    })
                    setAnnotations((prev) => [...prev, a])
                    setAction('community')
                  }}
                />
              </div>
            )}

            {action === 'community' && (
              <div className="act-panel">
                <div className="comm-summary">
                  <span className="k" aria-hidden>◍</span>
                  <span className="v">This passage was <b>{densityPhrase(densVal)}</b>.</span>
                </div>
                {anchorAnnos.length === 0 ? (
                  <p className="caption">No annotations here yet — be the first to remember it.</p>
                ) : (
                  anchorAnnos.map((a) => (
                    <NoteItem key={a.id} a={a} postMatch={mode === 'post'}
                      onPromote={() => setAnnotations((prev) => prev.map((x) => (x.id === a.id ? promoteToMemory(x) : x)))} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function nearestForImpact(minute: number): PulseEvent {
  return M.events.reduce((b, e) => (Math.abs(e.minute - minute) < Math.abs(b.minute - minute) ? e : b))
}

/* ---- one-tap contextual question, result hidden until answered ---- */
function VoteBlock({ anchor }: { anchor: Anchor }) {
  const question = anchor.type === 'event' ? anchor.event.question : anchor.type === 'sequence' ? anchor.sequence.question : null
  const [vote, setVote] = useState<VoteState>(INITIAL_VOTE)
  if (!question) return null
  const choose = (c: 'yes' | 'no' | 'unsure') => setVote((v) => castVote(v, c))
  return (
    <div className="vote">
      <h3 className="v-q">{question.text}</h3>
      <div className="v-opts">
        {(['yes', 'no', 'unsure'] as const).map((c) => (
          <button key={c} className={`v-opt${vote.choice === c ? ' chosen' : ''}`} onClick={() => choose(c)}>
            {c === 'yes' ? 'Yes' : c === 'no' ? 'No' : 'Not sure'}
          </button>
        ))}
      </div>
      {vote.revealed ? (
        <div className="v-result">
          <div className="v-bar"><span style={{ width: `${question.agreePct}%` }} /></div>
          <p className="v-agg"><b>{question.agreePct}%</b> of {question.votes.toLocaleString()} people agreed.</p>
        </div>
      ) : (
        <p className="v-hint">The result stays hidden until you answer.</p>
      )}
    </div>
  )
}

/* ---- personal moment impact (StarRange) ---- */
function ImpactBlock({ community }: { community: number }) {
  const [value, setValue] = useState<number | null>(null)
  return (
    <div className="impact">
      <h3 className="i-q">How much did this moment affect you?</h3>
      <div style={{ marginTop: 16 }}>
        <StarRange value={value} onChange={setValue} labels={MOMENT_STAR_LABELS} ariaLabel="Moment impact" />
      </div>
      {value != null && (
        <div className="reveal">
          <div className="col">
            <span className="k">Your impact</span>
            <div className="ministars"><MiniStars value={value} /></div>
            <span className="rv-num num">{value.toFixed(1)}</span>
          </div>
          <div className="col community">
            <span className="k">Community</span>
            <div className="ministars c"><MiniStars value={community} community /></div>
            <span className="rv-num num">{community.toFixed(1)}</span>
          </div>
          <p className="based">You felt it {labelFor(value, MOMENT_STAR_LABELS)}.</p>
        </div>
      )}
    </div>
  )
}

/* ---- inline temporal annotation composer ---- */
function Composer({ anchor, live, onSave }: { anchor: Anchor; live: boolean; onSave: (t: string, tags: string[], share: boolean) => void }) {
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [share, setShare] = useState(false)
  const toggle = (t: string) => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  return (
    <div className="tcomposer">
      <p className="tco-anchor">Comment on <b>{anchorLabel(anchor)}</b></p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 280))}
        placeholder={live ? 'A quick note — you can refine it later…' : 'What do you want to remember about this moment?'}
        rows={live ? 2 : 3}
      />
      <div className="emotions" style={{ marginTop: 6 }}>
        {CONTEXT_TAGS.slice(0, live ? 3 : 5).map((t) => (
          <button key={t} className="emotion-chip" aria-pressed={tags.includes(t)} onClick={() => toggle(t)}>{t}</button>
        ))}
      </div>
      <div className="tco-share">
        <button className="share-toggle" aria-pressed={share} onClick={() => setShare(!share)}>
          <span className="sw" aria-hidden><i /></span>
          {share ? 'Sharing with the match community' : 'Private to your memory'}
        </button>
        <div className="tco-actions">
          <button className="post" disabled={!text.trim()} onClick={() => onSave(text.trim(), tags, share)}>Save</button>
        </div>
      </div>
    </div>
  )
}

/* ---- simplified annotation note (secondary controls in overflow) ---- */
function NoteItem({ a, postMatch, onPromote }: { a: TemporalAnnotation; postMatch: boolean; onPromote: () => void }) {
  const [menu, setMenu] = useState(false)
  const label = a.anchorType === 'sequence' ? `${a.minute}’–${a.endMinute}’` : `${a.minute}’`
  const canPromote = postMatch && a.mine && a.fromLive && !a.keptInMemory
  return (
    <div className="note">
      <button className="note-more" aria-label="More actions" onClick={() => setMenu(!menu)}>⋯</button>
      {menu && (
        <div className="note-menu" role="menu">
          <button role="menuitem">Reply</button>
          <button role="menuitem">Report</button>
        </div>
      )}
      <span className="note-anchor">{label}{a.anchorType === 'event' ? ' · Event' : a.anchorType === 'sequence' ? ' · Sequence' : ''}</span>
      <p className="note-text">“{a.text}”</p>
      <div className="note-by">
        <span className="who">{a.author}</span>
        {a.contextTags[0] && <span className="tag">{a.contextTags[0]}</span>}
        {a.mine && <span className="vis">{a.visibility === 'private' ? 'Private' : 'Shared'}</span>}
      </div>
      {a.keptInMemory && <p className="note-kept">✓ Kept in your memory</p>}
      {canPromote && (
        <div className="note-promote">
          <span className="q">Keep this annotation in your memory?</span>
          <button onClick={() => setMenu(false)}>Not now</button>
          <button className="keep" onClick={onPromote}>Keep</button>
        </div>
      )}
    </div>
  )
}

/* ---- density waveform paths (viewBox 0 0 100 100) ---- */
function linePath(samples: { minute: number; value: number }[]) {
  return samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${((s.minute / 95) * 100).toFixed(2)} ${(100 - s.value * 74 - 12).toFixed(2)}`).join(' ')
}
function areaPath(samples: { minute: number; value: number }[]) {
  return `${linePath(samples)} L100 100 L0 100 Z`
}
