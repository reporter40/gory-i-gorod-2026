import { test, expect } from '@playwright/test'

/** Phase 1 visual lock: baseline — committed snapshot under tests/**-snapshots**. */
test.describe('pulse visual', () => {
  test('PulseStage matches snapshot (visualTest=1)', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/pulse?visualTest=1', { waitUntil: 'networkidle', timeout: 120_000 })
    const stage = page.locator('.pulse-stage')
    await expect(stage).toBeVisible()

    await expect(stage).toHaveScreenshot('pulse-stage.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    })
  })
})
