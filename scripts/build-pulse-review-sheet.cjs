#!/usr/bin/env node
/**
 * Builds docs/PULSE_VISUAL_REVIEW_SHEET.png: ref scaled, actual, rough diff, overlay blend (~0.18, same as dev VisualOverlay), + crops.
 * Requires: pngjs (already devDependency). No ImageMagick.
 */
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')

const ROOT = path.join(__dirname, '..')
const REF = path.join(ROOT, 'docs/PULSE_REFERENCE_scaled_1672.png')
const ACT = path.join(ROOT, 'docs/PULSE_CHECKPOINT_actual.png')
const DIF = path.join(ROOT, 'docs/PULSE_CHECKPOINT_diff_vs_reference_scaled.png')
const OUT = path.join(ROOT, 'docs/PULSE_VISUAL_REVIEW_SHEET.png')
const GAP = 6

function readPng(p) {
  return PNG.sync.read(fs.readFileSync(p))
}

function blendOverlay(a, b, alpha = 0.18) {
  if (a.width !== b.width || a.height !== b.height) throw new Error('blend size mismatch')
  const o = new PNG({ width: a.width, height: a.height })
  for (let i = 0; i < a.data.length; i += 4) {
    o.data[i] = Math.round(a.data[i] * alpha + b.data[i] * (1 - alpha))
    o.data[i + 1] = Math.round(a.data[i + 1] * alpha + b.data[i + 1] * (1 - alpha))
    o.data[i + 2] = Math.round(a.data[i + 2] * alpha + b.data[i + 2] * (1 - alpha))
    o.data[i + 3] = 255
  }
  return o
}

function crop(src, x, y, w, h) {
  const d = new PNG({ width: w, height: h })
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const sx = x + dx
      const sy = y + dy
      if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) continue
      const si = (src.width * sy + sx) * 4
      const di = (w * dy + dx) * 4
      d.data[di] = src.data[si]
      d.data[di + 1] = src.data[si + 1]
      d.data[di + 2] = src.data[si + 2]
      d.data[di + 3] = src.data[si + 3]
    }
  }
  return d
}

function hstack(left, right) {
  const w = left.width + GAP + right.width
  const h = Math.max(left.height, right.height)
  const o = new PNG({ width: w, height: h })
  o.data.fill(0)
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
  blit(o, left, 0, Math.floor((h - left.height) / 2))
  blit(o, right, left.width + GAP, Math.floor((h - right.height) / 2))
  return o
}

function vstack(parts) {
  const w = Math.max(...parts.map(p => p.width))
  let th = 0
  for (const p of parts) th += p.height + GAP
  th -= GAP
  const o = new PNG({ width: w, height: th })
  o.data.fill(10)
  let y = 0
  for (const p of parts) {
    for (let py = 0; py < p.height; py++) {
      for (let px = 0; px < p.width; px++) {
        const si = (py * p.width + px) * 4
        const di = ((y + py) * w + px) * 4
        if (px < w) {
          o.data[di] = p.data[si]
          o.data[di + 1] = p.data[si + 1]
          o.data[di + 2] = p.data[si + 2]
          o.data[di + 3] = p.data[si + 3]
        }
      }
    }
    y += p.height + GAP
  }
  return o
}

function main() {
  const ref = readPng(REF)
  const act = readPng(ACT)
  const dif = fs.existsSync(DIF) ? readPng(DIF) : null
  if (ref.width !== act.width || ref.height !== act.height) {
    console.error('REF and ACT dimensions must match', ref.width, act.width)
    process.exit(1)
  }
  const overlay = blendOverlay(ref, act, 0.18)

  const crops = [
    ['a_header', 0, 0, 1672, 72],
    ['b_program', 12, 76, 298, 332],
    ['c_hero', 318, 76, 994, 292],
    ['d_top_tags', 318, 374, 994, 154],
    ['e_topic_net', 1326, 76, 334, 420],
    ['f_voting', 318, 538, 482, 317],
    ['g_heatmap', 804, 538, 508, 319],
    ['h_insights', 1326, 502, 334, 353],
    ['i_footer', 0, 873, 1672, 68],
  ]

  const cropRows = crops.map(([_, x, y, w, h]) => hstack(crop(ref, x, y, w, h), crop(act, x, y, w, h)))

  const parts = [ref, act, dif || act, overlay, ...cropRows]
  const sheet = vstack(parts)
  fs.writeFileSync(OUT, PNG.sync.write(sheet))
  console.log('Wrote', OUT, sheet.width, 'x', sheet.height)
}

main()
