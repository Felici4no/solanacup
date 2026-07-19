// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import MatchPulse from './pages/MatchPulse'

afterEach(cleanup)

// The overview canvas is the first slider (a StarRange in the React panel is
// the second). Goal markers live inside it; the focused-range strip sits
// outside, so scope marker queries to the canvas to stay unambiguous.
const canvas = () => screen.getAllByRole('slider')[0]
const marker = (name: RegExp) => within(canvas()).getByRole('button', { name })
const pressed = (name: RegExp) => marker(name).getAttribute('aria-pressed')
// The selected-moment title appears in the sheet AND in the broadcast-video
// layer above the Pulse (shared selection, by design) — assert on presence.
const shown = (re: RegExp) => screen.getAllByText(re).length

describe('Match Pulse — two-level timeline selection', () => {
  it('defaults to the decisive moment and moves the cursor on tap', () => {
    render(<MatchPulse />)
    expect(pressed(/90th minute, goal by Lautaro Martínez/i)).toBe('true')
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i))
    expect(pressed(/85th minute, goal by Enzo Fernández/i)).toBe('true')
    expect(shown(/85’ · Goal · Enzo Fernández/)).toBeGreaterThan(0)
  })

  it('selects a clustered minor event from the focused range (level 2)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i)) // opens the 82’–85’ focus
    fireEvent.click(screen.getByRole('button', { name: /84th minute, save by Pickford/i }))
    expect(shown(/84’ · Save · Pickford/)).toBeGreaterThan(0)
  })

  it('comments on an official event (event anchor)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i))
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }))
    expect(screen.getByText(/Comment on/i).textContent).toMatch(/85’ · Goal · Enzo Fernández/)
    expect(screen.getByPlaceholderText(/What do you want to remember/i)).toBeTruthy()
  })

  it('comments on a minute with no official event (time anchor)', () => {
    render(<MatchPulse />)
    fireEvent.keyDown(canvas(), { key: 'Home' }) // → minute 0, no event
    expect(screen.getByText('0th minute')).toBeTruthy()
    expect(screen.getByText(/No official event here/i)).toBeTruthy()
  })

  it('comments on an entire sequence (sequence anchor)', () => {
    render(<MatchPulse />)
    fireEvent.click(screen.getByRole('button', { name: /Sequence Argentina siege/i }))
    expect(screen.getByText(/Argentina siege · 82/)).toBeTruthy()
    expect(screen.getByText('1 shot')).toBeTruthy()
    expect(screen.getByText('1 goal')).toBeTruthy()
  })
})

describe('Match Pulse — progressive actions (one at a time)', () => {
  it('shows annotations connected to the selected anchor under Community', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i))
    fireEvent.click(screen.getByRole('button', { name: 'Community' }))
    expect(screen.getByText(/breathe/i)).toBeTruthy()
  })

  it('hides the contextual result until the user answers', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i))
    fireEvent.click(screen.getByRole('button', { name: 'React' }))
    expect(screen.queryByText(/people agreed/i)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByText(/people agreed/i)).toBeTruthy()
  })
})

describe('Match Pulse — live & post behaviour', () => {
  it('defaults the live cursor to the current minute and offers a quick add', () => {
    render(<MatchPulse />)
    fireEvent.click(screen.getByRole('button', { name: 'Live' }))
    // 84’ is Pickford's save — a minor event, so no overview goal marker;
    // the sheet reflecting the live minute is the behaviour under test.
    expect(screen.getByText(/84’ · Save · Pickford/)).toBeTruthy()
    expect(screen.getByText(/Add a moment at 84/)).toBeTruthy()
  })

  it('promotes a live annotation into the permanent memory (post-match)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/85th minute, goal by Enzo Fernández/i))
    fireEvent.click(screen.getByRole('button', { name: 'Community' }))
    expect(screen.getByText(/Keep this annotation in your memory/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(screen.getByText(/Kept in your memory/i)).toBeTruthy()
  })
})
