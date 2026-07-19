import { BRAND, BRAND_SUB, BRAND_ACCENT } from '../data'
import { AmbientBackground } from '../AmbientBackground'
import { navigate } from '../router'

/* Shared chrome for the standalone public surfaces (/welcome, /u/:username,
   /chapters/:id). Mirrors the app shell's structure so the existing layout
   and identity CSS apply unchanged — same wordmark, grain and ambient light,
   no tab bar (these pages are outside the app). */

export function PublicShell({
  ambient,
  intensity = 0.7,
  cta,
  children,
}: {
  ambient: [string, string, string?]
  intensity?: number
  /** Header action — omit on the welcome page itself. */
  cta?: { label: string; to: string }
  children: React.ReactNode
}) {
  return (
    <>
      <div className="grain" aria-hidden />
      <div className="app">
        <AmbientBackground colors={ambient} intensity={intensity} />
        <header className="header pub-header">
          <div className="header-spacer" aria-hidden />
          <div className="wm">
            <span className="wm-name">
              {BRAND.split(BRAND_ACCENT)[0]}
              <span className="dot">{BRAND_ACCENT}</span>
              {BRAND.split(BRAND_ACCENT)[1]}
            </span>
            <span className="wm-sub">{BRAND_SUB}</span>
          </div>
          {cta ? (
            <button className="pub-enter" onClick={() => navigate(cta.to)}>
              {cta.label}
            </button>
          ) : (
            <div className="header-spacer" aria-hidden />
          )}
        </header>
        <main>{children}</main>
      </div>
    </>
  )
}

export function PublicNotFound({ what }: { what: string }) {
  return (
    <div className="page pub-none">
      <h1 className="title" style={{ fontSize: '1.5rem' }}>This {what} isn’t here</h1>
      <p className="caption" style={{ marginTop: 10 }}>
        Visitor-created links live in the browser that made them. Explore the demo and create your own.
      </p>
      <button className="pub-enter solid" style={{ marginTop: 20 }} onClick={() => navigate('/welcome')}>
        Explore the demo
      </button>
    </div>
  )
}
