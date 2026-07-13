import { useState } from 'react'
import { matchDetail as D } from '../data'
import { MatchCover, type MatchData } from '../MatchCover'
import { StadiumVisual } from '../visuals'
import { Crest, team } from '../assets'
import {
  MatchRating,
  CommunityPulse,
  MomentTimeline,
  CommunityAnnotation,
  CommentComposer,
  CompleteMemoryEditor,
  CompletedMemory,
  type SavedMemory,
} from '../community'

type Phase = 'pre' | 'live' | 'post'
type Tab = 'story' | 'moments' | 'match'

const PHASES: { id: Phase; label: string }[] = [
  { id: 'pre', label: 'Pre-match' },
  { id: 'live', label: 'Live' },
  { id: 'post', label: 'Full time' },
]

export default function MatchDetail({ match }: { match: MatchData }) {
  const [phase, setPhase] = useState<Phase>('pre')
  const [tab, setTab] = useState<Tab>('story')
  const [anchor, setAnchor] = useState(D.anchors[0])
  const [editing, setEditing] = useState(false)
  const [memory, setMemory] = useState<SavedMemory | null>(null)

  const heroMatch: MatchData = {
    ...match,
    stage: match.stage ?? D.base.stage,
    venue: match.venue ?? D.base.venue,
    status: phase === 'live' ? 'You’re watching' : phase === 'post' ? 'Ended' : 'Tonight',
    kickoff: phase === 'live' ? D.minute : phase === 'post' ? undefined : match.kickoff ?? D.base.kickoff,
    score: phase === 'live' ? D.liveScore : phase === 'post' ? D.fullTime : undefined,
  }
  const conn = D.connection[phase]

  return (
    <div className="page">
      {/* demo-only state switcher */}
      <div className="statepeek" role="group" aria-label="Preview state">
        <span className="label">State</span>
        <div className="peek-pills">
          {PHASES.map((p) => (
            <button key={p.id} className="peek-pill" aria-pressed={phase === p.id} onClick={() => setPhase(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1 — hero */}
      <MatchCover match={heroMatch} format="hero" />

      {/* personal connection */}
      <div className="md-connection">
        <span className="mc-mark" aria-hidden>◆</span>
        <p>
          {conn.text}
          <span className="sub">{conn.sub}</span>
        </p>
      </div>

      {/* 2 — single primary action */}
      <div className="md-primary">
        {phase === 'pre' && <button className="cta-block">Add to Watchlist</button>}
        {phase === 'live' && <button className="cta-block">Add a Moment</button>}
        {phase === 'post' && !editing && !memory && (
          <button
            className="cta-block"
            onClick={() => {
              setEditing(true)
              setTab('story')
            }}
          >
            Complete Your Memory
          </button>
        )}
      </div>

      {/* segmented nav */}
      <div className="md-nav" role="tablist" aria-label="Match sections">
        {(['story', 'moments', 'match'] as Tab[]).map((t) => (
          <button key={t} className="md-seg" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'story' ? 'STORY' : t === 'moments' ? 'MOMENTS' : 'MATCH'}
          </button>
        ))}
      </div>

      {tab === 'story' && (
        <div className="md-panel">
          {phase === 'post' && memory ? (
            <CompletedMemory
              memory={memory}
              cover={<MatchCover match={heroMatch} format="landscape" />}
              onEdit={() => {
                setMemory(null)
                setEditing(true)
              }}
            />
          ) : phase === 'post' && editing ? (
            <CompleteMemoryEditor
              moments={D.moments.map((m) => ({ min: m.min, type: m.type, player: m.player }))}
              onSave={(m) => {
                setMemory(m)
                setEditing(false)
              }}
            />
          ) : (
            <MatchRating communityAvg={D.communityRating.avg} communityCount={D.communityRating.count} />
          )}
          <div className="section" style={{ marginTop: 40 }}>
            <CommunityPulse pulse={D.pulse} />
          </div>
          <div className="section">
            <span className="label" style={{ display: 'block', marginBottom: 8 }}>Selected voices</span>
            {D.comments.slice(0, 2).map((a) => (
              <CommunityAnnotation key={a.name} a={a} />
            ))}
          </div>
        </div>
      )}

      {tab === 'moments' && (
        <div className="md-panel">
          <div className="anchors" role="group" aria-label="Comment anchors">
            {D.anchors.map((a) => (
              <button key={a} className="anchor-chip" aria-pressed={anchor === a} onClick={() => setAnchor(a)}>
                {a}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 32 }}>
            <CommentComposer anchor={anchor} />
          </div>
          <span className="label" style={{ display: 'block', marginBottom: 16 }}>Memorable moments</span>
          <MomentTimeline moments={D.moments} />
          <div className="section">
            <span className="label" style={{ display: 'block', marginBottom: 8 }}>Anchored comments</span>
            {D.comments.map((a) => (
              <CommunityAnnotation key={a.name} a={a} />
            ))}
          </div>
        </div>
      )}

      {tab === 'match' && (
        <div className="md-panel">
          <p className="md-note">Official data — context, not the centre.</p>
          <StadiumVisual stadium={D.stadium} />

          <div className="section">
            <span className="label" style={{ display: 'block', marginBottom: 16 }}>Lineups</span>
            <div className="lineup">
              {([D.lineups.home, D.lineups.away] as const).map((lu, idx) => (
                <div className="lu-team" key={lu.name}>
                  <div className="lu-head">
                    <span style={{ width: 26, flex: '0 0 auto' }}>
                      {/* crest / flag for identity */}
                      {crestFor(idx === 0 ? heroMatch.home : heroMatch.away)}
                    </span>
                    <span className="wi-teams" style={{ fontSize: '1.05rem' }}>{lu.name}</span>
                    <span className="lu-form num">{lu.form}</span>
                  </div>
                  <div className="lu-grid">
                    {lu.starters.map((p) => (
                      <div className="lu-row" key={p.n}>
                        <span className="lu-num">{p.n}</span>
                        <span className="lu-name">{p.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="lu-coach">Coach · {lu.coach}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <OfficialSection title="Basic statistics" defaultOpen>
              {D.official.stats.map((s) => (
                <div className="stat-row" key={s.label}>
                  <span className="lbl">{s.label}</span>
                  <span className="val num">{s.hv}</span>
                  <span className="stat-bar">
                    <span className="h" style={{ width: `${s.h}%` }} />
                    <span className="a" style={{ width: `${s.a}%` }} />
                  </span>
                  <span className="val r num">{s.av}</span>
                </div>
              ))}
            </OfficialSection>
            <OfficialSection title="Officials & broadcast">
              <p className="caption" style={{ color: 'var(--ink-2)' }}>Referee · {D.official.referee}</p>
              <p className="caption" style={{ color: 'var(--ink-2)', marginTop: 8 }}>Broadcast · {D.official.broadcast}</p>
            </OfficialSection>
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function crestFor(id: string) {
  return <Crest id={team(id).id} size={24} />
}

function OfficialSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="off-section">
      <button className="off-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}
        <span className="chev" aria-hidden>›</span>
      </button>
      {open && <div className="off-body">{children}</div>}
    </div>
  )
}
