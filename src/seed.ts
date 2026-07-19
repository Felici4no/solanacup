/* ============================================================
   Seeded demo content — ONE import point, explicitly marked.

   Everything re-exported here is illustrative content used to
   demonstrate the product. It is never presented as real traction:
   surfaces built from it carry a visible "Demo data" tag.

   Real, non-seeded data (TxLINE match state, G3B balances) never
   passes through this module.
   ============================================================ */

export const SEED_SOURCE = 'demo' as const
export type SourceTag = 'demo' | 'live'

/** True when a surface is rendering illustrative content. */
export function isDemo(source: SourceTag = SEED_SOURCE): boolean {
  return source === 'demo'
}

/* ---- Seeded datasets (single entry point) ---- */
export {
  profile,
  todaysChapter,
  comingUp,
  continueMemory,
  onThisDay,
  communityMoment,
  matchDetail,
  watchlist,
} from './data'

export { pulseMatch, pulseAnnotations } from './pulse'
export { matchBroadcast, eventVideoMarkers } from './video'
