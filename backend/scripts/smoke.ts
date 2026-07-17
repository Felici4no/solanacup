import { config } from '../src/config.js'
import { fetchGuestJwt } from '../src/txline/auth.js'

/* Connectivity smoke test — no wallet, no token: proves the TxLINE
   host is reachable and the guest-session endpoint behaves as the
   docs describe (POST /auth/guest/start → { token }). */

async function main() {
  console.log(`[smoke] ${config.network} → ${config.jwtUrl}`)
  const jwt = await fetchGuestJwt()
  const [, payload] = jwt.split('.')
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
  console.log('[smoke] guest JWT ok:', {
    length: jwt.length,
    claims: Object.keys(claims),
    exp: claims.exp ? new Date(claims.exp * 1000).toISOString() : null,
  })
}

main().catch((err) => {
  console.error('[smoke] FAILED:', err)
  process.exit(1)
})
