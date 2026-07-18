/* Captures the Official Moment Video layer on the Match Pulse screen.
   Run the dev server first (npx vite --port 5173), then:
   node capture-video-moments.mjs */
import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const URL = process.env.APP_URL || 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function chrome(page) {
  await page.evaluate(() => {
    let s = document.getElementById('capstyle')
    if (!s) { s = document.createElement('style'); s.id = 'capstyle'; document.head.appendChild(s) }
    s.textContent = '.navbar{display:none!important}.statepeek{display:none!important}'
  })
  await sleep(60)
}
async function shot(page, name, w) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 2 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(260)
  await page.screenshot({ path: join(OUT, name), fullPage: true })
  console.log('  saved', name, `(${w}px)`)
}

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 })
await page.goto(URL, { waitUntil: 'networkidle2' })
await sleep(400)

// → Pulse tab
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Pulse')
  b && b.click()
})
await sleep(500)
await chrome(page)

// 1 — default: decisive 90’ goal with its mapped official clip (facade)
await shot(page, 'video-moments-390.png', 390)
await shot(page, 'video-moments-320.png', 320)
await shot(page, 'video-moments-desktop.png', 1024)

// 2 — an event with NO mapped clip (51’ · Cuti Romero) — discreet state
await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 })
for (let i = 0; i < 7; i++) {
  // one key per tick — each step must read the re-rendered cursor state
  await page.evaluate(() => {
    document.querySelector('.ov').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  })
  await sleep(140)
}
await chrome(page)
await shot(page, 'video-moments-noclip-390.png', 390)

await browser.close()
console.log('done →', OUT)
