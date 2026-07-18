/* Verify that the CazéTV full-match video is embeddable and that our
   manually-located timestamps land on the expected match moments.
   Serves a local host page (real referer, same as the app), boots the
   official IFrame API at each start offset, then screenshots the frame
   so the broadcast scoreboard is readable. */
import puppeteer from 'puppeteer'
import http from 'node:http'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.env.OUT_DIR || join(process.cwd(), 'embed-frames')
mkdirSync(OUT, { recursive: true })

const VIDEO = 'QcmQ_zCf8vc'
const MARKS = [
  { name: 'kickoff-0min', t: 10795 },
  { name: 'card41-lisandro', t: 13258 },
  { name: 'goal55-gordon', t: 15325 },
  { name: 'sub64-nico', t: 15860 },
  { name: 'chance83-messi', t: 17048 },
  { name: 'goal85-enzo', t: 17126 },
  { name: 'goal90-lautaro', t: 17522 },
  { name: 'ft-whistle', t: 18146 },
]

const PAGE = `<!doctype html><html><body style="margin:0;background:#000">
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  window.playerState = 'boot';
  function onYouTubeIframeAPIReady() {
    var t = Number(new URLSearchParams(location.search).get('t') || 0);
    window.p = new YT.Player('player', {
      width: 1280, height: 720, videoId: '${VIDEO}',
      playerVars: { start: t, autoplay: 1, mute: 1, controls: 0 },
      events: {
        onReady: function (e) { e.target.mute(); e.target.playVideo(); window.playerState = 'ready'; },
        onStateChange: function (e) { if (e.data === 1) window.playerState = 'playing'; },
        onError: function (e) { window.playerState = 'error:' + e.data; },
      },
    });
  }
</script></body></html>`

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(PAGE)
})
await new Promise((r) => server.listen(4173, '127.0.0.1', r))

const browser = await puppeteer.launch({ headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 720 })

for (const m of MARKS) {
  await page.goto(`http://127.0.0.1:4173/?t=${m.t}`, { waitUntil: 'load', timeout: 45000 })
  // wait until playing (or error), then let the frame settle
  await page
    .waitForFunction(() => window.playerState === 'playing' || String(window.playerState).startsWith('error'), { timeout: 25000 })
    .catch(() => {})
  await new Promise((r) => setTimeout(r, 3500))
  const state = await page.evaluate(() => ({
    playerState: window.playerState,
    t: window.p && window.p.getCurrentTime ? Math.round(window.p.getCurrentTime()) : null,
  }))
  console.log(m.name, JSON.stringify(state))
  await page.screenshot({ path: join(OUT, `${m.name}.png`) })
}

await browser.close()
server.close()
console.log('done ->', OUT)
