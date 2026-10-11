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

  test('voiced lines wait for each other: no voice is cut off by the next line', async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript(() => {
      const w = window as unknown as { __voices: { src: string; cut: boolean; ended: boolean }[] }
      w.__voices = []
      const play = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function () {
        const src = this.currentSrc || this.src
        if (src.includes('/media/voice/')) {
          const rec = { src, cut: false, ended: false }
          w.__voices.push(rec)
          this.addEventListener('ended', () => { rec.ended = true }, { once: true })
          this.addEventListener('pause', () => { if (!this.ended) rec.cut = true }, { once: true })
        }
        return play.call(this)
      }
    })
    // fast pacing makes every hold tiny, so only waiting for the voice keeps lines apart
    await openFast(page, '&voice=1')
    await reveal(page, { sound: true })
    await page.waitForFunction(() => (window as unknown as { __voices: unknown[] }).__voices.length >= 4, null, { timeout: 60_000 })
    await sleep(2500)
    const voices = await page.evaluate(() => (window as unknown as { __voices: { cut: boolean; ended: boolean }[] }).__voices)
    expect(voices.filter((v) => v.cut)).toEqual([])
    expect(voices.filter((v) => v.ended).length).toBeGreaterThanOrEqual(3)
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
    // the intro is quiet; song 1 kicks in on "ok. then we do this the hard way." and the corner card names it
    const card = page.getByTestId('now-playing')
    await expect(card).toHaveCount(0)
    await page.getByTestId('choice-refuse').click({ timeout: 30_000 })
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('now-playing-title')).toHaveText('Reasons I Should Stay')
    await expect(page.getByTestId('now-playing-artist')).toHaveText('Jaydes')
    await expect(card.locator('img')).toHaveAttribute('src', '/media/covers/reasons.jpg')
    await expect.poll(() => card.locator('img').evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await expect(card).toContainText(/currently playing/i)
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    // muted: nothing is playing, so the card goes away
    await expect(card).toHaveCount(0, { timeout: 5_000 })
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
