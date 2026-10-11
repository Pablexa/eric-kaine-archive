import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import { beatTheButton, findAllVideos, passPile, playActThree, reveal, trackErrors } from './helpers'

/**
 * The owner's live panel driving a visitor who is in Bleoodity's act: site
 * volume and music turn the Bleood loop down, and the voice level boosts
 * her lines. Needs the Worker (live line), so it only runs against
 * `wrangler dev`:  LIVE_BASE=http://127.0.0.1:8787 npx playwright test tests/live-act4.spec.ts
 */
const LIVE = process.env.LIVE_BASE

test.describe('Live panel in the Bleood act', () => {
  test.skip(!LIVE, 'needs LIVE_BASE (wrangler dev with ADMIN_KEY in .dev.vars)')

  test('music and voice levels reach the visitor', async ({ page, browser }) => {
    test.setTimeout(300_000)
    const key = /ADMIN_KEY=(.+)/.exec(readFileSync('.dev.vars', 'utf8'))?.[1]?.trim() ?? ''
    // record the gain of every voice line (what the owner's voice slider controls)
    await page.addInitScript(() => {
      const w = window as unknown as { __voiceGains: { src: string; gain: number }[] }
      w.__voiceGains = []
      const orig = AudioContext.prototype.createMediaElementSource
      AudioContext.prototype.createMediaElementSource = function (el) {
        const src = orig.call(this, el)
        const connect = src.connect.bind(src) as (d: AudioNode) => AudioNode
        ;(src as unknown as { connect: (d: AudioNode) => AudioNode }).connect = (dest: AudioNode) => {
          if (dest instanceof GainNode) w.__voiceGains.push({ src: new URL(el.src).pathname, gain: dest.gain.value })
          return connect(dest)
        }
        return src
      }
    })
    const errors = trackErrors(page)
    await page.goto(`${LIVE}/?fast=1&live=1&voice=1`)
    const id = (await page.getByTestId('live-id').innerText({ timeout: 15_000 })).replace(/\D/g, '')

    const admin: Page = await (await browser.newContext()).newPage()
    await admin.goto(`${LIVE}/admin`)
    await admin.getByTestId('admin-key').fill(key)
    await admin.getByTestId('admin-login').click()
    await expect(admin.getByTestId('admin-conn')).toHaveText(/conectado/, { timeout: 10_000 })

    await reveal(page, { sound: true })
    await page.getByTestId('choice-refuse').click({ timeout: 60_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'pile', { timeout: 60_000 })
    await passPile(page)
    await findAllVideos(page)
    await beatTheButton(page)
    await playActThree(page)
    await expect(page.getByTestId('label')).toBeVisible({ timeout: 60_000 })

    const loop = page.getByTestId('cheese-audio')
    const volume = () => loop.evaluate((el) => (el as HTMLAudioElement).volume)
    await expect.poll(volume).toBeGreaterThan(0.3)

    await admin.locator(`[data-testid=visitor-row][data-id="${id}"] [data-testid=visitor-pick]`).click()
    await expect(admin.getByTestId('session-card')).toContainText(`#${id}`)

    // music level → the Bleood loop follows it down to silence and back
    await admin.getByTestId('session-mix-music-slider').fill('0')
    await expect.poll(volume, { timeout: 8000 }).toBe(0)
    await admin.getByTestId('session-mix-music-slider').fill('100')
    await expect.poll(volume, { timeout: 8000 }).toBeGreaterThan(0.2)

    // the session's site volume also turns it down
    await admin.getByTestId('session-vol-zero').click()
    await expect.poll(volume, { timeout: 8000 }).toBe(0)
    await admin.getByTestId('session-vol-up').click()
    await expect.poll(volume, { timeout: 8000 }).toBeGreaterThan(0)

    // voice level 300 % → Bleoodity's next line is boosted
    await admin.getByTestId('session-mix-voice-slider').fill('300')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ek-archive:mix') ?? '{}').voice), { timeout: 8000 }).toBe(3)
    const before = await page.evaluate(() => (window as unknown as { __voiceGains: unknown[] }).__voiceGains.length)
    const boostedLines = () =>
      page.evaluate(
        (n) => (window as unknown as { __voiceGains: { src: string; gain: number }[] }).__voiceGains.slice(n).filter((g) => g.src.startsWith('/media/voice/bleoodity/') && g.gain === 3).length,
        before,
      )
    // signing a card makes her talk (a line is skipped if another one is still playing, so sign until one is heard)
    for (let i = 0; i < 8 && (await boostedLines()) === 0; i++) {
      await page.getByTestId(`label-card-${i}`).click()
      await page.waitForTimeout(2500)
    }
    expect(await boostedLines()).toBeGreaterThan(0)

    await admin.getByTestId('session-mix-reset').click()
    await admin.close()
    expect(errors).toEqual([])
  })
})
