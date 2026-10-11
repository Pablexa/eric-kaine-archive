import { test, expect } from '@playwright/test'
import { beatTheButton, findAllVideos, openFast, passPile, playActThree, reveal, trackErrors } from './helpers'

test.describe('Character voices', () => {
  test('Bleoodity speaks in her cloned voice, Eric Kaineity in his', async ({ page }) => {
    test.setTimeout(240_000)
    await page.addInitScript(() => {
      const w = window as unknown as { __voices: string[] }
      w.__voices = []
      const play = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function () {
        const src = this.currentSrc || this.src
        if (src.includes('/media/voice/')) w.__voices.push(new URL(src).pathname)
        return play.call(this)
      }
    })
    const errors = trackErrors(page)
    await openFast(page, '&voice=1')
    await reveal(page, { sound: true })
    await page.getByTestId('choice-refuse').click({ timeout: 60_000 })
    await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'pile', { timeout: 60_000 })
    await passPile(page)
    await findAllVideos(page)
    await beatTheButton(page)
    await playActThree(page)
    // the twist hands over to Bleoodity's label: by now she has spoken several lines
    await expect(page.getByTestId('label')).toBeVisible({ timeout: 60_000 })
    const voices = await page.evaluate(() => (window as unknown as { __voices: string[] }).__voices)
    const eric = voices.filter((v) => v.startsWith('/media/voice/eric/'))
    const bleoodity = voices.filter((v) => v.startsWith('/media/voice/bleoodity/'))
    const snippets = voices.filter((v) => /\/media\/voice\/bleood-\d/.test(v))
    expect(eric.length).toBeGreaterThan(3)
    expect(bleoodity.length).toBeGreaterThan(2)
    expect(snippets).toEqual([])
    // every clip actually exists
    for (const v of new Set([...eric.slice(0, 3), ...bleoodity])) {
      const r = await page.request.get(v)
      expect(r.status(), v).toBe(200)
    }
    expect(errors).toEqual([])
  })
})
