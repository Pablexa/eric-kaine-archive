import { expect, test } from '@playwright/test'
import { trackErrors } from './helpers'

test.describe('Act I — the archive', () => {
  test('loads cleanly with the disclosure and real creator content', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Eric Kaine', level: 1 })).toBeVisible()
    await expect(page.getByTestId('disclosure')).toContainText('Not affiliated with')
    await expect(page.getByTestId('troll-stage')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    expect(errors).toEqual([])
  })

  test('navigation scrolls to every section', async ({ page }) => {
    await page.goto('/')
    for (const name of ['Archive', 'About', 'Links', 'Latest']) {
      await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name }).click()
      await expect(page.locator(`#${name.toLowerCase()}`)).toBeInViewport({ ratio: 0.2 })
    }
  })

  test('every media link points at a real YouTube video', async ({ page }) => {
    await page.goto('/')
    const hrefs = await page.locator('a[href*="youtube.com/watch"], a[href*="youtube.com/shorts"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))
    expect(hrefs.length).toBeGreaterThan(30)
    for (const h of hrefs) expect(h).toMatch(/^https:\/\/www\.youtube\.com\/(watch\?v=|shorts\/)[\w-]{11}$/)
  })

  test('thumbnails come from YouTube and actually load', async ({ page }) => {
    await page.goto('/')
    await page.locator('#latest').scrollIntoViewIfNeeded()
    const img = page.locator('#latest img').first()
    await expect(img).toHaveAttribute('src', /^https:\/\/i\.ytimg\.com\/vi\//)
    await expect.poll(() => img.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(300)
  })

  test('the featured player loads the privacy-enhanced embed on demand', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('iframe')).toHaveCount(0)
    await page.getByTestId('featured-play').click()
    await expect(page.locator('iframe[src*="youtube-nocookie.com/embed/m_3agIs-y-U"]')).toBeAttached()
  })

  test('archive filters count the real catalogue', async ({ page }) => {
    await page.goto('/')
    await page.locator('#archive').scrollIntoViewIfNeeded()
    const rows = page.getByTestId('archive-row')
    await expect(rows).toHaveCount(23)
    await page.getByTestId('filter-stream').click()
    await expect(rows).toHaveCount(14)
    await page.getByTestId('filter-short').click()
    await expect(rows).toHaveCount(3)
    await page.getByTestId('filter-video').click()
    await expect(rows).toHaveCount(6)
  })

  test('stream gallery arrows scroll the track', async ({ page }) => {
    await page.goto('/')
    await page.locator('#streams').scrollIntoViewIfNeeded()
    const track = page.getByTestId('streams-track')
    const before = await track.evaluate((t) => t.scrollLeft)
    await page.getByTestId('streams-next').click()
    await expect.poll(() => track.evaluate((t) => t.scrollLeft)).toBeGreaterThan(before + 100)
  })

  test('all verified social links are present and external', async ({ page }) => {
    await page.goto('/')
    for (const id of ['youtube', 'twitch', 'beats', 'soundcloud', 'instagram', 'x', 'discord']) {
      const link = page.getByTestId(`link-${id}`)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('href', /^https:\/\//)
    }
    await expect(page.getByTestId('header-youtube')).toHaveAttribute('href', 'https://www.youtube.com/@eric2kaine')
  })
})
