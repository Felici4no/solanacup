import { useState } from 'react'

/* Web Share API when available, clipboard fallback otherwise.
   Pure helper + one small labelled button so every share point
   behaves identically. */

export async function shareLink(title: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch {
      /* user dismissed or unsupported payload — fall through to copy */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function ShareLinkButton({ label, title, url }: { label: string; title: string; url: string }) {
  const [state, setState] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle')
  return (
    <button
      className="share-link-btn"
      onClick={async () => {
        const r = await shareLink(title, url)
        setState(r)
        window.setTimeout(() => setState('idle'), 2200)
      }}
    >
      {state === 'copied' ? 'Link copied ✓' : state === 'shared' ? 'Shared ✓' : state === 'failed' ? url : label}
    </button>
  )
}
