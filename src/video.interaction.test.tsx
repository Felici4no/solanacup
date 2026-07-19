// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import MatchPulse from './pages/MatchPulse'
import { OfficialMomentVideo } from './OfficialMomentVideo'
import { matchBroadcast, eventVideoMarkers } from './video'
import { pulseMatch } from './pulse'

afterEach(cleanup)

const canvas = () => screen.getAllByRole('slider')[0]
const marker = (name: RegExp) => within(canvas()).getByRole('button', { name })
const videoLayer = () => screen.getByRole('region', { name: /Official broadcast moment/i })
const momentList = () => screen.getByRole('group', { name: /Broadcast moments/i })

describe('Official broadcast layer — above the Pulse, same selection', () => {
  it('shows the clip card for the selected moment with its origin visible', () => {
    render(<MatchPulse />)
    // default selection = decisive 90’ goal → mapped clip
    expect(within(videoLayer()).getAllByText(/90’ · Goal · Lautaro Martínez/).length).toBe(1)
    expect(screen.getByText(/Official broadcast moment · CazéTV/)).toBeTruthy()
    const open = screen.getByRole('link', { name: 'Open on YouTube' })
    expect(open.getAttribute('href')).toBe('https://www.youtube.com/watch?v=QcmQ_zCf8vc&t=17512s')
  })

  it('degrades to a timestamped deep link when the rights holder blocks embedding', () => {
    render(
      <OfficialMomentVideo
        broadcast={{ ...matchBroadcast, status: 'embed-disabled' }}
        markers={eventVideoMarkers}
        events={pulseMatch.events}
        selectedEventId="e90"
        selectedMinute={90}
        onSelectEvent={() => {}}
      />,
    )
    expect(screen.getByText(/Inline playback is disabled by the rights holder/)).toBeTruthy()
    const deep = screen.getByRole('link', { name: /Watch this moment on YouTube · 4:51:52/ })
    expect(deep.getAttribute('href')).toContain('t=17512s')
  })

  it('selecting from the video list drives the ONE shared selection (video → Pulse)', () => {
    render(<MatchPulse />)
    fireEvent.click(within(momentList()).getByRole('button', { name: /Yellow card · Lisandro Martínez/ }))
    // the marking sheet follows — same cursor, no parallel selection
    // (the title appears in the sheet AND the video header, by design)
    expect(screen.getAllByText(/41’ · yellow card · Lisandro Martínez/i).length).toBeGreaterThan(1)
    expect(
      within(momentList())
        .getByRole('button', { name: /Yellow card · Lisandro Martínez/ })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('selecting in the Pulse updates the video (Pulse → video)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/55th minute, goal by Anthony Gordon/i))
    expect(within(videoLayer()).getAllByText(/55’ · Goal · Anthony Gordon/).length).toBe(1)
    expect(screen.getByRole('link', { name: 'Open on YouTube' }).getAttribute('href')).toContain('t=15315s')
  })

  it('keeps unmapped events first-class: discreet note, marking untouched', () => {
    render(<MatchPulse />)
    // walk back to 51’ — Cuti Romero’s card has no mapped clip
    // (event minutes: 90 → 85 → 84 → 83 → 82 → 64 → 55 → 51)
    for (let i = 0; i < 7; i++) fireEvent.keyDown(canvas(), { key: 'ArrowLeft' })
    expect(screen.getByText(/No official clip mapped for this moment/)).toBeTruthy()
    // the existing marking flow still works on this event
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }))
    expect(screen.getByText(/Comment on/i).textContent).toMatch(/51’ · yellow card · Cuti Romero/i)
  })

  it('stays out of the live flow (broadcast VOD is post-match)', () => {
    render(<MatchPulse />)
    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    expect(screen.queryByRole('region', { name: /Official broadcast moment/i })).toBeNull()
  })

  it('never resets the open action panel on video-list selection beyond Pulse rules', () => {
    render(<MatchPulse />)
    // existing Pulse rule: changing selection closes the action panel — the
    // video list must behave EXACTLY like a native Pulse tap, no divergence
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i))
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }))
    expect(screen.getByPlaceholderText(/What do you want to remember/i)).toBeTruthy()
    fireEvent.click(within(momentList()).getByRole('button', { name: /Goal · Lautaro Martínez/ }))
    expect(screen.queryByPlaceholderText(/What do you want to remember/i)).toBeNull()
  })
})
