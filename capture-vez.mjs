import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const URL = 'http://localhost:5180'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function css(page, text) {
  await page.evaluate((t) => {
    let s = document.getElementById('capstyle')
    if (!s) { s = document.createElement('style'); s.id = 'capstyle'; document.head.appendChild(s) }
    s.textContent = t
  }, text)
  await sleep(60)
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

  // 9:16 viewport shot — header, hero, CTA, fixed nav (statepeek hidden)
  await css(page, '.statepeek{display:none!important}')
  await page.screenshot({ path: join(OUT, 'vez-home-viewport.png') })
  console.log('  saved vez-home-viewport.png')

  // full page without nav overlay
  await css(page, '.statepeek{display:none!important}.navbar{display:none!important}')
  await page.screenshot({ path: join(OUT, 'vez-home-full.png'), fullPage: true })
  console.log('  saved vez-home-full.png')

  // scroll to the Coming Up rail with the nav visible
  await css(page, '.statepeek{display:none!important}')
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.section-head .label')].find((x) => x.textContent === 'Coming up')
    el && el.scrollIntoView({ block: 'start' })
    window.scrollBy(0, -70)
  })
  await sleep(300)
  await page.screenshot({ path: join(OUT, 'vez-coming-up.png') })
  console.log('  saved vez-coming-up.png')

  await browser.close()
  console.log('Done →', OUT)
}
run().catch((e) => { console.error(e); process.exit(1) })
