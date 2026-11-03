#!/usr/bin/env node
/**
 * 生成首屏位图样例（/public/hero/sample-light.webp）
 *
 * 做法：用 SVG 画几团高斯模糊的色块，再用 sharp 栅格化成 webp。
 * 好处是质感接近"印在纸上的水彩"、文件极小（约 7KB）；
 * 单主题后只需要一张。
 *
 * 用法：node Client/scripts/gen-hero-art.mjs
 * 依赖：借用 Server/node_modules 里的 sharp（Client 没装）
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../..')
const require_ = createRequire(path.join(REPO, 'Server/'))
const sharp = require_('sharp')

const W = 1955
const H = 900
const OUT_DIR = path.join(REPO, 'Client/public/hero')

function svg({ bg, blobs, grain, vig }) {
  const ellipses = blobs
    .map((b) => `<ellipse cx="${b.x}" cy="${b.y}" rx="${b.rx}" ry="${b.ry}" fill="${b.c}" opacity="${b.o}"/>`)
    .join('')
  const echoes = blobs
    .slice(0, 3)
    .map(
      (b) =>
        `<ellipse cx="${b.x + 40}" cy="${b.y - 30}" rx="${b.rx * 0.55}" ry="${b.ry * 0.5}" fill="${b.c}" opacity="${b.o * 0.7}"/>`
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="90"/></filter>
    <filter id="soft2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="45"/></filter>
    <filter id="grainF"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2"/><feColorMatrix type="saturate" values="0"/></filter>
    <radialGradient id="vig" cx="46%" cy="34%" r="78%">
      <stop offset="40%" stop-color="${vig}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${vig}" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <g filter="url(#soft)" style="mix-blend-mode:multiply">${ellipses}</g>
  <g filter="url(#soft2)" opacity="0.55">${echoes}</g>
  <rect width="${W}" height="${H}" filter="url(#grainF)" opacity="${grain}"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`
}

const light = svg({
  bg: '#f3ecdf',
  blobs: [
    { c: '#6f8cbd', x: 380, y: 760, rx: 620, ry: 420, o: 0.62 },
    { c: '#8b9a55', x: 1900, y: 240, rx: 560, ry: 460, o: 0.5 },
    { c: '#f6edda', x: 1150, y: 120, rx: 780, ry: 360, o: 0.8 },
    { c: '#8fb0a8', x: 2300, y: 900, rx: 420, ry: 340, o: 0.38 },
    { c: '#c9b48d', x: 180, y: 140, rx: 360, ry: 300, o: 0.28 },
  ],
  grain: 0.05,
  vig: '#ece3d3',
})

for (const [name, s] of [['sample-light', light]]) {
  const out = path.join(OUT_DIR, `${name}.webp`)
  await sharp(Buffer.from(s)).webp({ quality: 74, effort: 5 }).toFile(out)
  console.log(name, (fs.statSync(out).size / 1024).toFixed(0) + 'KB')
}
