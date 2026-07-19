import { useState } from 'react'
import { profile } from '../data'
import { useNav } from '../nav'
import { useAction, persistProfile } from '../repository'
import { Button } from '../Button'
import { ActionError } from '../ui'

/* /profile/edit — preloads current values. Save persists through the
   repository gateway; on failure the fields keep everything the user
   typed and a contextual retry is offered. */
export default function ProfileEdit() {
  const { back } = useNav()
  const [name, setName] = useState(profile.name)
  const [location, setLocation] = useState(profile.location)
  const [tagline, setTagline] = useState(profile.tagline)

  const dirty = name !== profile.name || location !== profile.location || tagline !== profile.tagline

  const save = useAction(async () => {
    const data = { name: name.trim() || profile.name, location: location.trim(), tagline: tagline.trim() }
    const res = await persistProfile(data)
    if (res.ok) {
      // apply to the in-memory profile only after the write is confirmed
      profile.name = data.name
      profile.location = data.location
      profile.tagline = data.tagline
      back()
    }
    return res
  })

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

      {save.failed && (
        <ActionError message="Couldn’t save your changes. Your edits are still here." onRetry={save.retry} />
      )}

      <div className="form-actions">
        <Button variant="ghost" size="md" onClick={back} disabled={save.pending}>
          Cancel
        </Button>
        <Button variant="primary" size="md" loading={save.pending} disabled={!dirty} onClick={() => save.run()}>
          Save
        </Button>
      </div>
    </div>
  )
}
