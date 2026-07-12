import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const URL = 'http://localhost:5180'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function clickText(page, text) {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find(
      (x) => x.textContent.trim() === t || x.getAttribute('aria-label') === t,
    )
    if (b) { b.click(); return true }
    return false
  }, text)
  await sleep(360)
  return ok
}
async function clickSel(page, sel, idx = 0) {
  await page.evaluate((s, i) => {
    const els = [...document.querySelectorAll(s)]
    els[i] && els[i].click()
  }, sel, idx)
  await sleep(380)
}
async function chrome(page, { nav }) {
  await page.evaluate((showNav) => {
    let s = document.getElementById('capstyle')
    if (!s) { s = document.createElement('style'); s.id = 'capstyle'; document.head.appendChild(s) }
    s.textContent = `.statepeek{display:none!important}${showNav ? '' : '.tabbar{display:none!important}'}`
  }, nav)
  await sleep(60)
}
async function shot(page, name, { fullPage = true } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(150)
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

  console.log('HOME —')
  await clickText(page, 'Pre-match')
  await chrome(page, { nav: false })
  await shot(page, '01-home-pre-match.png')
  await clickText(page, 'I’m Watching')
  await shot(page, '02-home-memory-started.png')
  await clickText(page, 'Live'); await shot(page, '03-home-live.png')
  await clickText(page, 'Full time'); await shot(page, '04-home-full-time.png')
  await clickText(page, 'No match'); await shot(page, '05-home-no-match.png')
  await clickText(page, 'Pre-match')

  console.log('RADAR / SEARCH / PROFILE —')
  await clickText(page, 'radar'); await shot(page, '06-radar.png')
  await clickText(page, 'search'); await shot(page, '07-search.png')
  await clickText(page, 'profile'); await shot(page, '08-profile.png')

  console.log('NAV —')
  await clickText(page, 'home')
  await chrome(page, { nav: true })
  await shot(page, '09-navigation.png', { fullPage: false })
  await chrome(page, { nav: false })

  console.log('WATCHLIST —')
  await clickText(page, 'See all upcoming chapters →')
  await shot(page, '10-watchlist.png')
  await clickText(page, 'Back')

  console.log('MATCH DETAIL —')
  // open detail from the home hero cover
  await clickSel(page, '.hero-cover .cover-tap')
  await chrome(page, { nav: false })
  await shot(page, '11-detail-story.png')
  // rate the match → reveal distribution + community average
  await clickSel(page, '.rate-opt', 4)
  await shot(page, '12-detail-rated.png')
  // moments tab
  await clickText(page, 'MOMENTS'); await shot(page, '13-detail-moments.png')
  // match (official) tab
  await clickText(page, 'MATCH'); await shot(page, '14-detail-match.png')
  // live + full-time hero/connection states (story tab)
  await clickText(page, 'STORY')
  await clickText(page, 'Live'); await shot(page, '15-detail-live.png')
  await clickText(page, 'Full time'); await shot(page, '16-detail-fulltime.png')

  await browser.close()
  console.log('Done →', OUT)
}
run().catch((e) => { console.error(e); process.exit(1) })
