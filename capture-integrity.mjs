import puppeteer from 'puppeteer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screenshots')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 393, height: 852, deviceScaleFactor: 2 }, args: ['--force-color-profile=srgb'] })
const p = await b.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }])
await p.evaluate(() => localStorage.clear()).catch(() => {})
await p.goto('http://localhost:5180', { waitUntil: 'networkidle0' })
await sleep(600)
const clickText = async (t) => { await p.evaluate((x) => { const el=[...document.querySelectorAll('button,a')].find(b=>b.textContent.trim()===x||b.getAttribute('aria-label')===x); el&&el.click() }, t); await sleep(400) }
const clickSel = async (s,i=0)=>{ await p.evaluate((s,i)=>{const e=[...document.querySelectorAll(s)];e[i]&&e[i].click()},s,i); await sleep(400) }
const css = async (t) => p.evaluate((t)=>{let s=document.getElementById('cap');if(!s){s=document.createElement('style');s.id='cap';document.head.appendChild(s)}s.textContent=t},t)
await css('.statepeek{display:none!important}')

// open the seeded hero match → SAVED status row (no "Add to Watchlist")
await clickSel('.hero-cover .cover-tap')
await sleep(400)
await css('.statepeek{display:none!important}.navbar{display:none!important}')
const savedRow = await p.evaluate(() => document.querySelector('.nav-row .nr-title')?.textContent)
const hasAdd = await p.evaluate(() => !![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add to Watchlist'))
await p.screenshot({ path: join(OUT, 'integrity-match-saved.png') })

// click the row → manage page
await clickSel('.nav-row')
await sleep(400)
const manage = await p.evaluate(() => !![...document.querySelectorAll('button')].find(b=>b.textContent.includes('Reminder')))
await p.screenshot({ path: join(OUT, 'integrity-watchlist-manage.png') })

// remove → not-saved state on the manage page
await clickText('Remove from Watchlist')
const nowAdd = await p.evaluate(() => !![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add to Watchlist'))
await p.screenshot({ path: join(OUT, 'integrity-match-notsaved.png') })

console.log(JSON.stringify({ savedRow, hasAdd, manage, nowAdd, errors }))
await b.close()
