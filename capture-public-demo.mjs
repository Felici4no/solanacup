/* Captures the public demo surfaces (/welcome, /u/demo, /chapters/:id).
   Run the dev server first (npx vite --port 5173), then:
   node capture-public-demo.mjs */
import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const URL = process.env.APP_URL || 'http://localhost:5173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()

async function shot(path, name, w) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 2 })
  await page.goto(`${URL}${path}`, { waitUntil: 'networkidle2' })
  await sleep(500)
  await page.screenshot({ path: join(OUT, name), fullPage: true })
  console.log('  saved', name, `(${w}px)`)
}

await shot('/welcome', 'welcome-390.png', 390)
await shot('/welcome', 'welcome-320.png', 320)
await shot('/u/demo', 'public-profile-390.png', 390)
await shot('/u/demo', 'public-profile-320.png', 320)
await shot('/chapters/ch-eng-arg-85', 'public-chapter-390.png', 390)

await browser.close()
console.log('done →', OUT)
