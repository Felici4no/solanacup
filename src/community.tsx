import { useState } from 'react'
import {
  StarRange,
  MiniStars,
  labelFor,
  MATCH_STAR_LABELS,
  MOMENT_STAR_LABELS,
} from './StarRange'

/* ============================================================
   Community layer — ratings, pulse, moments and anchored comments.
   Personal meaning first; official data is context elsewhere.
   ============================================================ */

export const MATCH_LABELS = MATCH_STAR_LABELS
export const MOMENT_LABELS = MOMENT_STAR_LABELS
export const EMOTIONS = [
  'I exploded',
  'I froze',
  'I couldn’t believe it',
  'It hurt',
  'I laughed',
  'I’ll never forget it',
]

/* ---- Match rating: draggable StarRange; reveal community only AFTER rating ---- */
export function MatchRating({
  question = 'How was this match for you?',
  labels = MATCH_LABELS,
  communityAvg,
  communityCount,
  ariaLabel = 'Match rating',
}: {
  question?: string
  labels?: string[]
  communityAvg: number
  communityCount: number
  ariaLabel?: string
}) {
  const [value, setValue] = useState<number | null>(null)

  return (
    <div className="rate">
      <h3 className="rate-q">{question}</h3>
      <div style={{ marginTop: 20 }}>
        <StarRange value={value} onChange={setValue} labels={labels} ariaLabel={ariaLabel} />
      </div>

      {value == null ? (
        <p className="md-note" style={{ marginTop: 16, marginBottom: 0 }}>
          The community average will be revealed after you rate.
        </p>
      ) : (
        <RatingReveal value={value} labels={labels} communityAvg={communityAvg} communityCount={communityCount} />
      )}
    </div>
  )
}

export function RatingReveal({
  value,
  labels,
  communityAvg,
  communityCount,
}: {
  value: number
  labels: string[]
  communityAvg: number
  communityCount: number
}) {
  return (
    <div className="reveal">
      <div className="col">
        <span className="k">Your rating</span>
        <div className="ministars"><MiniStars value={value} /></div>
        <span className="rv-num num">{value.toFixed(1)}</span>
      </div>
      <div className="col community">
        <span className="k">Community</span>
        <div className="ministars c"><MiniStars value={communityAvg} community /></div>
        <span className="rv-num num">{communityAvg.toFixed(1)}</span>
      </div>
      <p className="based">
        Based on {communityCount.toLocaleString()} memories · you rated it {labelFor(value, labels)}
      </p>
    </div>
  )
}

export function EmotionPicker({ prompt = 'Add one reaction' }: { prompt?: string }) {
  const [sel, setSel] = useState<string | null>(null)
  return (
    <div style={{ marginTop: 24 }}>
      <span className="label">{prompt}</span>
      <div className="emotions">
        {EMOTIONS.map((e) => (
          <button key={e} className="emotion-chip" aria-pressed={sel === e} onClick={() => setSel(sel === e ? null : e)}>
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---- Community pulse ---- */
export type Pulse = {
  avg: number
  memories: number
  firstTimers: number
  stadium: string
  topReaction: string
  topMoment: string
  familyPct: number
  editorial: string
}
export function CommunityPulse({ pulse: p }: { pulse: Pulse }) {
  return (
    <div className="pulse">
      <div className="pulse-head">
        <span className="label">Community pulse</span>
      </div>
      <div className="pulse-avg">
        <span className="big num">{p.avg.toFixed(1)}</span>
        <span className="of">average from {p.memories.toLocaleString()} memories</span>
      </div>
      <div className="pulse-list">
        <PulseRow icon="◷" v={<><b>{p.topMoment}</b> became the most remembered moment.</>} />
        <PulseRow icon="⌾" v={<><b>{p.firstTimers.toLocaleString()}</b> people entered {p.stadium} for the first time.</>} />
        <PulseRow icon="❝" v={<>“{p.topReaction}” was the most selected reaction.</>} />
        <PulseRow icon="⌂" v={<><b>{p.familyPct}%</b> watched with family.</>} />
      </div>
      <p className="pulse-editorial">{p.editorial}</p>
    </div>
  )
}
function PulseRow({ icon, v }: { icon: string; v: React.ReactNode }) {
  return (
    <div className="pulse-row">
      <span className="k" aria-hidden>{icon}</span>
      <span className="v">{v}</span>
    </div>
  )
}

/* ---- Moments timeline ---- */
export type Moment = {
  min: string
  type: string
  player: string
  impact: number
  reaction: string
  favorites: number
  notes: { mono: string; txt: string }[]
  key?: boolean
}
export function MomentTimeline({ moments }: { moments: Moment[] }) {
  return (
    <div className="moment-tl">
      {moments.map((m) => (
        <MomentItem key={m.min + m.type} moment={m} />
      ))}
    </div>
  )
}
export function MomentItem({ moment: m }: { moment: Moment }) {
  const [rated, setRated] = useState<number | null>(null)
  return (
    <div className={`moment${m.key ? ' key' : ''}`}>
      <span className="m-min num">{m.min}</span>
      <div className="m-card">
        <div className="m-head">
          <span className="m-type">
            <span className="t">{m.type}</span>
            <span className="p">· {m.player}</span>
          </span>
          <span className="m-impact">
            <span className="n num">{m.impact.toFixed(1)}</span> impact
          </span>
        </div>
        <p className="m-reaction">Most selected · {m.reaction}</p>
        <p className="m-fav">
          <b className="num">{m.favorites.toLocaleString()}</b> people marked this as their favorite moment.
        </p>
        {m.notes.length > 0 && (
          <div className="m-notes">
            {m.notes.map((n, i) => (
              <div className="m-note" key={i}>
                <span className="mono">{n.mono}</span>
                <span className="txt">“{n.txt}”</span>
              </div>
            ))}
          </div>
        )}
        <div className="m-actions" style={{ display: 'block' }}>
          {rated == null ? (
            <MomentRate onRate={setRated} />
          ) : (
            <span className="m-fav" style={{ marginTop: 0 }}>
              You marked this <b>{labelFor(rated, MOMENT_LABELS)}</b> · {rated.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* Moment-impact rater — same StarRange, different meaning: how much it AFFECTED you. */
function MomentRate({ onRate }: { onRate: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState<number | null>(null)
  if (!open) {
    return (
      <button className="m-rate-btn" onClick={() => setOpen(true)}>
        How much did this moment affect you?
      </button>
    )
  }
  return (
    <div>
      <p className="mi-q">How much did this moment affect you?</p>
      <StarRange
        value={v}
        onChange={(nv) => {
          setV(nv)
          if (nv != null) onRate(nv)
        }}
        labels={MOMENT_LABELS}
        ariaLabel="Moment impact"
      />
    </div>
  )
}

/* ============================================================
   Inline complete-memory editor — progressive disclosure, no route.
   ============================================================ */
export type SavedMemory = {
  rating: number
  moment?: { min: string; type: string; player: string }
  momentImpact?: number
  note: string
  place?: string
  company?: string
}

const PLACES = ['At the stadium', 'At home', 'At a bar', 'At someone’s place', 'Somewhere else']
const COMPANY = ['Alone', 'Family', 'Friends', 'Partner', 'Add someone']

export function CompleteMemoryEditor({
  moments,
  onSave,
}: {
  moments: { min: string; type: string; player: string }[]
  onSave: (m: SavedMemory) => void
}) {
  const [rating, setRating] = useState<number | null>(null)
  const [momentIdx, setMomentIdx] = useState<number | null>(null)
  const [momentImpact, setMomentImpact] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [place, setPlace] = useState<string | null>(null)
  const [company, setCompany] = useState<string | null>(null)

  const revealed = rating != null

  return (
    <div className="editor">
      <h3 className="editor-q">How was this match for you?</h3>
      <div style={{ marginTop: 18 }}>
        <StarRange value={rating} onChange={setRating} labels={MATCH_LABELS} ariaLabel="Match rating" />
      </div>

      {revealed && (
        <>
          <div className="editor-step">
            <span className="label">What stayed with you?</span>
            <div className="moment-chips">
              {moments.map((m, i) => (
                <button
                  key={m.min + m.type}
                  className="moment-chip"
                  aria-pressed={momentIdx === i}
                  onClick={() => setMomentIdx(momentIdx === i ? null : i)}
                >
                  <span className="mc-min num">{m.min}</span>
                  <span className="mc-body">
                    <span className="t">{m.type}</span> <span className="p">· {m.player}</span>
                  </span>
                </button>
              ))}
            </div>
            {momentIdx != null && (
              <div className="moment-impact">
                <p className="mi-q">How much did this moment affect you?</p>
                <StarRange
                  value={momentImpact}
                  onChange={setMomentImpact}
                  labels={MOMENT_LABELS}
                  ariaLabel="Moment impact"
                />
              </div>
            )}
          </div>

          <div className="editor-step">
            <span className="label">Add a note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 280))}
              placeholder="What do you want to remember about this match?"
              rows={3}
            />
            <p className="editor-hint">It can be one sentence. Private by default.</p>
            {note.length > 240 && <p className="editor-count num">{280 - note.length} left</p>}
          </div>

          <div className="editor-step">
            <span className="label">Where did you watch?</span>
            <div className="seg-chips">
              {PLACES.map((p) => (
                <button key={p} className="seg-chip" aria-pressed={place === p} onClick={() => setPlace(place === p ? null : p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-step">
            <span className="label">Who were you with?</span>
            <div className="seg-chips">
              {COMPANY.map((c) => (
                <button key={c} className="seg-chip" aria-pressed={company === c} onClick={() => setCompany(company === c ? null : c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-save">
            <button
              className="cta-block"
              disabled={rating == null}
              onClick={() =>
                onSave({
                  rating: rating!,
                  moment: momentIdx != null ? moments[momentIdx] : undefined,
                  momentImpact: momentImpact ?? undefined,
                  note: note.trim(),
                  place: place ?? undefined,
                  company: company ?? undefined,
                })
              }
            >
              Save Memory
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function CompletedMemory({
  memory: m,
  cover,
  onEdit,
}: {
  memory: SavedMemory
  cover: React.ReactNode
  onEdit: () => void
}) {
  return (
    <div className="completed">
      {cover}
      <div className="cm-body">
        <div className="cm-rating">
          <span className="ministars"><MiniStars value={m.rating} /></span>
          <span className="cm-num num">{m.rating.toFixed(1)}</span>
        </div>
        <div className="cm-label">{labelFor(m.rating, MATCH_LABELS)}</div>

        <div className="cm-grid">
          {m.moment && (
            <div className="cm-field">
              <span className="l">Favorite moment</span>
              <span className="v">{m.moment.min} · {m.moment.type} — {m.moment.player}</span>
            </div>
          )}
          {m.place && (
            <div className="cm-field">
              <span className="l">Where</span>
              <span className="v">{m.place}</span>
            </div>
          )}
          {m.company && (
            <div className="cm-field">
              <span className="l">With</span>
              <span className="v">{m.company}</span>
            </div>
          )}
          {m.momentImpact != null && (
            <div className="cm-field">
              <span className="l">Moment impact</span>
              <span className="v">{labelFor(m.momentImpact, MOMENT_LABELS)}</span>
            </div>
          )}
        </div>

        {m.note && <p className="cm-note">“{m.note}”</p>}

        <div className="cm-foot">
          <span className="caption">Preserved on Vez · private</span>
          <button className="cm-edit" onClick={onEdit}>
            Edit Memory
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- Anchored comments ---- */
export type Annotation = {
  anchor: string
  name: string
  mono: string
  text: string
  tag?: string
}
export function CommunityAnnotation({ a }: { a: Annotation }) {
  return (
    <div className="annotation">
      <span className="an-mono">{a.mono}</span>
      <div className="an-body">
        <div className="an-head">
          <span className="an-name">{a.name}</span>
          <span className="an-anchor">on {a.anchor}</span>
        </div>
        <p className="an-text">{a.text}</p>
        {a.tag && <ContextTag label={a.tag} />}
        <div className="an-react">
          <button>◇ Relate</button>
          <button>❝ Reply</button>
          <button aria-label="Report comment">⚑ Report</button>
        </div>
      </div>
    </div>
  )
}
export function ContextTag({ label }: { label: string }) {
  return <span className="ctx-tag">◈ {label}</span>
}

export const CONTEXT_TAGS = [
  'At the stadium',
  'Watched with family',
  'First Libertadores match',
  'Neutral supporter',
  'Away supporter',
  'Watching abroad',
]

export function CommentComposer({ anchor }: { anchor: string }) {
  const [text, setText] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  return (
    <div className="composer">
      <p className="composer-prompt">
        Comment on <b>{anchor}</b>
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share what this moment meant to you…"
        rows={2}
      />
      <div className="emotions" style={{ marginTop: 8 }}>
        {CONTEXT_TAGS.slice(0, 4).map((t) => (
          <button key={t} className="emotion-chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="composer-row">
        <span className="caption">Private by default · you choose to share</span>
        <button className="post" disabled={!text.trim()}>
          Post
        </button>
      </div>
    </div>
  )
}
