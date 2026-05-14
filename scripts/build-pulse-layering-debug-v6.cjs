#!/usr/bin/env node
/**
 * Case B (opaque UI capture): production merge is NOT "UI PNG over BG PNG".
 * Stack vertically: BG-only | UI-only | FINAL (coded UI + approved raster) — same 1672×941.
 */
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const ROOT = path.join(__dirname, '..')
const docs = path.join(ROOT, 'docs')
const NAMES = [
  'PULSE_BG_ONLY_V6.png',
  'PULSE_UI_ONLY_V6.png',
  'PULSE_FINAL_CANDIDATE_BG_APPROVED_V6.png',
]
const OUT = path.join(docs, 'PULSE_LAYERING_DEBUG_V6.png')
const GAP = 6

function read(name) {
  const p = path.join(docs, name)
  if (!fs.existsSync(p)) {
    console.error('Missing:', p)
    process.exit(1)
  }
  return PNG.sync.read(fs.readFileSync(p))
}

function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const di = ((oy + y) * dst.width + (ox + x)) * 4
      const si = (y * src.width + x) * 4
      if (ox + x < 0 || oy + y < 0 || ox + x >= dst.width || oy + y >= dst.height) continue
      dst.data[di] = src.data[si]
      dst.data[di + 1] = src.data[si + 1]
      dst.data[di + 2] = src.data[si + 2]
      dst.data[di + 3] = src.data[si + 3]
    }
  }
}

function main() {
  const imgs = NAMES.map(read)
  const w = imgs[0].width
  const h = imgs[0].height
  for (let i = 1; i < imgs.length; i++) {
    if (imgs[i].width !== w || imgs[i].height !== h) {
      console.error('Dimension mismatch', NAMES[0], imgs[0].width, imgs[0].height, NAMES[i], imgs[i].width, imgs[i].height)
      process.exit(1)
    }
  }
  const outH = h * 3 + GAP * 2
  const out = new PNG({ width: w, height: outH })
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 3
    out.data[i + 1] = 8
    out.data[i + 2] = 15
    out.data[i + 3] = 255
  }
  let y = 0
  for (const im of imgs) {
    blit(out, im, 0, y)
    y += h + GAP
  }
  fs.writeFileSync(OUT, PNG.sync.write(out))
  console.log('Wrote', OUT, `${w}x${outH}`, '(stack: BG_ONLY | UI_ONLY | FINAL)')
}

main()
