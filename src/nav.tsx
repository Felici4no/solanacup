import { createContext, useContext } from 'react'
import type { MatchData } from './MatchCover'

/* Lightweight push-navigation + ambient context shared across screens.
   Destinations mirror the required routes:
   /match/:id · /watchlist · /watchlist/:id · /profile/edit · /settings */
export type Nav = {
  openMatch: (match: MatchData) => void
  openWatchlist: () => void
  openWatchlistMatch: (match: MatchData) => void
  openProfileEdit: () => void
  openSettings: () => void
  back: () => void
}

const noop = () => {}
export const NavContext = createContext<Nav>({
  openMatch: noop,
  openWatchlist: noop,
  openWatchlistMatch: noop,
  openProfileEdit: noop,
  openSettings: noop,
  back: noop,
})

export const useNav = () => useContext(NavContext)
