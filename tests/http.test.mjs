import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

test('HTTP surface: token pages, static assets, auth, config, persona triple-confirm', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-http-'))
  const old = process.env.DSH_HOME
  const oldData = process.env.WHALE_DATA_DIR
  process.env.DSH_HOME = home
  process.env.WHALE_DATA_DIR = path.join(home, 'data')
  const cleanups = []
  let server
  try {
    const { default: plugin } = await import('../lib/index.js')
    const routes = []
    const connection = {
      requestRejection: (req) => (req.headers['x-test-auth'] ? undefined : 403),
    }
    const ctx = {
      connection,
      get: (name) => (name === 'connection' ? connection : undefined),
      webServer: {
        port: 0,
        getOrigin: () => `http://127.0.0.1:${server.address().port}`,
        register: (r) => { routes.push(r); return () => {} },
      },
      effect: (factory) => { cleanups.push(factory()) },
    }
    plugin.apply(ctx)
    server = http.createServer((req, res) => routes[0].handler(req, res))
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const base = `http://127.0.0.1:${server.address().port}`

    const cfg = JSON.parse(fs.readFileSync(path.join(home, 'whale-companion', 'config.json'), 'utf8'))
    const token = cfg.windowToken
    assert.ok(token)

    const page = await fetch(`${base}/dsh-whale/pet?token=${encodeURIComponent(token)}`)
    assert.equal(page.status, 200)
    assert.match(await page.text(), /petRoot/)
    const setCookie = page.headers.get('set-cookie') || ''
    assert.match(setCookie, /dsh_whale_token=/)
    const cookie = setCookie.split(';')[0]

    const css = await fetch(`${base}/dsh-whale/static/ui/pet.css`, { headers: { cookie } })
    assert.equal(css.status, 200)
    assert.match(await css.text(), /pet-root/)

    const unauth = await fetch(`${base}/dsh-whale/api/config`)
    assert.equal(unauth.status, 403)

    const authed = await fetch(`${base}/dsh-whale/api/config`, { headers: { cookie } })
    assert.equal(authed.status, 200)
    const cfgJson = await authed.json()
    assert.equal(cfgJson.ok, true)
    assert.equal(cfgJson.config.llm.apiKey, '')

    const outfit = await fetch(`${base}/dsh-whale/api/pet/outfit`, {
      method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ outfit: 'knit' }),
    })
    assert.equal(outfit.status, 200)
    assert.equal((await outfit.json()).state.outfit, 'knit')

    const p1 = await fetch(`${base}/dsh-whale/api/persona`, {
      method: 'POST', headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ text: '# 我是谁\n我叫小肥鱼。', confirmations: 0 }),
    })
    assert.equal(p1.status, 200)

    const p2 = await fetch(`${base}/dsh-whale/api/persona`, {
      method: 'POST', headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ text: '# 我是谁\n我叫大肥鱼。', confirmations: 0 }),
    })
    assert.equal(p2.status, 400)
    assert.match((await p2.json()).error, /三次/)

    const p3 = await fetch(`${base}/dsh-whale/api/persona`, {
      method: 'POST', headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ text: '# 我是谁\n我叫大肥鱼。', confirmations: 3 }),
    })
    assert.equal(p3.status, 200)
  } finally {
    for (const c of cleanups) { try { c() } catch {} }
    if (server) await new Promise((resolve) => server.close(resolve))
    process.env.DSH_HOME = old
    if (oldData === undefined) delete process.env.WHALE_DATA_DIR
    else process.env.WHALE_DATA_DIR = oldData
    fs.rmSync(home, { recursive: true, force: true })
  }
})
