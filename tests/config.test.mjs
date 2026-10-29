import test from 'node:test'
import assert from 'node:assert/strict'
import { applyIncoming, publicConfig, DEFAULT_CONFIG } from '../lib/config.js'

test('applyIncoming preserves secrets when the settings form leaves them blank', () => {
  const current = {
    ...DEFAULT_CONFIG,
    windowToken: 'token-123',
    dataDir: 'C:/tmp/whale',
    llm: { ...DEFAULT_CONFIG.llm, apiKey: 'sk-secret' },
    qq: { ...DEFAULT_CONFIG.qq, token: 'qq-secret' },
  }
  const incoming = {
    ...publicConfig(current),
    llm: { ...publicConfig(current).llm, apiKey: '' },
    qq: { ...publicConfig(current).qq, token: '' },
  }
  const next = applyIncoming(current, incoming)
  assert.equal(next.llm.apiKey, 'sk-secret')
  assert.equal(next.qq.token, 'qq-secret')
  assert.equal(next.voice, undefined, 'voice section is removed')
  assert.equal(next.windowToken, 'token-123')
  assert.equal(next.dataDir, 'C:/tmp/whale')
})

test('applyIncoming clamps dangerous values and rejects impossible times', () => {
  const next = applyIncoming(DEFAULT_CONFIG, {
    llm: { contextLimit: 99999999, maxTokens: 999999, temperature: 9 },
    qq: { groups: ['123', '456', '789', '000'] },
    schedule: { wake: '07:30', sleep: '23:00' },
    free: { maxCodeBytes: 999999 },
  })
  assert.ok(next.llm.contextLimit <= 200000)
  assert.ok(next.llm.maxTokens <= 8192)
  assert.ok(next.llm.temperature <= 2)
  assert.equal(next.qq.groups.length, 3)
  assert.ok(next.free.maxCodeBytes <= 20480)

  assert.throws(() => applyIncoming(DEFAULT_CONFIG, { schedule: { wake: '25:00', sleep: '07:00' } }), /作息/)
})

test('publicConfig never exposes secrets', () => {
  const cfg = {
    ...DEFAULT_CONFIG,
    windowToken: 'window-secret',
    llm: { ...DEFAULT_CONFIG.llm, apiKey: 'sk-secret' },
    qq: { ...DEFAULT_CONFIG.qq, token: 'qq-secret' },
  }
  const pub = publicConfig(cfg)
  assert.equal(pub.llm.apiKey, '')
  assert.equal(pub.qq.token, '')
  assert.equal(pub.windowToken, '')
  assert.equal(pub.llm.apiKeySet, true)
  assert.equal(pub.qq.tokenSet, true)
})
