import { expect, test } from '@playwright/test'
import { openFast, reveal, sleep, toPile, trackErrors } from './helpers'

test.describe('Foreshadowing and the reveal', () => {
  test('reading the bio quote wakes Verity and docks her', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await page.getByTestId('bio-quote').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -100))
    await expect(page.getByTestId('understood')).toHaveText('understood.', { timeout: 10_000 })
    await expect(page.getByTestId('verity')).toHaveAttribute('data-mode', 'docked', { timeout: 10_000 })
    // the archive itself is still perfectly normal
    await expect(page.getByTestId('troll-stage')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('Eric Kaineity docks on his own without any scrolling', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByTestId('verity')).toHaveAttribute('data-mode', 'docked', { timeout: 6_000 })
    await expect(page.getByTestId('guide-photo')).toHaveAttribute('data-character', 'kaineity')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.getByTestId('verity').click()
    await expect(page.getByTestId('site-header')).toHaveAttribute('data-mode', 'hud')
    expect(errors).toEqual([])
  })

  test('clicking the docked guide starts the reveal; Leave restores the archive', async ({ page }) => {
    await openFast(page)
    await page.getByTestId('bio-quote').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('verity')).toHaveAttribute('data-mode', 'docked', { timeout: 10_000 })
    await page.getByTestId('verity').click()
    await expect(page.getByTestId('site-header')).toHaveAttribute('data-mode', 'hud')
    await expect(page.locator('html')).toHaveClass(/is-locked/)
    await page.getByTestId('leave').click()
    await expect(page.getByTestId('troll-stage')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByTestId('site-header')).toHaveAttribute('data-mode', 'nav')
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
  })

  test('the share button is intercepted', async ({ page }) => {
    await openFast(page)
    await reveal(page)
    await expect(page.getByTestId('chat-log')).toContainText('you were about to share him?')
    await expect(page.getByTestId('intro-card')).toContainText('please gatekeep me im not trying to be famous', { timeout: 15_000 })
  })

  test('three quick taps on the hero period is a hidden shortcut', async ({ page }) => {
    await openFast(page)
    await page.getByTestId('hero-period').click({ clickCount: 3 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'intro')
  })

  test('sound only starts after explicit permission and can be muted', async ({ page }) => {
    await openFast(page)
    await reveal(page, { sound: true })
    const toggle = page.getByTestId('sound-toggle')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('Escape leaves from the middle of the wreckage and the page reassembles', async ({ page }) => {
    await openFast(page)
    await toPile(page)
    expect(await page.locator('[data-physics]').evaluateAll((els) => els.filter((e) => (e as HTMLElement).style.visibility === 'hidden').length)).toBeGreaterThan(5)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('troll-stage')).toHaveCount(0, { timeout: 10_000 })
    await sleep(300)
    expect(await page.locator('[data-physics]').evaluateAll((els) => els.filter((e) => (e as HTMLElement).style.visibility === 'hidden').length)).toBe(0)
  })

  test('a refresh in the middle of the experience returns a clean archive', async ({ page }) => {
    await openFast(page)
    await toPile(page)
    await page.reload()
    await expect(page.getByTestId('troll-stage')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    await expect(page.getByRole('heading', { name: 'Eric Kaine', level: 1 })).toBeVisible()
  })
})
