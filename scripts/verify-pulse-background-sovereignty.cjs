#!/usr/bin/env node
/**
 * Background sovereignty: stage must expose only approved-v1 raster (+ optional flat safety tint).
 * Panel chrome (footer ridge SVG) is allowlisted — not a full-stage panorama.
 */
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()

const filesToCheck = [
  'components/pulse/PulseStage.tsx',
  'styles/pulse.stage.css',
  'styles/pulse.effects.css',
]

const allowedBackgroundUrl = '/pulse/pulse-bg-atmosphere-approved-v1.png'
const allowlistedAssetUrls = new Set([allowedBackgroundUrl, '/pulse/pulse-footer-ridge.svg'])

const forbiddenTokens = [
  'pulse-stage-bg',
  'pulse-stage-silhouette',
  'pulse-stage-horizon',
  'pulse-stage-noise',
  'pulse-mountain-footer',
  'pulse-stage-atmosphere',
  'pulse-bottom-depth',
  'pulse-bg-atmosphere.png',
  'pulse-target.png',
]

let failed = false

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath)
  if (!fs.existsSync(absolutePath)) return ''
  return fs.readFileSync(absolutePath, 'utf8')
}

function fail(message) {
  failed = true
  console.error(`❌ ${message}`)
}

for (const file of filesToCheck) {
  const source = readFile(file)
  for (const token of forbiddenTokens) {
    if (source.includes(token)) {
      fail(`${file} contains forbidden legacy background token: ${token}`)
    }
  }
}

const stageCss = readFile('styles/pulse.stage.css')

if (!stageCss.includes(allowedBackgroundUrl)) {
  fail(`styles/pulse.stage.css does not use approved background URL: ${allowedBackgroundUrl}`)
}

const cssUrls = [...stageCss.matchAll(/url\((['"]?)(.*?)\1\)/g)].map((m) => m[2])
for (const url of cssUrls) {
  if (!allowlistedAssetUrls.has(url)) {
    fail(`styles/pulse.stage.css contains non-approved URL: ${url}`)
  }
}

if (stageCss.includes('radial-gradient')) {
  fail('styles/pulse.stage.css contains forbidden stage-level radial-gradient')
}

if (stageCss.includes('conic-gradient')) {
  fail('styles/pulse.stage.css contains forbidden stage-level conic-gradient')
}

if (failed) {
  console.error('\nBackground sovereignty check failed.')
  process.exit(1)
}

console.log('✅ Pulse background sovereignty check passed.')
