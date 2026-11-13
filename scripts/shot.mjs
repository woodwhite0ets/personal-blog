// 用途：无头浏览器截图 + 执行测量表达式（视觉回归、DOM 度量）
// 用法：node scripts/shot.mjs <url> <out.png> "<js 表达式>" [宽] [高]

// 极简 CDP：打开页面 → 等稳定 → 执行 JS → 截图
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const url = process.argv[2]
const outPng = process.argv[3]
const expr = process.argv[4] || 'null'
const W = Number(process.argv[5] || 1440)
const H = Number(process.argv[6] || 987)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=9333', '--force-prefers-reduced-motion',
  `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' })

let ver
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch('http://127.0.0.1:9333/json/version')
    ver = await r.json()
    break
  } catch { await sleep(150) }
}
if (!ver) { console.error('chrome 没起来'); chrome.kill(); process.exit(1) }

const t = await (await fetch('http://127.0.0.1:9333/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
const send = (method, params = {}) => new Promise((res, rej) => {
  const mid = ++id
  pending.set(mid, { res, rej })
  ws.send(JSON.stringify({ id: mid, method, params }))
})
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id)
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 })
await send('Page.navigate', { url })
await sleep(2600)

const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
console.log(typeof r.result.value === 'string' ? r.result.value : JSON.stringify(r.result.value, null, 1))

if (outPng) {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(outPng, Buffer.from(shot.data, 'base64'))
}
ws.close(); chrome.kill()
