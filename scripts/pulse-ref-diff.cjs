#!/usr/bin/env node
/**
 * Raster diff for checkpoint only. Reference PNG must match stage WxH or be pre-scaled.
 * Usage:
 *   node scripts/pulse-ref-diff.cjs <imgA.png> <imgB.png> <diffOut.png>
 */
const fs = require('fs')
const { PNG } = require('pngjs')
const pixelmatchMod = require('pixelmatch')
const pixelmatchFn = typeof pixelmatchMod === 'function' ? pixelmatchMod : pixelmatchMod.default

const [, , pathA, pathB, diffOut] = process.argv
if (!pathA || !pathB || !diffOut) {
  console.error('usage: pulse-ref-diff.cjs <imgA> <imgB> <diffOut>')
  process.exit(1)
}

const a = PNG.sync.read(fs.readFileSync(pathA))
const b = PNG.sync.read(fs.readFileSync(pathB))
if (a.width !== b.width || a.height !== b.height) {
  console.error(
    JSON.stringify(
      {
        error: 'size_mismatch',
        a: { w: a.width, h: a.height },
        b: { w: b.width, h: b.height },
      },
      null,
      2,
    ),
  )
  process.exit(2)
}

const { width, height } = a
const diff = new PNG({ width, height })
const mismatched = pixelmatchFn(a.data, b.data, diff.data, width, height, {
  threshold: 0.1,
  includeAA: false,
})
fs.writeFileSync(diffOut, PNG.sync.write(diff))
const total = width * height
const ratio = mismatched / total
console.log(
  JSON.stringify(
    {
      mismatchedPixels: mismatched,
      totalPixels: total,
      ratio,
      ratioPercent: (ratio * 100).toFixed(4),
    },
    null,
    2,
  ),
)
