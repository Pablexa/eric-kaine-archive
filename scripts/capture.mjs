/**
 * Visual QA capture: drives the real experience in headless Chrome and saves
 * screenshots of every act to ./screenshots.
 *
 *   node scripts/capture.mjs [baseUrl] [--only=name,name]
 */
import { chromium, devices } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const base = process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:5173'
const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '').slice(7).split(',').filter(Boolean)
const out = new URL('../screenshots/', import.meta.url)
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
const shot = (page, name) => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, out)) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function toPile(page, fast = true) {
  await page.goto(`${base}/${fast ? '?fast=1' : ''}`)
  await sleep(1200)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await sleep(700)
  await page.getByTestId('share').click()
  await page.getByTestId('choice-off').click({ timeout: 20000 })
  await page.getByTestId('choice-refuse').click({ timeout: 40000 })
  await page.waitForSelector('[data-scene=pile]', { timeout: 40000 })
}

async function throwAtVerity(page) {
  const v = await page.getByTestId('verity').boundingBox()
  const piece = await page.evaluate(() => {
    const p = window.__pile
    const cand = p.pieces.filter((x) => x.released && x.w < 320).sort((a, b) => b.body.position.y - a.body.position.y)[0]
    return cand ? { x: cand.body.position.x, y: cand.body.position.y } : null
  })
  if (!v || !piece) return false
  const vx = v.x + v.width / 2
  const vy = v.y + v.height / 2
  await page.mouse.move(piece.x, piece.y)
  await page.mouse.down()
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(piece.x + (vx - piece.x) * (i / steps), piece.y + (vy - piece.y) * (i / steps))
    await sleep(16)
  }
  await page.mouse.move(vx + (vx - piece.x) * 0.25, vy + (vy - piece.y) * 0.25)
  await page.mouse.up()
  await sleep(700)
  return true
}

async function playLights(page, prefix) {
  await page.waitForSelector('[data-scene=lights]', { timeout: 30000 })
  await page.waitForSelector('[data-testid=hidden-video]', { timeout: 10000 })
  // the hunt only starts once Verity has finished explaining it
  await page.waitForFunction(() => document.querySelector('[data-testid=objective]')?.textContent?.includes('/5'), null, { timeout: 30000 })
  await sleep(300)
  let first = true
  for (let i = 0; i < 12; i++) {
    const tiles = await page.locator('[data-testid=hidden-video]').all()
    if (!tiles.length) break
    const b = await tiles[0].boundingBox()
    if (!b) break
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 })
    if (first && prefix) {
      await sleep(450)
      await shot(page, `${prefix}-lights-searching`)
      first = false
    }
    await sleep(1100)
  }
}

async function playButton(page, prefix) {
  await page.waitForSelector('[data-scene=button]', { timeout: 30000 })
  await page.waitForSelector('[data-testid=subscribe]', { timeout: 20000 })
  await sleep(900)
  if (prefix) await shot(page, `${prefix}-button`)
  // chase it until Verity shields it
  for (let i = 0; i < 10; i++) {
    const b = await page.getByTestId('subscribe').boundingBox()
    if (!b) break
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 })
    await sleep(500)
    const shieldUp = await page.getByTestId('objective').textContent().catch(() => '')
    if (shieldUp?.includes('Verity')) break
  }
  await sleep(1200)
  if (prefix) await shot(page, `${prefix}-shield`)
  // drag Verity off the button
  const v = await page.getByTestId('verity').boundingBox()
  await page.mouse.move(v.x + v.width / 2, v.y + v.height / 2)
  await page.mouse.down()
  await page.mouse.move(v.x + v.width / 2 - 420, v.y + v.height / 2 - 220, { steps: 12 })
  await page.mouse.up()
  await page.waitForSelector('[data-testid=decoy-real]', { timeout: 20000 })
  await sleep(2600)
  if (prefix) await shot(page, `${prefix}-shell-game`)
  const decoy = page.getByTestId('decoy').first()
  if (await decoy.count()) await decoy.click()
  await sleep(1400)
  await page.getByTestId('decoy-real').click()
  await sleep(3500)
  if (prefix) await shot(page, `${prefix}-calm`)
  await page.getByTestId('subscribe').click()
}

async function playActThree(page, prefix, { fast = true } = {}) {
  // 04 uglify
  await page.waitForSelector('[data-scene=uglify], [data-testid=ugly-widgets]', { timeout: 60000 }).catch(() => {})
  await page.waitForFunction(() => document.documentElement.classList.contains('ug-borders'), null, { timeout: 60000 })
  if (prefix) await shot(page, `${prefix}-uglify`)
  await page.getByTestId('choice-hideous').click({ timeout: 90000 })
  await sleep(fast ? 800 : 2500)
  if (prefix) await shot(page, `${prefix}-uglify-tilt`)
  // 05 popups
  await page.waitForSelector('[data-testid=popup]', { timeout: 60000 })
  await sleep(fast ? 1500 : 3000)
  if (prefix) await shot(page, `${prefix}-popups-early`)
  for (let i = 0; i < 40; i++) {
    const closeBtn = page.getByTestId('popup-close').last()
    if (!(await closeBtn.count())) {
      await sleep(200)
      if ((await page.getByTestId('popup-scene').count()) === 0) break
      continue
    }
    await closeBtn.dispatchEvent('click').catch(() => {})
    await sleep(fast ? 90 : 260)
    if (i === 14 && prefix) await shot(page, `${prefix}-popups-hell`)
    if ((await page.getByTestId('popup-scene').count()) === 0) break
    const obj = await page.getByTestId('objective').textContent().catch(() => '')
    if (!obj?.includes('popups')) break
  }
  // 06 clones
  await page.waitForSelector('[data-testid=clones]', { timeout: 60000 })
  await page.waitForFunction(() => document.querySelector('[data-testid=objective]')?.textContent?.includes('Pop the clones'), null, { timeout: 60000 })
  await sleep(600)
  if (prefix) await shot(page, `${prefix}-clones`)
  for (let i = 0; i < 80; i++) {
    const left = Number(await page.getByTestId('clones').getAttribute('data-left').catch(() => '0'))
    if (!left) break
    await page.keyboard.press('Space')
    await sleep(fast ? 25 : 60)
  }
  // 07 the beat
  await page.waitForSelector('[data-testid=beat-scene]', { timeout: 60000 })
  await sleep(fast ? 1200 : 3000)
  await page.getByTestId('pad-kick-4').click().catch(() => {})
  if (prefix) await shot(page, `${prefix}-beat`)
  await page.waitForSelector('[data-section=drop]', { timeout: 90000 })
  await sleep(fast ? 1600 : 4500)
  if (prefix) await shot(page, `${prefix}-drop`)
  // 08 twist
  await page.waitForSelector('[data-scene=twist]', { timeout: 90000 })
  if (!fast) {
    await sleep(9000)
    if (prefix) await shot(page, `${prefix}-bleoodity`)
  }
  await page.waitForSelector('[data-testid=not-found]', { timeout: 60000 })
  await sleep(fast ? 300 : 1500)
  if (prefix) await shot(page, `${prefix}-not-found`)
}

async function playCooperative(page) {
  await page.goto(`${base}/?fast=1`)
  await page.getByTestId('hero-period').click({ clickCount: 3 })
  await page.getByTestId('choice-off').click({ timeout: 20000 })
  await page.getByTestId('choice-help').click({ timeout: 40000 })
  await page.waitForSelector('[data-scene=redact]', { timeout: 20000 })
  for (let i = 0; i < 8; i++) {
    const target = page.locator('[data-redact]:not([data-redacted]):visible').first()
    await target.scrollIntoViewIfNeeded()
    await target.click({ force: true })
    await sleep(100)
  }
}

/** Drive Act IV through its accessible controls, preserving actual scene pacing. */
async function playActFour(page, prefix, { fast = true } = {}) {
  const activate = async (id) => {
    await page.waitForSelector(`[data-testid="${id}"]:not(:disabled)`, { timeout: 30000 })
    await page.getByTestId(id).focus()
    await page.keyboard.press('Enter')
  }
  await page.waitForSelector('[data-testid=label]', { timeout: 60000 })
  await sleep(fast ? 200 : 800)
  if (prefix) await shot(page, `${prefix}-label`)
  for (let i = 0; i < 8; i++) await activate(`label-card-${i}`)

  await page.waitForSelector('[data-testid=foodfight]', { timeout: 30000 })
  await sleep(fast ? 350 : 1200)
  if (prefix) await shot(page, `${prefix}-foodfight`)
  for (let i = 0; i < 18; i++) await activate('feed-cheese')

  await page.waitForSelector('[data-testid=brainrot]', { timeout: 30000 })
  await activate('runner-right')
  await activate('runner-left')
  await activate('runner-jump')
  if (prefix) await shot(page, `${prefix}-runner`)
  await page.waitForSelector('[data-testid=brainrot][data-section=quad]', { timeout: 60000 })
  if (prefix) await shot(page, `${prefix}-quad`)

  await page.waitForSelector('[data-testid=mosh][data-ready=true]', { timeout: 30000 })
  if (prefix) await shot(page, `${prefix}-mosh`)
  for (let i = 0; i < 12; i++) { await activate('mosh-jump'); await sleep(fast ? 100 : 180) }
  await page.waitForSelector('[data-testid=legend]', { timeout: 30000 })
  await page.waitForFunction(() => document.querySelector('[data-testid=legend-subs]')?.textContent === '1.5B', null, { timeout: 30000 })
  if (prefix) await shot(page, `${prefix}-legend`)
  await page.waitForSelector('[data-testid=ending]', { timeout: 60000 })
}

const jobs = {
  /** The entire underground takeover, including the phone layout. */
  async act4desktop() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.log('pageerror:', e.message))
    await playCooperative(page)
    await playActThree(page)
    await playActFour(page, '60-desktop')
    await shot(page, '60-desktop-ending')
    console.log('  desktop act4 complete')
    await ctx.close()
  },
  async act4mobile() {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.log('pageerror:', e.message))
    await playCooperative(page)
    await playActThree(page)
    await playActFour(page, '61-mobile')
    await shot(page, '61-mobile-ending')
    console.log('  mobile act4 complete')
    await ctx.close()
  },
  /** Act III on a phone. */
  async act3mobile() {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.log('pageerror:', e.message))
    await page.goto(`${base}/?fast=1`)
    await sleep(1000)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await sleep(600)
    await page.getByTestId('share').tap()
    await page.getByTestId('choice-off').tap({ timeout: 20000 })
    await page.getByTestId('choice-help').tap({ timeout: 40000 })
    await sleep(800)
    for (let i = 0; i < 8; i++) {
      const t = page.locator('[data-redact]:not([data-redacted]):visible').first()
      await t.scrollIntoViewIfNeeded()
      await t.click({ force: true })
      await sleep(150)
    }
    await page.waitForFunction(() => document.documentElement.classList.contains('ug-borders'), null, { timeout: 60000 })
    await sleep(800)
    await shot(page, '50-mobile-uglify')
    await page.getByTestId('choice-hideous').tap({ timeout: 90000 })
    await page.waitForSelector('[data-testid=popup]', { timeout: 60000 })
    await sleep(2500)
    await shot(page, '51-mobile-popups')
    for (let i = 0; i < 60 && (await page.getByTestId('popup-scene').count()); i++) {
      const c = page.getByTestId('popup-close').last()
      if (await c.count()) await c.dispatchEvent('click').catch(() => {})
      await sleep(80)
    }
    await page.waitForFunction(() => document.querySelector('[data-testid=objective]')?.textContent?.includes('Pop the clones'), null, { timeout: 60000 })
    await sleep(500)
    await shot(page, '52-mobile-clones')
    for (let i = 0; i < 90; i++) {
      const left = Number(await page.getByTestId('clones').getAttribute('data-left').catch(() => '0'))
      if (!left) break
      await page.keyboard.press('Space')
      await sleep(20)
    }
    await page.waitForSelector('[data-testid=beat-scene]', { timeout: 60000 })
    await sleep(1500)
    await shot(page, '53-mobile-beat')
    await playActFour(page, '54-mobile')
    await page.waitForSelector('[data-testid=ending]', { timeout: 90000 })
    await sleep(800)
    await shot(page, '54-mobile-ending')
    console.log('  mobile act3 complete')
    await ctx.close()
  },
  /** Act III only, at fast pacing, with screenshots. */
  async act3() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.log('pageerror:', e.message))
    page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()))
    await toPile(page)
    await page.getByTestId('choice-skip').click({ timeout: 40000 })
    await playLights(page)
    await playButton(page)
    await playActThree(page, '30')
    await playActFour(page, '31')
    await page.waitForSelector('[data-testid=ending]', { timeout: 60000 })
    await sleep(800)
    await shot(page, '39-ending')
    console.log('  act3 complete')
    await ctx.close()
  },
  /** The main path at real visitor pacing (no ?fast). */
  async realtime() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    const t0 = Date.now()
    await page.goto(base)
    await sleep(1200)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await sleep(700)
    await page.getByTestId('share').click()
    await page.getByTestId('choice-on').click({ timeout: 30000 })
    await page.getByTestId('choice-refuse').click({ timeout: 60000 })
    await page.waitForSelector('[data-scene=pile]', { timeout: 60000 })
    console.log('  pile at', ((Date.now() - t0) / 1000).toFixed(1), 's')
    await page.evaluate(() => (window.__pile = window.__pile))
    for (let i = 0; i < 8; i++) {
      await throwAtVerity(page).catch(() => {})
      if ((await page.getByTestId('troll-stage').getAttribute('data-scene')) !== 'pile') break
    }
    if ((await page.getByTestId('troll-stage').getAttribute('data-scene')) === 'pile') await page.getByTestId('choice-skip').click({ timeout: 40000 })
    await playLights(page)
    console.log('  button at', ((Date.now() - t0) / 1000).toFixed(1), 's')
    await playButton(page)
    await page.waitForSelector('[data-testid=broadcast]', { timeout: 20000 })
    await sleep(2500)
    await shot(page, '13b-meltdown-realtime')
    console.log('  act III at', ((Date.now() - t0) / 1000).toFixed(1), 's')
    await playActThree(page, '40', { fast: false })
    await playActFour(page, '41', { fast: false })
    await page.waitForSelector('[data-testid=ending]', { timeout: 90000 })
    console.log('  ending at', ((Date.now() - t0) / 1000).toFixed(1), 's; errors:', errors.length ? errors : 'none')
    await ctx.close()
  },
  async full() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()))
    page.on('pageerror', (e) => console.log('pageerror:', e.message))
    await toPile(page)
    for (let i = 0; i < 6; i++) {
      await throwAtVerity(page)
      if ((await page.getByTestId('troll-stage').getAttribute('data-scene')) !== 'pile') break
    }
    await playLights(page, '11')
    await playButton(page, '12')
    await page.waitForSelector('[data-testid=broadcast]', { timeout: 15000 })
    await sleep(650)
    await shot(page, '13-meltdown')
    await page.waitForSelector('[data-testid=broadcast]', { state: 'detached', timeout: 15000 })
    await sleep(500)
    await shot(page, '14-rebuild')
    await playActThree(page, '14-act3')
    await playActFour(page, '14-act4')
    await page.waitForSelector('[data-testid=ending]', { timeout: 40000 })
    await sleep(1200)
    await shot(page, '15-ending')
    await page.getByTestId('back-to-archive').click()
    await sleep(2500)
    await shot(page, '16-after')
    await ctx.close()
  },
  async redact() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(`${base}/?fast=1`)
    await sleep(1000)
    await page.getByTestId('hero-period').click({ clickCount: 3 })
    await page.getByTestId('choice-off').click({ timeout: 20000 })
    await page.getByTestId('choice-help').click({ timeout: 40000 })
    await sleep(1500)
    const targets = page.locator('[data-redact]:not([data-redacted])')
    for (let i = 0; i < 8; i++) {
      const t = targets.nth(0)
      await t.scrollIntoViewIfNeeded()
      await t.click({ force: true })
      await sleep(250)
      if (i === 4) await shot(page, '17-redacting')
    }
    await playActThree(page, '17-act3')
    await playActFour(page, '17-act4')
    await page.waitForSelector('[data-testid=ending]', { timeout: 20000 })
    await sleep(1000)
    await shot(page, '18-ending-gatekeeper')
    await ctx.close()
  },
  async mobile() {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(base)
    await sleep(2600)
    await shot(page, '20-mobile-hero')
    await page.getByTestId('menu-button').click()
    await sleep(900)
    await shot(page, '21-mobile-menu')
    await page.getByRole('button', { name: 'Close menu' }).click()
    await sleep(600)
    await page.evaluate(() => document.getElementById('latest').scrollIntoView())
    await sleep(1500)
    await shot(page, '22-mobile-latest')
    await page.evaluate(() => document.getElementById('archive').scrollIntoView())
    await sleep(1500)
    await shot(page, '23-mobile-archive')
    await page.goto(`${base}/?fast=1`)
    await sleep(1000)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await sleep(800)
    await page.getByTestId('share').tap()
    await page.getByTestId('choice-off').tap({ timeout: 20000 })
    await page.getByTestId('choice-refuse').tap({ timeout: 40000 })
    await page.waitForSelector('[data-scene=pile]', { timeout: 40000 })
    await sleep(1200)
    await shot(page, '24-mobile-pile')
    await page.getByRole('button', { name: 'Skip to protocol 02' }).tap({ timeout: 20000 })
    await page.waitForSelector('[data-scene=lights]', { timeout: 30000 })
    await sleep(2500)
    await shot(page, '25-mobile-lights')
    await playLights(page)
    await playButton(page)
    await playActThree(page, '25-mobile-act3')
    await playActFour(page, '25-mobile-act4')
    await shot(page, '25-mobile-ending')
    await ctx.close()
  },
  async tablet() {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(base)
    await sleep(2600)
    await shot(page, '26-tablet-hero')
    await page.evaluate(() => document.getElementById('latest').scrollIntoView())
    await sleep(1600)
    await shot(page, '27-tablet-latest')
    await ctx.close()
  },
  async wide() {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(base)
    await sleep(2600)
    await shot(page, '28-hero-1920')
    await ctx.close()
  },
  async desktop() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(base)
    await sleep(2600)
    await shot(page, '01-hero-1440')
    await page.evaluate(() => document.getElementById('latest').scrollIntoView())
    await sleep(1800)
    await shot(page, '02-latest-1440')
    await page.evaluate(() => document.getElementById('streams').scrollIntoView())
    await sleep(1800)
    await shot(page, '03-streams-1440')
    const q = page.getByTestId('bio-quote')
    await q.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -120))
    await sleep(1600)
    await shot(page, '04-first-anomaly-1440')
    await sleep(3000)
    await shot(page, '05-verity-docked-1440')
    await page.evaluate(() => document.getElementById('archive').scrollIntoView())
    await sleep(1500)
    await page.mouse.move(400, 520)
    await sleep(600)
    await shot(page, '06-archive-1440')
    await ctx.close()
  },
  async reveal() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    await page.goto(base)
    await sleep(1200)
    const q = page.getByTestId('bio-quote')
    await q.scrollIntoViewIfNeeded()
    await sleep(6000)
    await page.getByTestId('verity').click()
    await sleep(2600)
    await shot(page, '07-reveal-1440')
    await page.getByTestId('choice-on').click({ timeout: 20000 })
    await sleep(5200)
    await shot(page, '08-exhibit-a-1440')
    await page.getByTestId('choice-refuse').click({ timeout: 40000 })
    await sleep(4600)
    await shot(page, '09-collapse-mid-1440')
    await page.waitForSelector('[data-scene=pile]', { timeout: 30000 })
    await sleep(1200)
    await shot(page, '10-pile-1440')
    await ctx.close()
  },
  async hits() {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const page = await ctx.newPage()
    page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()))
    await toPile(page)
    for (let i = 0; i < 8; i++) {
      await throwAtVerity(page)
      const scene = await page.getByTestId('troll-stage').getAttribute('data-scene')
      const mood = await page.getByTestId('verity').getAttribute('data-mood')
      const last = await page.evaluate(() => [...document.querySelectorAll('[data-testid=chat-log] li')].slice(-1).map((l) => l.textContent)[0])
      console.log('throw', i, scene, mood, last)
      if (scene !== 'pile') break
    }
    await sleep(2500)
    await shot(page, '11-lights-1440')
    await ctx.close()
  },
}

for (const [name, fn] of Object.entries(jobs)) {
  if (only.length && !only.includes(name)) continue
  console.log('▶', name)
  try {
    await fn()
  } catch (e) {
    console.log('✖', name, e.message)
    process.exitCode = 1
  }
}
await browser.close()
