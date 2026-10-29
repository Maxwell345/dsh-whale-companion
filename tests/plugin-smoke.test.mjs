import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

test('host plugin mounts the /dsh-whale route and answers status', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-home-'))
  const old = process.env.DSH_HOME
  const oldData = process.env.WHALE_DATA_DIR
  process.env.DSH_HOME = home
  process.env.WHALE_DATA_DIR = path.join(home, 'data')
  const routes = []
  const cleanups = []
  try {
    const { default: plugin } = await import('../lib/index.js')
    const connection = { requestRejection: () => false }
    const ctx = {
      connection,
      get: (name) => (name === 'connection' ? connection : undefined),
      webServer: {
        port: 12345,
        getOrigin: () => 'http://127.0.0.1:12345',
        register: (r) => { routes.push(r); return () => {} },
      },
      effect: (factory) => { cleanups.push(factory()) },
    }
    plugin.apply(ctx)
    assert.equal(routes.length, 1)
    assert.equal(routes[0].path, '/dsh-whale')
    assert.ok(fs.existsSync(path.join(home, 'whale-companion', 'config.json')))

    let statusCode = 0
    let body = ''
    const req = {
      method: 'GET',
      url: '/dsh-whale/api/status',
      headers: { host: '127.0.0.1:12345' },
      on: () => {},
    }
    const res = {
      headersSent: false,
      writeHead(code) { statusCode = code; this.headersSent = true },
      end(chunk) { body += chunk ? String(chunk) : '' },
    }
    await routes[0].handler(req, res)
    assert.equal(statusCode, 200)
    const parsed = JSON.parse(body)
    assert.equal(parsed.ok, true)
    assert.equal(parsed.status.version, '0.2.0')
    assert.equal(parsed.status.paths.root, path.join(home, 'data'))
  } finally {
    for (const c of cleanups) { try { c() } catch {} }
    process.env.DSH_HOME = old
    if (oldData === undefined) delete process.env.WHALE_DATA_DIR
    else process.env.WHALE_DATA_DIR = oldData
    fs.rmSync(home, { recursive: true, force: true })
  }
})
