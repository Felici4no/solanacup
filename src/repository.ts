import { useRef, useState } from 'react'

/* ============================================================
   Repository result + recoverable-action foundation.
   Persistence never fails silently: every write returns an
   explicit result the UI can react to. The same contracts work
   for localStorage today and a remote API later.
   ============================================================ */

export type RepositoryError = {
  code: 'storage_write_failed' | 'network' | 'unknown'
  message: string
}

export type RepositoryResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: RepositoryError }

export const ok = <T = void,>(data?: T): RepositoryResult<T> => ({ ok: true, data: data as T })
export const err = (code: RepositoryError['code'], message: string): RepositoryResult<never> => ({
  ok: false,
  error: { code, message },
})

/* ---- Fault injection (tests / manual QA). Keyed by persistence key. ---- */
export const faults = new Set<string>()
// Dev-only hook so error states can be exercised in the browser:
//   __vezFaults.add('vez.profile') → next profile save fails.
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  ;(window as unknown as Record<string, unknown>).__vezFaults = faults
}

/* ---- Generic async persist gateway (localStorage today, API later) ---- */
export type Persist<T> = (data: T) => Promise<RepositoryResult<void>>

export function createLocalPersist<T>(key: string): Persist<T> {
  return async (data: T) => {
    if (faults.has(key)) return err('storage_write_failed', 'write rejected')
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return ok()
    } catch {
      return err('storage_write_failed', 'storage unavailable')
    }
  }
}

export const persistProfile = createLocalPersist<{ name: string; location: string; tagline: string }>('vez.profile')
export const persistAnnotation = createLocalPersist<{ anchor: string; text: string; tag: string | null }>('vez.annotations')
export const persistMemory = createLocalPersist<unknown>('vez.memory')

/* ============================================================
   useAction — one recoverable-operation hook for the whole UI.
   idle → pending → success | error. Blocks duplicate submits
   while pending; remembers the last args so Retry replays them.
   ============================================================ */
export type ActionStatus = 'idle' | 'pending' | 'success' | 'error'

export function useAction<A extends unknown[], T>(fn: (...args: A) => Promise<RepositoryResult<T>>) {
  const [status, setStatus] = useState<ActionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const lastArgs = useRef<A | null>(null)
  const inflight = useRef(false)

  async function run(...args: A): Promise<RepositoryResult<T> | undefined> {
    if (inflight.current) return undefined // duplicate submit blocked
    inflight.current = true
    lastArgs.current = args
    setStatus('pending')
    setError(null)
    try {
      const res = await fn(...args)
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setError(res.error.message)
      }
      return res
    } finally {
      inflight.current = false
    }
  }

  function retry() {
    if (lastArgs.current) return run(...lastArgs.current)
    return Promise.resolve(undefined)
  }

  return {
    status,
    pending: status === 'pending',
    failed: status === 'error',
    error,
    run,
    retry,
    reset: () => {
      setStatus('idle')
      setError(null)
    },
  }
}
