import test from 'node:test'
import assert from 'node:assert/strict'

test('browser half registers the settings.section slot', async () => {
  let loaded = null
  globalThis.window = {
    __ModuleLoader__: {
      load: (entry) => { loaded = entry },
    },
  }
  const React = {
    createElement: () => null,
    useEffect: () => {},
    useState: (v) => [v, () => {}],
  }
  const mod = await import('../lib/client.js')
  assert.ok(loaded)
  assert.equal(loaded.id, 'dsh-whale-companion')
  const exports = loaded.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected require ${name}`)
  })
  assert.equal(exports.name, 'dsh-whale-companion')
  assert.deepEqual(exports.inject, ['slots'])
  let registered = null
  const ctx = {
    effect: (fn) => { fn() },
    slots: {
      inject: (_name, fn) => { fn() },
      register: (meta, component) => { registered = { meta, component } },
    },
  }
  exports.apply(ctx)
  assert.equal(registered.meta.name, 'settings.section')
  assert.equal(registered.meta.id, 'whale-companion')
  assert.equal(registered.meta.label(), '小肥鱼')
})
