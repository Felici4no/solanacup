import { useState } from 'react'
import { BRAND, BRAND_SUB, BRAND_ACCENT, todaysChapter } from './data'
import { pulseMatch } from './pulse'
import { Icon } from './ui'
import { team } from './assets'
import { AmbientBackground } from './AmbientBackground'
import { NavContext } from './nav'
import type { MatchData } from './MatchCover'
import Home from './pages/Home'
import MatchPulse from './pages/MatchPulse'
import Search from './pages/Search'
import Archive from './pages/Archive'
import Profile from './pages/Profile'
import Watchlist from './pages/Watchlist'
import MatchDetail from './pages/MatchDetail'

type Tab = 'home' | 'pulse' | 'search' | 'archive' | 'profile'
type Overlay = { type: 'match'; match: MatchData } | { type: 'watchlist' }

// Navigation: Home · Pulse · Pesquisar (emphasised) · Archive · Perfil
const TABS: { id: Tab; label: string; icon: JSX.Element; emph?: boolean }[] = [
  { id: 'home', label: 'Home', icon: Icon.Home },
  { id: 'pulse', label: 'Pulse', icon: Icon.Pulse },
  { id: 'search', label: 'Pesquisar', icon: Icon.Search, emph: true },
  { id: 'archive', label: 'Archive', icon: Icon.Archive },
  { id: 'profile', label: 'Perfil', icon: Icon.Profile },
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
    case 'pulse':
      return { colors: [team(pulseMatch.home).colors[0], team(pulseMatch.away).colors[0]], intensity: 0.7 }
    case 'search':
      return { colors: ['#2b303a', '#24222b'], intensity: 0.4 }
    case 'archive':
      return { colors: ['#4a4238', '#2a2430'], intensity: 0.55 }
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
          <div className="wm">
            <span className="wm-name">
              {BRAND.split(BRAND_ACCENT)[0]}
              <span className="dot">{BRAND_ACCENT}</span>
              {BRAND.split(BRAND_ACCENT)[1]}
            </span>
            <span className="wm-sub">{BRAND_SUB}</span>
          </div>
          <button
            className="profile-btn"
            aria-label={!overlay && tab === 'profile' ? 'Settings' : 'Profile and settings'}
            onClick={() => goTab('profile')}
          >
            {!overlay && tab === 'profile' ? Icon.Gear : Icon.ProfileSmall}
          </button>
        </header>

        <main key={viewKey}>
          {overlay?.type === 'match' && <MatchDetail match={overlay.match} />}
          {overlay?.type === 'watchlist' && <Watchlist />}
          {!overlay && tab === 'home' && <Home />}
          {!overlay && tab === 'pulse' && <MatchPulse />}
          {!overlay && tab === 'search' && <Search />}
          {!overlay && tab === 'archive' && <Archive />}
          {!overlay && tab === 'profile' && <Profile />}
        </main>
      </div>

      <nav className="navbar" aria-label="Primary">
        {TABS.map((t) => {
          const active = !overlay && tab === t.id
          return (
            <button
              key={t.id}
              className={`nav-item${active ? ' active' : ''}${t.emph ? ' emph' : ''}`}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => goTab(t.id)}
            >
              {t.emph ? <span className="ic">{t.icon}</span> : t.icon}
              <span className="nl">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </NavContext.Provider>
  )
}
