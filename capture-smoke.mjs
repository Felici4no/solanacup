import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, 'screenshots')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 393, height: 852, deviceScaleFactor: 2 }, args: ['--force-color-profile=srgb'] })
const p = await b.newPage()
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
await p.goto('http://localhost:5180', { waitUntil: 'networkidle0' })
await sleep(600)
const tab = async (label) => { await p.evaluate((l) => { const el = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === l); el && el.click() }, label); await sleep(500) }
const hideNav = () => p.evaluate(() => { const s = document.createElement('style'); s.textContent = '.navbar{display:none!important}'; document.head.appendChild(s) })
// Perfil — club cards
await tab('Perfil'); await hideNav(); await sleep(120)
await p.evaluate(() => { const el = [...document.querySelectorAll('.label')].find(x => x.textContent === 'Clubes do coração'); el && el.scrollIntoView({ block: 'center' }) })
await sleep(200)
await p.screenshot({ path: join(OUT, 'vez-clubes-smoke.png') })
console.log('saved vez-clubes-smoke.png')
// Archive — Hall of Memories posters (matchups)
await tab('Archive'); await sleep(400)
await p.evaluate(() => { const s = document.createElement('style'); s.textContent = '.navbar{display:none!important}'; document.head.appendChild(s) })
await p.evaluate(() => { const el = [...document.querySelectorAll('.label')].find(x => x.textContent === 'Hall of Memories'); el && el.scrollIntoView({ block: 'start' }); window.scrollBy(0,-70) })
await sleep(200)
await p.screenshot({ path: join(OUT, 'vez-archive-smoke.png') })
console.log('saved vez-archive-smoke.png')
await b.close()
