/* ============================================================
   Match state presentation — ONE place that decides what the
   product says and offers for a given match phase.

   Status label, primary CTA and the tab a screen should open on
   used to be inline ternaries duplicated across Home and Match
   Detail. Centralising them keeps state and action in agreement
   and makes the emotional subtext depend on the *user's* context
   rather than on the phase alone.

   Presentation only — no economics, no network, no persistence.
   ============================================================ */

export type MatchPhase = 'pre' | 'live' | 'post'
export type MatchTab = 'story' | 'moments' | 'match'

/** What this particular fan has done with this match so far. */
export type UserMatchContext = {
  savedToWatchlist?: boolean
  checkedIn?: boolean
  hasMemory?: boolean
  /** Who they watched it with, when known. */
  watchedWith?: string
  /** First time this fan is at / following this venue. */
  firstAtVenue?: boolean
  venue?: string
}

export type Subtext = { text: string; sub: string }

export type MatchPresentation = {
  /** Chip shown on the cover. */
  statusLabel: string
  /** Primary action for this phase, or null when another surface owns it. */
  ctaLabel: string | null
  /** Which tab a screen should land on for this phase. */
  defaultTab: MatchTab
  /** Emotional line; null when a dedicated component already says it. */
  subtext: Subtext | null
}

export function matchPresentation(phase: MatchPhase, ctx: UserMatchContext = {}): MatchPresentation {
  switch (phase) {
    case 'pre':
      return {
        statusLabel: 'Tonight',
        // The Watchlist row owns the pre-match action and its copy.
        ctaLabel: null,
        defaultTab: 'story',
        subtext: null,
      }

    case 'live':
      return {
        statusLabel: ctx.checkedIn ? 'You’re watching' : 'Live',
        ctaLabel: 'Add a Moment',
        // While it is happening, moments are where the fan wants to be.
        defaultTab: 'moments',
        subtext: ctx.checkedIn
          ? {
              text: 'You’re watching this match.',
              sub: ctx.watchedWith
                ? `Chapter in progress · with ${ctx.watchedWith}`
                : 'Chapter in progress',
            }
          : {
              text: 'This match is live right now.',
              sub: 'Check in to start your chapter.',
            },
      }

    case 'post':
      if (ctx.hasMemory) {
        return {
          statusLabel: 'Ended',
          ctaLabel: null,
          defaultTab: 'story',
          subtext: {
            text: 'This is part of your story now.',
            sub: [
              ctx.watchedWith ? `Watched with ${ctx.watchedWith}` : null,
              ctx.firstAtVenue && ctx.venue ? `your first time at ${ctx.venue}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Kept in your archive',
          },
        }
      }
      return {
        statusLabel: 'Ended',
        ctaLabel: 'Complete Your Memory',
        defaultTab: 'story',
        subtext: ctx.checkedIn
          ? {
              text: 'You watched this match.',
              sub: 'Finish your chapter while it’s still fresh.',
            }
          : {
              text: 'This match is over.',
              sub: 'You can still write down what it meant to you.',
            },
      }
  }
}
