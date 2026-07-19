import puppeteer from 'puppeteer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screenshots')
const TAG = process.argv[2] || 'identity'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ headless: 'new', args: ['--force-color-profile=srgb'] })

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200)
  await page.screenshot({ path: join(OUT, `${TAG}-${name}.png`), fullPage: true })
  console.log('  ', `${TAG}-${name}.png`)
}
async function shotEl(page, sel, name) {
  const el = await page.$(sel)
  if (!el) { console.log('  !! missing', sel); return }
  await el.scrollIntoView(); await sleep(250)
  await el.screenshot({ path: join(OUT, `${TAG}-${name}.png`) })
  console.log('  ', `${TAG}-${name}.png`)
}
async function chrome(page) {
  await page.evaluate(() => { let s=document.getElementById('cap')||document.createElement('style'); s.id='cap'; s.textContent='.statepeek{display:none!important}'; document.head.appendChild(s) })
}
const click = async (p, t) => { await p.evaluate((x)=>{const el=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(x)||b.getAttribute('aria-label')===x); el&&el.click()}, t); await sleep(400) }
const clickSel = async (p,s,i=0) => { await p.evaluate((s,i)=>{const e=[...document.querySelectorAll(s)];e[i]&&e[i].click()},s,i); await sleep(450) }

for (const w of [320, 390]) {
  const page = await b.newPage()
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 2 })
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
  await page.goto('http://localhost:5181', { waitUntil: 'networkidle0' })
  await sleep(700); await chrome(page)

  // 1. Home — hero SplitCover + Coming Up rail + On This Day (full page)
  await shot(page, `home-${w}`)
  // 1b. Hero crests close-up (real club crests on the split cover)
  await shotEl(page, '.hero-cover', `hero-crests-${w}`)

  // 2. Match detail — story tab (hero crests), moments tab, match tab (24px TeamIcon in lineups)
  await clickSel(page, '.hero-cover .cover-tap')
  await sleep(500); await chrome(page)
  await shot(page, `story-${w}`)
  await clickSel(page, '.md-seg', 1)
  await sleep(300); await chrome(page)
  await shot(page, `moments-${w}`)
  await clickSel(page, '.md-seg', 2)
  await sleep(300); await chrome(page)
  await shot(page, `match-${w}`)

  // 3. Profile — clubs of the heart
  await click(page, 'Back')
  await click(page, 'Perfil')
  await sleep(400); await chrome(page)
  await shot(page, `profile-${w}`)

  await page.close()
}
await b.close()
console.log('done')
