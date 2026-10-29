/**
 * Development preview: mounts the host half with stub DSH services and serves
 * the real pages over HTTP. Not part of the plugin runtime.
 *
 *   node tools/preview.mjs [port]
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

const port = Number(process.argv[2] || 17890)
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-preview-'))
process.env.DSH_HOME = home
if (process.argv.includes('--real-key')) {
  try {
    const text = fs.readFileSync(path.join(os.homedir(), '.dsh', '.credentials.yaml'), 'utf8')
    const m = text.match(/sk-[A-Za-z0-9]{16,}/)
    if (m) process.env.DEEPSEEK_API_KEY = m[0]
  } catch {}
}

const { default: plugin } = await import('../lib/index.js')
const routes = []
const cleanups = []
const connection = { requestRejection: () => undefined }
let server
const ctx = {
  connection,
  get: (name) => (name === 'connection' ? connection : undefined),
  webServer: {
    port,
    getOrigin: () => `http://127.0.0.1:${port}`,
    register: (r) => { routes.push(r); return () => {} },
  },
  effect: (factory) => { cleanups.push(factory()) },
}
plugin.apply(ctx)
server = http.createServer((req, res) => routes[0].handler(req, res))
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve))
const cfg = JSON.parse(fs.readFileSync(path.join(home, 'whale-companion', 'config.json'), 'utf8'))
const base = `http://127.0.0.1:${port}`
console.log(`settings: ${base}/dsh-whale/settings?token=${encodeURIComponent(cfg.windowToken)}`)
console.log(`pet:      ${base}/dsh-whale/pet?token=${encodeURIComponent(cfg.windowToken)}&chroma=1`)
console.log(`chat:     ${base}/dsh-whale/chat?token=${encodeURIComponent(cfg.windowToken)}`)
console.log(`data:     ${home}`)
console.log('ctrl-c to stop')

const stop = async () => {
  for (const c of cleanups) { try { c() } catch {} }
  await new Promise((resolve) => server.close(resolve))
  try { fs.rmSync(home, { recursive: true, force: true }) } catch {}
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
