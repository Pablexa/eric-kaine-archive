import { expect, test } from '@playwright/test'
import { openFast, toPile } from './helpers'

test.use({ reducedMotion: 'reduce' })

test.describe('Reduced motion', () => {
  test('the collapse settles instantly instead of animating, and still restores', async ({ page }) => {
    await openFast(page)
    await toPile(page)
    // pieces exist and are already at rest
    const pieces = await page.getByTestId('pile-layer').evaluate((l) => l.children.length)
    expect(pieces).toBeGreaterThan(8)
    await page.getByTestId('leave').click()
    await expect(page.getByTestId('troll-stage')).toHaveCount(0, { timeout: 10_000 })
  })

  test('grain and marquees do not animate', async ({ page }) => {
    await page.goto('/')
    const dur = await page.locator('.grain').evaluate((g) => getComputedStyle(g).animationName)
    expect(dur).toBe('none')
  })
})
