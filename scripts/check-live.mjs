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
  await visitor.getByTestId('call-answer').click()
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
