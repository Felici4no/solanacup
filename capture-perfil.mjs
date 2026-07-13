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
await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Perfil'); el && el.click() })
await sleep(500); await p.evaluate(() => { const s = document.createElement('style'); s.textContent = '.navbar{display:none!important}'; document.head.appendChild(s) }); await sleep(80)
await p.screenshot({ path: join(OUT, 'vez-perfil-full.png'), fullPage: true })
console.log('saved vez-perfil-full.png')
await b.close()
