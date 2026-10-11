import { defineConfig, devices } from '@playwright/test'

/**
 * Tests run against the production build (`vite preview`) in the locally
 * installed Chrome, so no browser download is needed. Set PW_CHANNEL to use a
 * different channel (e.g. "msedge"), or unset it to use Playwright's Chromium.
 */
const channel = process.env.PW_CHANNEL ?? 'chrome'
// A separate port allows a fresh production build beside an existing preview.
const port = Number(process.env.PW_PORT ?? 4173)
const baseURL = `http://localhost:${port}`
// Point at a specific Chromium binary (e.g. a preinstalled one in CI/cloud).
const executablePath = process.env.PW_EXECUTABLE || undefined

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    channel: channel || undefined,
    launchOptions: { executablePath },
    trace: 'retain-on-failure',
    reducedMotion: 'no-preference',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', testIgnore: /mobile\.spec/, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', testMatch: /mobile\.spec/, use: { ...devices['Pixel 7'], channel: channel || undefined, launchOptions: { executablePath } } },
  ],
})
