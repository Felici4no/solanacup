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

describe('Match Pulse — two-level timeline selection', () => {
  it('defaults to the decisive moment and moves the cursor on tap', () => {
    render(<MatchPulse />)
    expect(pressed(/87th minute, goal by Calleri/i)).toBe('true')
    fireEvent.click(marker(/84th minute, goal by Luciano/i))
    expect(pressed(/84th minute, goal by Luciano/i)).toBe('true')
    expect(screen.getByText(/84’ · Goal · Luciano/)).toBeTruthy()
  })

  it('selects a clustered minor event from the focused range (level 2)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/84th minute, goal by Luciano/i)) // opens the 78’–84’ focus
    fireEvent.click(screen.getByRole('button', { name: /81st minute, save by Armani/i }))
    expect(screen.getByText(/81’ · Save · Armani/)).toBeTruthy()
  })

  it('comments on an official event (event anchor)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/84th minute, goal by Luciano/i))
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }))
    expect(screen.getByText(/Comment on/i).textContent).toMatch(/84’ · Goal · Luciano/)
    expect(screen.getByPlaceholderText(/What do you want to remember/i)).toBeTruthy()
  })

  it('comments on a minute with no official event (time anchor)', () => {
    render(<MatchPulse />)
    fireEvent.keyDown(canvas(), { key: 'End' }) // → minute 90, no event
    expect(screen.getByText('90th minute')).toBeTruthy()
    expect(screen.getByText(/No official event here/i)).toBeTruthy()
  })

  it('comments on an entire sequence (sequence anchor)', () => {
    render(<MatchPulse />)
    fireEvent.click(screen.getByRole('button', { name: /Sequence São Paulo pressure/i }))
    expect(screen.getByText(/São Paulo pressure · 78/)).toBeTruthy()
    expect(screen.getByText('3 shots')).toBeTruthy()
    expect(screen.getByText('1 goal')).toBeTruthy()
  })
})

describe('Match Pulse — progressive actions (one at a time)', () => {
  it('shows annotations connected to the selected anchor under Community', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/84th minute, goal by Luciano/i))
    fireEvent.click(screen.getByRole('button', { name: 'Community' }))
    expect(screen.getByText(/breathe/i)).toBeTruthy()
  })

  it('hides the contextual result until the user answers', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/84th minute, goal by Luciano/i))
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
    expect(pressed(/84th minute, goal by Luciano/i)).toBe('true')
    expect(screen.getByText(/Add a moment at 84/)).toBeTruthy()
  })

  it('promotes a live annotation into the permanent memory (post-match)', () => {
    render(<MatchPulse />)
    fireEvent.click(marker(/84th minute, goal by Luciano/i))
    fireEvent.click(screen.getByRole('button', { name: 'Community' }))
    expect(screen.getByText(/Keep this annotation in your memory/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(screen.getByText(/Kept in your memory/i)).toBeTruthy()
  })
})
