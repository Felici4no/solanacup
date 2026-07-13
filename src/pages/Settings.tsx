import { useState } from 'react'
import { useNav } from '../nav'
import { Button } from '../Button'
import { Icon } from '../ui'

/* /settings — real, self-contained toggles (no dead controls). */
const TOGGLES = [
  { id: 'reminders', label: 'Match reminders', sub: 'Notify me before saved matches' },
  { id: 'community', label: 'Community activity', sub: 'When people annotate matches I saved' },
  { id: 'private', label: 'Private by default', sub: 'New memories start private' },
]

export default function Settings() {
  const { openProfileEdit, back } = useNav()
  const [on, setOn] = useState<Record<string, boolean>>({ reminders: true, community: false, private: true })

  return (
    <div className="page">
      <div className="wl-intro">
        <h1 className="title" style={{ fontSize: '1.6rem' }}>Settings</h1>
      </div>

      <section className="set-group">
        <button className="nav-row" onClick={openProfileEdit}>
          <span className="nr-body">
            <span className="nr-title">Edit profile</span>
            <span className="nr-sub">Name, location, sports identity</span>
          </span>
          <span className="nr-chev">{Icon.Chevron}</span>
        </button>
      </section>

      <section className="set-group">
        <span className="label" style={{ display: 'block', marginBottom: 10 }}>Notifications & privacy</span>
        {TOGGLES.map((t) => (
          <div className="set-row" key={t.id}>
            <span className="set-text">
              <span className="set-label">{t.label}</span>
              <span className="set-sub">{t.sub}</span>
            </span>
            <button
              className={`switch${on[t.id] ? ' on' : ''}`}
              role="switch"
              aria-checked={on[t.id]}
              aria-label={t.label}
              onClick={() => setOn((s) => ({ ...s, [t.id]: !s[t.id] }))}
            >
              <span className="switch-knob" />
            </button>
          </div>
        ))}
      </section>

      <div style={{ marginTop: 24 }}>
        <Button variant="ghost" size="md" onClick={back}>Done</Button>
      </div>
    </div>
  )
}
