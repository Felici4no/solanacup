/* ============================================================
   Minimal path router for the PUBLIC surfaces only.

   The app itself keeps its state-based push navigation (nav.tsx)
   untouched at '/'. Real URLs exist for what judges share and
   reload: /welcome, /u/:username, /chapters/:chapterId — each a
   standalone page outside the app shell. Deep links survive
   reload via the Vercel SPA rewrite (vercel.json).
   ============================================================ */

import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'app' }
  | { name: 'welcome' }
  | { name: 'publicProfile'; username: string }
  | { name: 'publicChapter'; chapterId: string }

export function parseRoute(pathname: string): Route {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'welcome') return { name: 'welcome' }
  if (parts[0] === 'u' && parts[1]) return { name: 'publicProfile', username: decodeURIComponent(parts[1]) }
  if (parts[0] === 'chapters' && parts[1]) return { name: 'publicChapter', chapterId: decodeURIComponent(parts[1]) }
  return { name: 'app' }
}

/* ---- history wiring ---- */
const listeners = new Set<() => void>()
function notify() {
  listeners.forEach((l) => l())
}
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', notify)
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  if (typeof window === 'undefined') return
  if (opts.replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  notify()
}

function currentPath(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/'
}

export function useRoute(): Route {
  const pathname = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    currentPath,
    () => '/',
  )
  return parseRoute(pathname)
}

/* ---- Shareable public URLs ---- */
function origin(): string {
  return typeof window !== 'undefined' ? window.location.origin : ''
}
export function profileUrl(username: string): string {
  return `${origin()}/u/${encodeURIComponent(username)}`
}
export function chapterUrl(chapterId: string): string {
  return `${origin()}/chapters/${encodeURIComponent(chapterId)}`
}
