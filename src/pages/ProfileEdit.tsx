import { useState } from 'react'
import { profile } from '../data'
import { useNav } from '../nav'
import { Button } from '../Button'

/* /profile/edit — preloads current values, Save returns to Perfil. */
export default function ProfileEdit() {
  const { back } = useNav()
  const [name, setName] = useState(profile.name)
  const [location, setLocation] = useState(profile.location)
  const [tagline, setTagline] = useState(profile.tagline)
  const [saving, setSaving] = useState(false)

  const dirty = name !== profile.name || location !== profile.location || tagline !== profile.tagline

  function save() {
    setSaving(true)
    // persist to the in-memory profile so Perfil reflects the change
    profile.name = name.trim() || profile.name
    profile.location = location.trim()
    profile.tagline = tagline.trim()
    setTimeout(back, 250)
  }

  return (
    <div className="page">
      <div className="wl-intro">
        <h1 className="title" style={{ fontSize: '1.6rem' }}>Edit profile</h1>
      </div>

      <div className="form">
        <label className="field">
          <span className="field-label">Name</span>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Location</span>
          <input className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
        </label>
        <label className="field">
          <span className="field-label">Sports identity</span>
          <textarea className="field-input" rows={2} value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <Button variant="ghost" size="md" onClick={back} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" size="md" loading={saving} disabled={!dirty} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  )
}
