import { expect, test } from '@playwright/test'
import { findAllVideos, openFast, playActFour, playActThree, reveal, sleep, trackErrors } from './helpers'

test.describe('Mobile', () => {
  test('menu opens, navigates and closes', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('menu-button').tap()
    const menu = page.getByTestId('mobile-menu')
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: /Archive/ }).tap()
    await expect(menu).toBeHidden()
    await expect(page.locator('#archive')).toBeInViewport({ ratio: 0.1 })
  })

  test('no horizontal overflow on the archive', async ({ page }) => {
    await page.goto('/')
    await sleep(1500)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('the initial troll scenes are playable with touch', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/?fast=1')
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await sleep(500)
    await page.getByTestId('share').tap()
    await page.getByTestId('choice-off').tap({ timeout: 20_000 })
    await page.getByTestId('choice-refuse').tap({ timeout: 30_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'pile', { timeout: 30_000 })
    await page.getByTestId('choice-skip').tap({ timeout: 20_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'lights', { timeout: 20_000 })
    await findAllVideos(page, 'touch')
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'button', { timeout: 20_000 })
    // tapping the dodging button makes it run; four taps summon the shield
    for (let i = 0; i < 6; i++) {
      if ((await page.getByTestId('objective').textContent().catch(() => ''))?.includes('Verity')) break
      await page.getByTestId('subscribe').tap({ force: true }).catch(() => {})
      await sleep(450)
    }
    await expect(page.getByTestId('objective')).toContainText('Get Verity off the button')
    await page.getByTestId('leave').tap()
    await expect(page.getByTestId('troll-stage')).toHaveCount(0, { timeout: 10_000 })
    expect(errors).toEqual([])
  })

  test('the underground takeover is playable on a phone', async ({ page }) => {
    test.setTimeout(180_000)
    const errors = trackErrors(page)
    await openFast(page)
    await reveal(page)
    await page.getByTestId('choice-help').tap({ timeout: 30_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'redact')
    await expect(page.getByTestId('troll-stage')).toHaveCSS('pointer-events', 'none')
    for (let i = 0; i < 8; i++) {
      const target = page.locator('[data-redact]:not([data-redacted]):visible').first()
      await target.scrollIntoViewIfNeeded()
      await target.tap()
      await expect(page.locator('[data-redacted]')).toHaveCount(i + 1)
    }
    await playActThree(page)
    await playActFour(page, { touch: true, capture: true })
    await expect(page.getByTestId('ending')).toContainText('Certified Gatekeeper')
    await page.getByTestId('back-to-archive').tap()
    await expect(page.getByTestId('troll-stage')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
