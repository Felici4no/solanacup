import { useState } from 'react'
import { BRAND, todaysChapter, radarLead } from './data'
import { Icon } from './ui'
import { team } from './assets'
import { AmbientBackground } from './AmbientBackground'
import { NavContext } from './nav'
import type { MatchData } from './MatchCover'
import Home from './pages/Home'
import Radar from './pages/Radar'
import Search from './pages/Search'
import Profile from './pages/Profile'
import Watchlist from './pages/Watchlist'
import MatchDetail from './pages/MatchDetail'

type Tab = 'home' | 'radar' | 'search' | 'profile'
type Overlay = { type: 'match'; match: MatchData } | { type: 'watchlist' }

const TABS: { id: Tab; icon: JSX.Element }[] = [
  { id: 'home', icon: Icon.Home },
  { id: 'radar', icon: Icon.Radar },
  { id: 'search', icon: Icon.Search },
  { id: 'profile', icon: Icon.Profile },
]

type Ambient = { colors: [string, string, string?]; intensity: number }

function ambientFor(tab: Tab, overlay?: Overlay): Ambient {
  if (overlay?.type === 'match') {
    const h = team(overlay.match.home).colors[0]
    const a = team(overlay.match.away).colors[0]
    return { colors: [h, a, h], intensity: 1.1 }
  }
  if (overlay?.type === 'watchlist') return { colors: ['#3a4a5e', '#4a2f3a'], intensity: 0.7 }
  switch (tab) {
    case 'home':
      return { colors: [team(todaysChapter.home).colors[0], team(todaysChapter.away).colors[0]], intensity: 0.9 }
    case 'radar':
      return { colors: [team(radarLead.match.home).colors[0], team(radarLead.match.away).colors[0]], intensity: 0.5 }
    case 'search':
      return { colors: ['#2b303a', '#24222b'], intensity: 0.4 }
    case 'profile':
      return { colors: [team('saopaulo').colors[0], '#2a2430'], intensity: 0.6 }
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<Overlay[]>([])

  const overlay = stack[stack.length - 1]
  const nav = {
    openMatch: (match: MatchData) => setStack((s) => [...s, { type: 'match', match }]),
    openWatchlist: () => setStack((s) => [...s, { type: 'watchlist' }]),
    back: () => setStack((s) => s.slice(0, -1)),
  }
  const goTab = (t: Tab) => {
    setStack([])
    setTab(t)
  }

  const amb = ambientFor(tab, overlay)
  const viewKey = overlay ? `${overlay.type}-${stack.length}` : tab

  return (
    <NavContext.Provider value={nav}>
      <div className="grain" aria-hidden />
      <div className="app">
        <AmbientBackground colors={amb.colors} intensity={amb.intensity} />

        <header className="header">
          {stack.length ? (
            <button className="back-btn" aria-label="Back" onClick={nav.back}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="header-spacer" aria-hidden />
          )}
          <div className="wordmark">
            {BRAND.slice(0, -1)}
            <span className="dot">{BRAND.slice(-1)}</span>
          </div>
          <button className="profile-btn" aria-label="Profile" onClick={() => goTab('profile')}>
            {Icon.ProfileSmall}
          </button>
        </header>

        <main key={viewKey}>
          {overlay?.type === 'match' && <MatchDetail match={overlay.match} />}
          {overlay?.type === 'watchlist' && <Watchlist />}
          {!overlay && tab === 'home' && <Home />}
          {!overlay && tab === 'radar' && <Radar />}
          {!overlay && tab === 'search' && <Search />}
          {!overlay && tab === 'profile' && <Profile />}
        </main>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${!overlay && tab === t.id ? 'active' : ''}`}
            aria-label={t.id}
            aria-current={!overlay && tab === t.id ? 'page' : undefined}
            onClick={() => goTab(t.id)}
          >
            {t.icon}
          </button>
        ))}
      </nav>
    </NavContext.Provider>
  )
}
