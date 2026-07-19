import { useState } from 'react'
import { MatchCover } from '../MatchCover'
import { pulseMatch } from '../pulse'
import { team } from '../assets'
import { Button } from '../Button'
import { demoStore } from '../demo/repository'
import { navigate } from '../router'
import { PublicShell } from './PublicShell'

/* /welcome — the public landing. One strong visual (the Match Cover system
   at work), one promise, one tap into the demo. No sign-up, no fake auth:
   "Explore the demo" mints only a local visitor id. */

export default function Welcome() {
  const [walletNote, setWalletNote] = useState(false)
  const hasSession = demoStore.hasSession()
  const homeC = team(pulseMatch.home).colors[0]
  const awayC = team(pulseMatch.away).colors[0]

  return (
    <PublicShell ambient={[homeC, awayC]} intensity={1.0}>
      <div className="page wel">
        <p className="wel-phrase">
          A partida pertence à história.
          <br />
          <em>O capítulo pertence a você.</em>
        </p>

        {/* strong visual — the identity system itself, no stock imagery */}
        <div className="wel-cover" aria-hidden>
          <MatchCover match={pulseMatch} format="landscape" />
        </div>

        <div className="wel-actions">
          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => {
              demoStore.startSession()
              navigate('/')
            }}
          >
            Explore the demo
          </Button>

          <Button variant="ghost" size="md" block onClick={() => setWalletNote((v) => !v)}>
            Connect wallet
          </Button>
          {walletNote && (
            <p className="wel-note" role="note">
              Wallet check-ins run against the Solana devnet backend (G3B). This hosted demo ships
              without it — nothing here pretends to authenticate you.
            </p>
          )}

          <div className="wel-later">
            <span>Continue with e-mail</span>
            <span className="wel-later-tag">Coming later</span>
          </div>

          <p className="wel-fine">No sign-up · demo data, identified as such · resets anytime</p>

          {hasSession && (
            <button
              className="wel-reset"
              onClick={() => {
                demoStore.reset()
                setWalletNote(false)
              }}
            >
              Reset the demonstration
            </button>
          )}
        </div>
      </div>
    </PublicShell>
  )
}
