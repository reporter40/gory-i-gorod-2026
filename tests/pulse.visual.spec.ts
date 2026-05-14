import path from 'node:path'
import { execFileSync } from 'node:child_process'

import { test, expect } from '@playwright/test'

const docsDir = path.join(process.cwd(), 'docs')
const layeringScript = path.join(process.cwd(), 'scripts/build-pulse-layering-debug-v7.cjs')

test.describe.configure({ mode: 'serial' })

test.describe('pulse visual', () => {
  /** Snapshot first (normal URL) — avoids cross-mode warm-up skew vs other routes. */
  test('PulseStage snapshot + PULSE_FINAL_CANDIDATE_BG_APPROVED_V7.png', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.goto('/pulse?visualTest=1', { waitUntil: 'networkidle', timeout: 120_000 })
    await page.waitForSelector('.pulse-stage', { state: 'visible', timeout: 120_000 })
    const stage = page.locator('.pulse-stage')
    await expect(stage).toBeVisible()

    await expect(stage).toHaveScreenshot('pulse-stage.png', {
      maxDiffPixelRatio: 0.15,
      animations: 'disabled',
    })

    await stage.screenshot({
      path: path.join(docsDir, 'PULSE_CHECKPOINT_actual.png'),
      animations: 'disabled',
    })
    await stage.screenshot({
      path: path.join(docsDir, 'PULSE_FINAL_CANDIDATE_BG_APPROVED_V7.png'),
      animations: 'disabled',
    })
  })

  test('writes PULSE_BG_ONLY_V7.png (bgMode=bg-only)', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/pulse?visualTest=1&bgMode=bg-only', { waitUntil: 'networkidle', timeout: 120_000 })
    await page.waitForSelector('.pulse-stage', { state: 'visible', timeout: 120_000 })
    const stage = page.locator('.pulse-stage')
    await expect(stage).toBeVisible()
    await stage.screenshot({
      path: path.join(docsDir, 'PULSE_BG_ONLY_V7.png'),
      animations: 'disabled',
    })
  })

  test('writes PULSE_UI_ONLY_CLEAN_V7.png (bgMode=ui-only)', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/pulse?visualTest=1&bgMode=ui-only', { waitUntil: 'networkidle', timeout: 120_000 })
    await page.waitForSelector('.pulse-stage', { state: 'visible', timeout: 120_000 })
    const stage = page.locator('.pulse-stage')
    await expect(stage).toBeVisible()
    await stage.screenshot({
      path: path.join(docsDir, 'PULSE_UI_ONLY_CLEAN_V7.png'),
      animations: 'disabled',
    })
  })

  test('bgMode=final shows approved raster + clean UI', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/pulse?visualTest=1&bgMode=final', { waitUntil: 'networkidle', timeout: 120_000 })
    await page.waitForSelector('.pulse-stage', { state: 'visible', timeout: 120_000 })
    await expect(page.locator('.pulse-stage')).toBeVisible()
    await expect(page.locator('.pulse-background-image')).toBeVisible()
    await expect(page.locator('.pulse-stage-content')).toBeVisible()
  })

  test('writes PULSE_LAYERING_DEBUG_V7.png', () => {
    execFileSync(process.execPath, [layeringScript], { stdio: 'inherit', cwd: process.cwd() })
  })
})
