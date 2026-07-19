import { useState } from 'react'
import { profileUrl } from './router'

/* Web Share API when available, clipboard fallback otherwise.
   Distinguishes cancellation (user dismissed) from failure (API unavailable). */

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareLink(
  title: string,
  text: string,
  url: string,
): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      // AbortError = user cancelled the share sheet intentionally — not a failure
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // Fall through to clipboard for other errors (e.g. unsupported payload on desktop)
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** Share the public profile URL for a given username. */
export async function shareProfile(username: string): Promise<ShareResult> {
  // Build the full absolute URL correctly regardless of base path
  const raw = profileUrl(username)
  const url = new URL(raw, window.location.origin).toString()
  return shareLink(
    `${username} · GAM3BOOK`,
    'Veja os jogos, estádios e memórias que formaram minha história como fã.',
    url,
  )
}

export function ShareLinkButton({
  label,
  title,
  text = '',
  url,
}: {
  label: string
  title: string
  text?: string
  url: string
}) {
  const [state, setState] = useState<'idle' | ShareResult>('idle')
  return (
    <button
      className="share-link-btn"
      onClick={async () => {
        const r = await shareLink(title, text, url)
        if (r === 'cancelled') return // no feedback for intentional cancel
        setState(r)
        window.setTimeout(() => setState('idle'), 2200)
      }}
    >
      {state === 'copied' ? 'Link copied ✓' : state === 'shared' ? 'Shared ✓' : state === 'failed' ? url : label}
    </button>
  )
}
