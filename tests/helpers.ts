import { expect, type Page } from '@playwright/test'

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Collect runtime errors so every test can assert the page stayed healthy. */
export function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push(m.text())
  })
  return errors
}

export const scene = (page: Page) => page.getByTestId('troll-stage').getAttribute('data-scene')

export async function openFast(page: Page, extra = '') {
  await page.goto(`/?fast=1${extra}`)
  await expect(page.getByTestId('site-header')).toBeVisible()
}

/** Reveal via the share button and answer the sound question. */
export async function reveal(page: Page, { sound = false }: { sound?: boolean } = {}) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await sleep(500)
  await page.getByTestId('share').click()
  await page.getByTestId(sound ? 'choice-on' : 'choice-off').click({ timeout: 20_000 })
}

export async function toPile(page: Page) {
  await reveal(page)
  await page.getByTestId('choice-refuse').click({ timeout: 30_000 })
  await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'pile', { timeout: 30_000 })
}

/** Grab the lowest released piece and fling it through Verity. */
export async function throwAtVerity(page: Page) {
  const v = await page.getByTestId('verity').boundingBox()
  const piece = await page.evaluate(() => {
    const p = (window as unknown as { __pile?: { pieces: { released: boolean; w: number; body: { position: { x: number; y: number } } }[] } }).__pile
    const c = p?.pieces.filter((x) => x.released && x.w < 320).sort((a, b) => b.body.position.y - a.body.position.y)[0]
    return c ? { x: c.body.position.x, y: c.body.position.y } : null
  })
  if (!v || !piece) return
  const vx = v.x + v.width / 2
  const vy = v.y + v.height / 2
  await page.mouse.move(piece.x, piece.y)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(piece.x + (vx - piece.x) * (i / 8), piece.y + (vy - piece.y) * (i / 8))
    await sleep(16)
  }
  await page.mouse.move(vx + (vx - piece.x) * 0.25, vy + (vy - piece.y) * 0.25)
  await page.mouse.up()
  await sleep(700)
}

export async function passPile(page: Page) {
  for (let i = 0; i < 8 && (await scene(page)) === 'pile'; i++) await throwAtVerity(page)
  if ((await scene(page)) === 'pile') await page.getByTestId('choice-skip').click({ timeout: 20_000 })
  await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'lights', { timeout: 20_000 })
}

/** Sweep the light over every hidden video. */
export async function findAllVideos(page: Page, input: 'mouse' | 'touch' = 'mouse') {
  await expect(page.getByTestId('hidden-video').first()).toBeAttached({ timeout: 15_000 })
  // the hunt only starts once Verity has finished explaining it
  await expect(page.getByTestId('objective')).toContainText('/5', { timeout: 30_000 })
  for (let i = 0; i < 12; i++) {
    const tiles = await page.getByTestId('hidden-video').all()
    if (!tiles.length) break
    const b = await tiles[0].boundingBox()
    if (!b) break
    const x = b.x + b.width / 2
    const y = b.y + b.height / 2
    if (input === 'touch') await page.touchscreen.tap(x, y)
    else await page.mouse.move(x, y, { steps: 5 })
    await sleep(1150)
  }
}

export async function beatTheButton(page: Page) {
  await expect(page.getByTestId('troll-stage')).toHaveAttribute('data-scene', 'button', { timeout: 20_000 })
  await expect(page.getByTestId('subscribe')).toBeVisible({ timeout: 15_000 })
  await sleep(800)
  for (let i = 0; i < 12; i++) {
    if ((await page.getByTestId('objective').textContent().catch(() => ''))?.includes('Verity')) break
    const b = await page.getByTestId('subscribe').boundingBox()
    if (!b) break
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 })
    await sleep(450)
  }
  await expect(page.getByTestId('objective')).toContainText('Get Verity off the button')
  await sleep(900)
  const v = (await page.getByTestId('verity').boundingBox())!
  await page.mouse.move(v.x + v.width / 2, v.y + v.height / 2)
  await page.mouse.down()
  await page.mouse.move(v.x + v.width / 2 - 420, v.y + v.height / 2 - 200, { steps: 12 })
  await page.mouse.up()
  await expect(page.getByTestId('decoy-real')).toBeVisible({ timeout: 20_000 })
  await sleep(2400)
  await page.getByTestId('decoy-real').click()
  await expect(page.getByTestId('decoy-real')).toHaveCount(0, { timeout: 10_000 })
  await sleep(1500)
  await page.getByTestId('subscribe').click()
}

/** Act III: uglify → popups → clones → beat → twist. */
export async function playActThree(page: Page) {
  // 04 uglify — the page is vandalised step by step, then asks for a rating
  await expect.poll(() => page.evaluate(() => document.documentElement.className), { timeout: 60_000 }).toContain('ug-font')
  await page.getByTestId('choice-hideous').click({ timeout: 90_000 })
  await expect.poll(() => page.evaluate(() => document.documentElement.className), { timeout: 20_000 }).toContain('ug-tilt')

  // 05 popups — close until it gives up
  await expect(page.getByTestId('popup').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('popup-scene')).toHaveAttribute('data-goal', '15')
  for (let i = 0; i < 60 && (await page.getByTestId('popup-scene').count()); i++) {
    const close = page.getByTestId('popup-close').last()
    if (await close.count()) await close.dispatchEvent('click', undefined, { timeout: 1000 }).catch(() => {})
    await sleep(80)
  }

  // 06 clones — Space pops one at random
  const clones = page.getByTestId('clones')
  await expect(clones).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('objective')).toContainText('Pop the clones', { timeout: 30_000 })
  await expect(clones).toHaveAttribute('data-left', '20')
  for (let i = 0; i < 25; i++) {
    if (!(await clones.count())) break
    const left = Number((await clones.getAttribute('data-left').catch(() => '0')) ?? '0')
    if (!left) break
    await page.keyboard.press('Space')
    await sleep(20)
  }

  // 07 the beat — play along, then survive the drop
  await expect(page.getByTestId('beat-scene')).toBeVisible({ timeout: 30_000 })
  await page.getByTestId('pad-kick-4').click()
  await expect(page.getByTestId('pad-kick-4')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('beat-scene')).toHaveAttribute('data-section', 'drop', { timeout: 60_000 })

  // 08 twist — the website is "deleted"
  await expect(page.getByTestId('not-found')).toBeVisible({ timeout: 60_000 })
}

/** Act IV is played through its real buttons, with no state-machine shortcuts. */
export async function playActFour(page: Page, { touch = false, capture = false } = {}) {
  const activate = async (id: string) => {
    const button = page.getByTestId(id)
    await expect(button).toBeEnabled({ timeout: 30_000 })
    if (touch) await button.tap({ force: true })
    else { await button.focus(); await page.keyboard.press('Enter') }
  }
  const shot = async (name: string) => {
    if (capture) await page.screenshot({ path: `screenshots/${touch ? '61-mobile' : '60'}-${name}.png` })
  }
  await expect(page.getByTestId('label')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('background-music')).toBeVisible()
  // the song only ever plays through YouTube's player (not loaded in fast mode)
  await expect(page.getByTestId('background-music')).toHaveAttribute('data-video-id', 'mPJhwEcj2g4')
  await expect(page.locator('audio')).toHaveCount(0)
  await expect.poll(() => page.getByTestId('label').locator('img').evaluateAll((imgs) => imgs.every((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0))).toBe(true)
  await expect(page.locator('html')).toHaveClass(/ug-vamp/)
  await expect(page.getByTestId('label-card-0')).toBeEnabled({ timeout: 30_000 })
  await shot('label')
  for (let i = 0; i < 8; i++) await activate(`label-card-${i}`)

  await expect(page.getByTestId('foodfight')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('feed-cheese')).toBeEnabled({ timeout: 30_000 })
  await sleep(300)
  await shot('foodfight')
  await activate('blast-food')
  const food = page.getByTestId('foodfight')
  for (let i = 0; i < 30 && (await food.count()) && Number(await food.getAttribute('data-fed').catch(() => '18')) < 18; i++) {
    await activate('feed-cheese').catch(() => {})
  }

  const brainrot = page.getByTestId('brainrot')
  await expect(brainrot).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('brainrot-video-0')).toHaveAttribute('data-video-id', 'i0M4ARe9v0Y')
  await expect(page.getByTestId('brainrot-video-1')).toHaveAttribute('data-video-id', 'ZtHCnXMjIXY')
  await activate('brainrot-meme')
  await expect(brainrot).toHaveAttribute('data-memes', '1')
  await activate('brainrot-add-pane')
  await expect(brainrot).toHaveAttribute('data-pane-count', '3')
  await shot('real-videos')
  await expect(brainrot).toHaveAttribute('data-section', 'quad', { timeout: 30_000 })
  await shot('maximum-brainrot')

  // 11 subway verity — switch lanes and jump with the real controls; the clock ends it
  const runner = page.getByTestId('runner')
  await expect(runner).toBeVisible({ timeout: 30_000 })
  await activate('runner-left')
  await expect(runner).toHaveAttribute('data-lane', '0')
  await activate('runner-right')
  await activate('runner-right')
  await expect(runner).toHaveAttribute('data-lane', '2')
  await activate('runner-jump')
  if (!touch) {
    await page.keyboard.press('ArrowLeft')
    await expect(runner).toHaveAttribute('data-lane', '1')
  }
  await shot('runner')

  const mosh = page.getByTestId('mosh')
  await expect(mosh).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('mosh-jump')).toBeEnabled({ timeout: 30_000 })
  await shot('mosh')
  for (let i = 0; i < 24 && Number((await mosh.getAttribute('data-jumps').catch(() => '12')) ?? '12') < 12; i++) {
    await activate('mosh-jump').catch(() => {})
    await sleep(100)
  }
  await expect(page.getByTestId('legend')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('legend-subs')).toHaveText('1.5B', { timeout: 15_000 })
  await expect(page.getByTestId('legend-bio')).toBeVisible({ timeout: 15_000 })
  await shot('legend')
  await expect(page.getByTestId('background-music')).toHaveCount(0)
  await expect(page.getByTestId('live-chat')).toHaveCount(0)
  await expect(page.getByTestId('ending')).toBeVisible({ timeout: 30_000 })
}
