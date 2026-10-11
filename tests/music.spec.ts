import { test, expect, type Page } from '@playwright/test'
import { openFast, reveal } from './helpers'

/** Song 1 starts on "then we do this the hard way." */
async function toSongOne(page: Page) {
  await openFast(page)
  await reveal(page, { sound: true })
  await page.getByTestId('choice-refuse').click({ timeout: 30_000 })
  await expect(page.getByTestId('kaineity-audio')).toHaveCount(1, { timeout: 15_000 })
}
const playing = (page: Page) => page.getByTestId('kaineity-audio').evaluate((el) => !(el as HTMLAudioElement).paused)

test.describe('Music', () => {
  test('two open tabs never play over each other', async ({ context }) => {
    const a = await context.newPage()
    await toSongOne(a)
    await expect.poll(() => playing(a)).toBe(true)

    const b = await context.newPage()
    await toSongOne(b)
    await expect.poll(() => playing(b)).toBe(true)
    // the tab that started its music last wins; the other one goes quiet
    await expect.poll(() => playing(a), { timeout: 5_000 }).toBe(false)

    // tapping the quiet tab takes the music back
    await a.mouse.click(5, 300)
    await expect.poll(() => playing(a), { timeout: 5_000 }).toBe(true)
    await expect.poll(() => playing(b), { timeout: 5_000 }).toBe(false)
  })
})
