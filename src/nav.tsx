import { createContext, useContext } from 'react'
import type { MatchData } from './MatchCover'

/* Lightweight push-navigation + ambient context shared across screens. */
export type Nav = {
  openMatch: (match: MatchData) => void
  openWatchlist: () => void
  back: () => void
}

export const NavContext = createContext<Nav>({
  openMatch: () => {},
  openWatchlist: () => {},
  back: () => {},
})

export const useNav = () => useContext(NavContext)
