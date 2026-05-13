import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(process.cwd(), '.pw-browser')
}

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3320',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } }],
  webServer: {
    command: 'NEXT_TELEMETRY_DISABLED=1 npm run dev -- -p 3320',
    url: 'http://localhost:3320/pulse',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
