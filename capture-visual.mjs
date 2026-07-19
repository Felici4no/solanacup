import puppeteer from 'puppeteer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screenshots')
const TAG = process.argv[2] || 'before'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ headless: 'new', args: ['--force-color-profile=srgb'] })

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(200)
  await page.screenshot({ path: join(OUT, `${TAG}-${name}.png`), fullPage: true })
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
  await shot(page, `home-${w}`)

  // Story tab of Match Detail (default tab), pre state
  await clickSel(page, '.hero-cover .cover-tap')
  await sleep(500); await chrome(page)
  await shot(page, `story-${w}`)

  // Story, post state with the memory editor open
  await click(page, 'Full time')
  await click(page, 'Complete Your Memory')
  // exercise the editor so the disclosed steps + feedback are visible
  await page.evaluate(() => { const s = document.querySelector('.editor .star-track'); if (s) { s.focus(); s.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })) } })
  await sleep(400)
  await clickSel(page, '.moment-chip', 0)
  await page.evaluate(() => { const c=[...document.querySelectorAll('.seg-chip')]; const a=c.find(x=>x.textContent.trim()==='At the stadium'); const f=c.find(x=>x.textContent.trim()==='Family'); a&&a.click(); f&&f.click() })
  await sleep(400); await chrome(page)
  await shot(page, `story-editor-${w}`)
  await page.close()
}
await b.close()
console.log('done')
