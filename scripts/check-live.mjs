// End-to-end check of the live developer line against `wrangler dev`.
//
//   npm run build
//   npx wrangler dev --port 8787        (needs ADMIN_KEY in .dev.vars)
//   node scripts/check-live.mjs [--base=http://127.0.0.1:8787]
//
// Uses Chrome's fake microphone (a beeping tone) for both the owner and the
// visitor, and checks: visitor number, broadcast + targeted messages, ringing,
// answering, audio in both directions, hang-up, decline, ID persistence and a
// wrong admin key. Exits non-zero on the first failure.
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const base = (process.argv.find((a) => a.startsWith('--base=')) ?? '--base=http://127.0.0.1:8787').slice(7)
const key = /ADMIN_KEY=(.+)/.exec(readFileSync('.dev.vars', 'utf8'))?.[1]?.trim()
if (!key) throw new Error('ADMIN_KEY missing from .dev.vars')

const browser = await chromium.launch({
  channel: process.env.PW_CHANNEL ?? 'chrome',
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
})
const errors = []
const watch = (page, who) => {
  page.on('console', (m) => m.type() === 'error' && errors.push(`${who}: ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`${who}: ${e.message}`))
}
const step = (s) => console.log('✓', s)
const fail = (s) => {
  throw new Error(s)
}

try {
  const visitorCtx = await browser.newContext({ permissions: ['microphone'], viewport: { width: 1440, height: 900 } })
  const adminCtx = await browser.newContext({ permissions: ['microphone'], viewport: { width: 1280, height: 900 } })
  // Remember the ringtone element so the check can see it play and stop.
  await visitorCtx.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      if ((this.currentSrc || this.src).includes('/media/ringtone.mp3')) window.__ringtone = this
      return play.call(this)
    }
  })
  const visitor = await visitorCtx.newPage()
  const admin = await adminCtx.newPage()
  watch(visitor, 'visitor')
  watch(admin, 'admin')

  // visitor gets a number in the corner
  await visitor.goto(`${base}/?live=1`)
  const badge = visitor.getByTestId('live-id')
  await badge.waitFor({ timeout: 10_000 })
  const id = (await badge.innerText()).replace(/\D/g, '')
  if (!/^\d{5}$/.test(id)) fail(`bad visitor id: ${id}`)
  step(`visitor number shown: #${id}`)

  // wrong key is refused
  await admin.goto(`${base}/admin`)
  await admin.getByTestId('admin-key').fill('definitely-wrong-key')
  await admin.getByTestId('admin-login').click()
  await admin.getByText('Clave incorrecta.').waitFor({ timeout: 8000 })
  step('wrong admin key refused')

  // right key
  await admin.getByTestId('admin-key').fill(key)
  await admin.getByTestId('admin-login').click()
  await admin.getByTestId('admin-conn').filter({ hasText: 'conectado' }).waitFor({ timeout: 8000 })
  await admin.locator(`[data-testid=visitor-row][data-id="${id}"]`).waitFor({ timeout: 8000 })
  step('panel connected and lists the visitor')

  // broadcast message pops up on its own
  await admin.getByTestId('msg-text').fill('hello from the dev (broadcast)')
  await admin.getByTestId('msg-send').click()
  await visitor.getByTestId('dev-message').filter({ hasText: 'hello from the dev (broadcast)' }).waitFor({ timeout: 5000 })
  if (!/to everyone here/i.test(await visitor.getByTestId('dev-message').first().innerText())) fail('broadcast label missing')
  step('broadcast message appeared in real time')

  // targeted message
  await admin.getByTestId('call-target').fill(id)
  await admin.getByTestId('msg-to-one').click()
  await admin.getByTestId('msg-text').fill('only you can see this')
  await admin.getByTestId('msg-text').press('Enter')
  await visitor.getByTestId('dev-message').filter({ hasText: 'only you can see this' }).filter({ hasText: /to you/i }).waitFor({ timeout: 5000 })
  step('targeted message appeared (Enter to send)')

  // call → decline
  await admin.getByTestId('admin-call').click()
  await visitor.getByTestId('incoming-call').waitFor({ timeout: 8000 })
  await admin.locator('[data-testid=admin-call-status][data-phase=ringing]').waitFor({ timeout: 5000 })
  await visitor.getByTestId('call-decline').click()
  await admin.locator('[data-testid=admin-call-status][data-phase=declined]').waitFor({ timeout: 5000 })
  step('call rang and decline reached the panel')

  // call → answer
  await admin.getByTestId('admin-call').click()
  await visitor.getByTestId('incoming-call').waitFor({ timeout: 8000 })
  await visitor.waitForFunction(() => window.__ringtone && !window.__ringtone.paused && window.__ringtone.currentTime > 0, null, { timeout: 5000 })
    .catch(() => fail('ringtone.mp3 is not playing while the call rings'))
  step('ringtone.mp3 plays while the call rings')
  await visitor.getByTestId('call-answer').click()
  await visitor.waitForFunction(() => window.__ringtone?.paused === true, null, { timeout: 2000 })
    .catch(() => fail('ringtone kept playing after answering'))
  step('ringtone stops the moment the call is answered')
  await admin.locator('[data-testid=admin-call-status][data-phase=connected]').waitFor({ timeout: 5000 })
  await visitor.getByTestId('call-widget').waitFor({ timeout: 5000 })
  step('visitor answered; both sides connected')

  // owner → visitor audio
  await visitor.waitForTimeout(2500)
  const inFrames = Number(await visitor.getByTestId('call-bars').getAttribute('data-frames'))
  if (!(inFrames > 30)) fail(`visitor received too few audio frames: ${inFrames}`)
  step(`visitor is hearing the owner (${inFrames} frames in ~2.5 s, ~${Math.round(inFrames / 2.5)}/s)`)

  // visitor talks back → owner
  await visitor.getByTestId('call-mic').click()
  await visitor.getByTestId('call-mic').filter({ hasText: 'Mic on' }).waitFor({ timeout: 5000 })
  await admin.getByText('activó su micrófono').waitFor({ timeout: 5000 })
  await admin.waitForTimeout(2000)
  const backFrames = Number(await admin.getByTestId('meter-them').getAttribute('data-frames'))
  if (!(backFrames > 20)) fail(`owner received too few audio frames: ${backFrames}`)
  step(`owner is hearing the visitor (${backFrames} frames)`)

  // frames received over a window, to tell "audio flowing" from "silenced"
  const flow = async (page, read, ms = 1500) => {
    await page.waitForTimeout(400) // let in-flight frames land
    const a = await read()
    await page.waitForTimeout(ms)
    return (await read()) - a
  }
  const atOwner = () => admin.getByTestId('meter-them').getAttribute('data-frames').then(Number)
  const atVisitor = () => visitor.getByTestId('call-bars').getAttribute('data-frames').then(Number)

  // visitor mute / unmute
  await visitor.getByTestId('call-mute').click()
  await admin.getByText('Visitante (mic off)').waitFor({ timeout: 5000 })
  const mutedFlow = await flow(admin, atOwner)
  if (mutedFlow > 2) fail(`visitor muted but the owner still got ${mutedFlow} frames`)
  await visitor.getByTestId('call-mute').click()
  const unmutedFlow = await flow(admin, atOwner)
  if (!(unmutedFlow > 15)) fail(`visitor unmuted but the owner only got ${unmutedFlow} frames`)
  step(`visitor mute works (0 frames muted, ${unmutedFlow} after unmuting) and the panel shows "mic off"`)

  // owner mute / unmute
  await admin.getByTestId('admin-mute').click()
  const ownerMuted = await flow(visitor, atVisitor)
  if (ownerMuted > 2) fail(`owner muted but the visitor still got ${ownerMuted} frames`)
  await admin.getByTestId('admin-mute').click()
  const ownerBack = await flow(visitor, atVisitor)
  if (!(ownerBack > 15)) fail(`owner unmuted but the visitor only got ${ownerBack} frames`)
  step(`owner mute works (0 frames muted, ${ownerBack} after unmuting)`)

  // device pickers on both sides; switching the mic mid-call keeps audio flowing
  await visitor.getByTestId('call-audio').click()
  const vIn = visitor.getByTestId('call-input')
  await vIn.waitFor({ timeout: 3000 })
  const vInputs = await vIn.locator('option').evaluateAll((o) => o.map((x) => x.value).filter(Boolean))
  if (!vInputs.length) fail('visitor mic list is empty')
  await vIn.selectOption(vInputs[vInputs.length - 1])
  const afterSwitch = await flow(admin, atOwner)
  if (!(afterSwitch > 15)) fail(`visitor switched mic and the owner only got ${afterSwitch} frames`)
  const aIn = admin.getByTestId('admin-input')
  const aInputs = await aIn.locator('option').evaluateAll((o) => o.map((x) => x.value).filter(Boolean))
  if (!aInputs.length) fail('owner mic list is empty')
  await aIn.selectOption(aInputs[aInputs.length - 1])
  const ownerSwitch = await flow(visitor, atVisitor)
  if (!(ownerSwitch > 15)) fail(`owner switched mic and the visitor only got ${ownerSwitch} frames`)
  const outputs = await Promise.all([visitor, admin].map((p, i) => p.getByTestId(i ? 'admin-output' : 'call-output').count()))
  // call volumes: my mic level and how loud I hear the other person, on both sides
  const peak = async (page, read, ms = 1600) => {
    let p = 0
    const end = Date.now() + ms
    while (Date.now() < end) {
      p = Math.max(p, await read())
      await page.waitForTimeout(80)
    }
    return p
  }
  const ownerHears = () => admin.getByTestId('meter-them').getAttribute('data-level').then(Number)
  const visitorHears = () => visitor.getByTestId('call-bars').getAttribute('data-level').then(Number)
  const levelsOk = async (label, setter, read) => {
    await setter('0')
    await read.page.waitForTimeout(300)
    const quiet = await peak(read.page, read.fn)
    if (quiet > 0.01) fail(`${label} at 0 % but the level was still ${quiet}`)
    await setter('200')
    await read.page.waitForTimeout(300)
    const loud = await peak(read.page, read.fn)
    if (!(loud > 0.02)) fail(`${label} at 200 % but the level was only ${loud}`)
    await setter('100')
    return `${quiet.toFixed(3)} → ${loud.toFixed(3)}`
  }
  const a1 = await levelsOk('owner turned the visitor', (v) => admin.getByTestId('admin-peer-gain').fill(v), { page: admin, fn: ownerHears })
  const a2 = await levelsOk('visitor turned their own mic', (v) => visitor.getByTestId('call-mic-gain').fill(v), { page: admin, fn: ownerHears })
  const a3 = await levelsOk('visitor turned the owner', (v) => visitor.getByTestId('call-peer-gain').fill(v), { page: visitor, fn: visitorHears })
  const a4 = await levelsOk('owner turned their own mic', (v) => admin.getByTestId('admin-mic-gain').fill(v), { page: visitor, fn: visitorHears })
  step(`call volumes 0 % → 200 % work both ways: owner hears visitor ${a1}; visitor mic ${a2}; visitor hears owner ${a3}; owner mic ${a4}`)

  step(`mic pickers switch mid-call on both sides (${vInputs.length}/${aInputs.length} mics listed; output pickers: ${outputs.join('/')})`)

  // owner hangs up
  await admin.getByTestId('admin-hangup').click()
  await visitor.getByTestId('call-ended').filter({ hasText: 'The developer hung up' }).waitFor({ timeout: 5000 })
  await visitor.getByTestId('call-widget').waitFor({ state: 'detached', timeout: 5000 })
  step('owner hung up; visitor saw "The developer hung up"')

  // same number after a reload
  await visitor.reload()
  await visitor.getByTestId('live-id').filter({ hasText: id }).waitFor({ timeout: 10_000 })
  await admin.locator(`[data-testid=visitor-row][data-id="${id}"]`).waitFor({ timeout: 8000 })
  step('visitor keeps the same number after reload')

  // pick the session from the list and drive its volume from the panel
  await admin.locator(`[data-testid=visitor-row][data-id="${id}"] [data-testid=visitor-pick]`).click()
  await admin.getByTestId('session-card').getByText(`#${id}`).first().waitFor({ timeout: 3000 })
  if (await admin.getByTestId('session-call').isDisabled()) fail('session card cannot call the picked visitor')
  await admin.getByTestId('session-vol-zero').click()
  await admin.locator(`[data-testid=visitor-row][data-id="${id}"] [data-testid=visitor-volume]`).filter({ hasText: /^0 %$/ }).waitFor({ timeout: 5000 })
    .catch(() => fail('visitor did not report volume 0 after the panel set it'))
  const stored = await visitor.evaluate(() => JSON.parse(localStorage.getItem('ek-archive:sound') ?? '{}').volume)
  if (stored !== 0) fail(`visitor volume should be 0, got ${stored}`)
  await admin.getByTestId('session-vol-up').click()
  await admin.locator(`[data-testid=visitor-row][data-id="${id}"] [data-testid=visitor-volume]`).filter({ hasText: /^10 %$/ }).waitFor({ timeout: 5000 })
    .catch(() => fail('visitor did not report volume 10 after +10'))
  step('panel picks the session and sets its volume (0 %, then +10 → 10 %); the visitor applies and reports it')

  // offline target
  await admin.getByTestId('call-target').fill('10000')
  await admin.getByTestId('admin-call').click()
  await admin.locator('[data-testid=admin-call-status][data-phase=offline]').waitFor({ timeout: 8000 })
  step('calling an absent number reports "no está conectado"')

  await visitor.screenshot({ path: 'screenshots/80-live-visitor.png' }).catch(() => {})
  if (errors.length) fail(`console errors:\n${errors.join('\n')}`)
  step('no console errors on either page')
  console.log('\nLIVE LINE OK')
} finally {
  await browser.close()
}
