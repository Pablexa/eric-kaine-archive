import { expect, test } from '@playwright/test'
import { beatTheButton, findAllVideos, openFast, passPile, playActFour, playActThree, reveal, sleep, toPile, trackErrors } from './helpers'

test.describe.configure({ timeout: 180_000 })

test.describe('Acts II–IV — protocols and endings', () => {
  test('main path: all eleven protocols → the takeover → One More Subscriber', async ({ page }) => {
    const errors = trackErrors(page)
    await openFast(page, '&media=1')
    await toPile(page)
    await expect(page.getByTestId('site-header')).toHaveAttribute('data-mode', 'hud')
    await passPile(page)

    await findAllVideos(page)
    await expect(page.getByTestId('hud-views')).toHaveText('70,082')

    await beatTheButton(page)
    await expect(page.getByTestId('hud-subs').locator('[aria-label]')).toHaveAttribute('aria-label', '1.5K+1', { timeout: 10_000 })
    await expect(page.getByTestId('broadcast')).toBeVisible({ timeout: 10_000 })

    await playActThree(page)
    await playActFour(page, { capture: true, media: true })

    const ending = page.getByTestId('ending')
    await expect(ending).toContainText('One More Subscriber', { timeout: 30_000 })
    await expect(page.getByTestId('subscribe-for-real')).toHaveAttribute('href', 'https://www.youtube.com/@eric2kaine?sub_confirmation=1')

    await page.getByTestId('back-to-archive').click()
    await expect(page.getByTestId('troll-stage')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByTestId('footer-endings')).toContainText('Endings found 1/3')
    // the hero is whole again, and every Act III crime has been undone
    expect(await page.locator('[data-physics]').evaluateAll((els) => els.filter((e) => (e as HTMLElement).style.visibility === 'hidden').length)).toBe(0)
    expect(await page.evaluate(() => [...document.documentElement.classList].filter((c) => c.startsWith('ug-')))).toEqual([])
    await expect(page.getByTestId('background-music')).toHaveCount(0)
    await expect(page.getByTestId('live-chat')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Eric Kaine', level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('cooperative path with reduced motion: redact → underground → Certified Gatekeeper', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors = trackErrors(page)
    await openFast(page)
    await reveal(page)
    await page.getByTestId('choice-help').click({ timeout: 30_000 })
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    for (let i = 0; i < 8; i++) {
      const t = page.locator('[data-redact]:not([data-redacted])').first()
      await t.scrollIntoViewIfNeeded()
      await t.click({ force: true })
      await sleep(120)
    }
    await playActThree(page)
    await playActFour(page)
    await expect(page.getByTestId('ending')).toContainText('Certified Gatekeeper', { timeout: 30_000 })
    await page.getByTestId('back-to-archive').click()
    await expect(page.locator('[data-redacted]')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('battery dies → Safely Obscure, and endings persist across reloads', async ({ page }) => {
    await openFast(page, '&drain=1')
    await toPile(page)
    await page.getByTestId('choice-skip').click({ timeout: 20_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'lights', { timeout: 20_000 })
    await page.getByTestId('choice-stop').click({ timeout: 30_000 })
    await expect(page.getByTestId('ending')).toContainText('Safely Obscure')
    await page.reload()
    await expect(page.getByTestId('footer-endings')).toContainText('Safely Obscure')
  })

  test('replay restarts the experience from the top', async ({ page }) => {
    await openFast(page, '&drain=1')
    await toPile(page)
    await page.getByTestId('choice-skip').click({ timeout: 20_000 })
    await page.getByTestId('choice-stop').click({ timeout: 30_000 })
    await page.getByTestId('replay').click()
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'intro', { timeout: 10_000 })
    await expect(page.getByTestId('chat-log')).toContainText('back again?')
  })

  test('the flashlight can be driven entirely with the arrow keys', async ({ page }) => {
    await openFast(page)
    await toPile(page)
    await page.getByTestId('choice-skip').click({ timeout: 20_000 })
    const tile = page.getByTestId('hidden-video').first()
    await expect(tile).toBeAttached({ timeout: 15_000 })
    await sleep(1200)
    const b = (await tile.boundingBox())!
    const dark = page.getByTestId('darkness')
    for (let i = 0; i < 80; i++) {
      const lx = Number(await dark.getAttribute('data-lx'))
      const ly = Number(await dark.getAttribute('data-ly'))
      const dx = b.x + b.width / 2 - lx
      const dy = b.y + b.height / 2 - ly
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) break
      await page.keyboard.press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : dy > 0 ? 'ArrowDown' : 'ArrowUp')
    }
    await expect(page.getByTestId('objective')).toContainText('1/5', { timeout: 5_000 })
  })

  test('leaving the takeover stops FM and restores every page change', async ({ page }) => {
    const errors = trackErrors(page)
    await openFast(page)
    await reveal(page)
    await page.getByTestId('choice-help').click({ timeout: 30_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'redact')
    for (let i = 0; i < 8; i++) {
      const target = page.locator('[data-redact]:not([data-redacted])').first()
      await target.scrollIntoViewIfNeeded()
      await target.click({ force: true })
      await sleep(120)
    }
    await playActThree(page)
    await expect(page.getByTestId('label')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('background-music')).toHaveAttribute('data-playing', 'true')
    // The loop has no pause, stop or mute control, and plays even though sound was declined.
    await expect(page.getByTestId('sound-toggle')).toHaveCount(0)
    await expect(page.getByTestId('volume')).toHaveCount(0)
    const audio = page.getByTestId('cheese-audio')
    expect(await audio.evaluate((el) => { const a = el as HTMLAudioElement; return { loop: a.loop, muted: a.muted, paused: a.paused, controls: a.controls } })).toEqual({ loop: true, muted: false, paused: false, controls: false })
    const t0 = await audio.evaluate((el) => (el as HTMLAudioElement).currentTime)
    await sleep(1200)
    expect(await audio.evaluate((el) => (el as HTMLAudioElement).currentTime)).not.toBe(t0)
    await page.getByTestId('leave').click()
    await expect(page.getByTestId('leave')).toContainText(/LEAVING|%|jk/)
    await expect(page.getByTestId('troll-stage')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByTestId('cheese-audio')).toHaveCount(0)
    expect(await page.evaluate(() => [...document.documentElement.classList].filter((c) => c.startsWith('ug-')))).toEqual([])
    await expect(page.getByTestId('ugly-widgets')).toHaveCount(0)
    await expect(page.getByTestId('live-chat')).toHaveCount(0)
    await expect(page.locator('[data-redacted]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
