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
      (x) => x.textContent.trim() === t || (x.getAttribute('aria-label') || '').includes(t),
    )
    b && b.click()
  }, text)
  await sleep(320)
}
async function clickAria(page, re) {
  await page.evaluate((rs) => {
    const rx = new RegExp(rs, 'i')
    const b = [...document.querySelectorAll('button')].find((x) => rx.test(x.getAttribute('aria-label') || ''))
    b && b.click()
  }, re)
  await sleep(320)
}
async function chrome(page, { peek = false } = {}) {
  await page.evaluate((showPeek) => {
    let s = document.getElementById('capstyle')
    if (!s) { s = document.createElement('style'); s.id = 'capstyle'; document.head.appendChild(s) }
    s.textContent = `.navbar{display:none!important}${showPeek ? '' : '.statepeek{display:none!important}'}`
  }, peek)
  await sleep(60)
}
async function shot(page, name, w) {
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 2 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(220)
  await page.screenshot({ path: join(OUT, name), fullPage: true })
  console.log('  saved', name, `(${w}px)`)
}

const run = async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 375, height: 900, deviceScaleFactor: 2 },
    args: ['--force-color-profile=srgb'],
  })
  const page = await browser.newPage()
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
  await page.goto(URL, { waitUntil: 'networkidle0' })
  await sleep(600)
  await clickText(page, 'Pulse') // open the Pulse tab
  await chrome(page)
  await sleep(300)

  await shot(page, 'pulse-320.png', 320)
  await shot(page, 'pulse-375.png', 375)
  await shot(page, 'pulse-430.png', 430)

  await page.setViewport({ width: 375, height: 900, deviceScaleFactor: 2 })
  await clickAria(page, '84th minute, goal by Luciano')
  await clickText(page, 'Annotate')
  await shot(page, 'pulse-annotate-375.png', 375)

  await clickAria(page, 'Sequence São Paulo pressure')
  await clickText(page, 'Community')
  await shot(page, 'pulse-sequence-375.png', 375)

  await chrome(page, { peek: true })
  await clickText(page, 'Live')
  await chrome(page)
  await shot(page, 'pulse-live-375.png', 375)

  await browser.close()
  console.log('Done →', OUT)
}
run().catch((e) => { console.error(e); process.exit(1) })
