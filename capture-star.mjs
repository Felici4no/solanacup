import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const URL = 'http://localhost:5180'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function clickText(page, text) {
  await page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find(
      (x) => x.textContent.trim() === t || x.getAttribute('aria-label') === t,
    )
    b && b.click()
  }, text)
  await sleep(360)
}
async function clickSel(page, sel, idx = 0) {
  await page.evaluate((s, i) => { const e = [...document.querySelectorAll(s)]; e[i] && e[i].click() }, sel, idx)
  await sleep(360)
}
async function chrome(page) {
  await page.evaluate(() => {
    let s = document.getElementById('capstyle')
    if (!s) { s = document.createElement('style'); s.id = 'capstyle'; document.head.appendChild(s) }
    s.textContent = '.statepeek{display:none!important}.navbar{display:none!important}'
  })
  await sleep(60)
}
// click a star track (nth match) at a horizontal fraction → rating
async function rateStar(page, selector, nth, frac) {
  const boxes = await page.$$(selector)
  const box = await boxes[nth].boundingBox()
  const x = box.x + Math.min(0.995, frac) * box.width
  const y = box.y + box.height / 2
  await page.mouse.click(x, y)
  await sleep(400)
}
async function shot(page, name, { fullPage = true } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(160)
  await page.screenshot({ path: join(OUT, name), fullPage })
  console.log('  saved', name)
}

const run = async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 393, height: 852, deviceScaleFactor: 2 },
    args: ['--force-color-profile=srgb'],
  })
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(700)

  // open match detail from home hero
  await clickSel(page, '.hero-cover .cover-tap')
  await chrome(page)

  // 17 — match StarRange, unrated (community hidden)
  await shot(page, '17-rating-empty.png')

  // rate ~4.5 by clicking the star track
  await rateStar(page, '.star-track', 0, 0.9)
  await shot(page, '18-rating-revealed.png')

  // full-time → Complete Your Memory → inline editor
  await clickText(page, 'Full time')
  await clickText(page, 'Complete Your Memory')
  await shot(page, '19-editor-start.png')

  // rate the match inside the editor → progressive disclosure
  await rateStar(page, '.editor .star-track', 0, 0.99)
  await shot(page, '20-editor-expanded.png')

  // pick a favourite moment, rate its impact, place, company, note
  await clickSel(page, '.moment-chip', 0)
  await rateStar(page, '.moment-impact .star-track', 0, 0.95)
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.seg-chip')]
    const place = chips.find((c) => c.textContent.trim() === 'At the stadium')
    const comp = chips.find((c) => c.textContent.trim() === 'Family')
    place && place.click()
    comp && comp.click()
  })
  await sleep(200)
  const ta = await page.$('.editor textarea')
  await ta.click()
  await page.type('.editor textarea', 'I had never heard Morumbi that loud. My father just squeezed my shoulder.')
  await sleep(200)

  // save → completed artifact
  await clickText(page, 'Save Memory')
  await shot(page, '21-memory-completed.png')

  await browser.close()
  console.log('Done →', OUT)
}
run().catch((e) => { console.error(e); process.exit(1) })
