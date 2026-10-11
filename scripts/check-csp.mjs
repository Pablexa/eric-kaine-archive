/**
 * Verifies the production CSP from public/_headers against the built site:
 * serves `vite preview`, injects the header on the document, plays through
 * the reveal and the collapse, and fails on any CSP violation.
 *
 *   npm run build && npm run preview   (in another terminal)
 *   node scripts/check-csp.mjs
 */
import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8')
const csp = headers.match(/Content-Security-Policy:\s*(.+)/)[1].trim()
const base = process.argv[2] ?? 'http://localhost:4173'

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const violations = []
page.on('console', (m) => {
  if (/Content Security Policy|Refused to/.test(m.text())) violations.push(m.text())
})
await page.route('**/*', async (route) => {
  // only the top-level document gets our header (not YouTube's iframe)
  if (route.request().resourceType() !== 'document' || route.request().frame() !== page.mainFrame()) return route.continue()
  const res = await route.fetch()
  await route.fulfill({ response: res, headers: { ...res.headers(), 'content-security-policy': csp } })
})

await page.goto(`${base}/?fast=1`)
await page.waitForTimeout(1200)
await page.locator('#latest').scrollIntoViewIfNeeded()
await page.getByTestId('featured-play').click()
await page.waitForTimeout(1500)
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
await page.waitForTimeout(500)
await page.getByTestId('share').click()
await page.getByTestId('sound-toggle').waitFor({ timeout: 20000 }) // sound is on by default
await page.getByTestId('choice-refuse').click({ timeout: 30000 })
await page.waitForSelector('[data-scene=pile]', { timeout: 30000 })
const thumbs = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth > 0).length)
await browser.close()

console.log(`images loaded: ${thumbs}`)
if (violations.length) {
  console.log('CSP violations:\n' + violations.join('\n'))
  process.exit(1)
}
console.log('CSP OK — no violations through reveal + collapse')
