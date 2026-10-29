import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PetService } from '../lib/pet.js'
import { ensureDataDirs } from '../lib/config.js'

function service(root) {
  const cfg = {
    dataDir: root,
    pet: { outfit: 'maid' },
    memory: { importantMaxChars: 7000 },
    self: { name: '小肥鱼' },
    owner: { name: '主人' },
    llm: { maxTokens: 200, contextLimit: 8000 },
    schedule: { wake: '07:30', sleep: '22:30' },
  }
  ensureDataDirs(cfg)
  return new PetService({
    getConfig: () => cfg,
    saveConfig: () => {},
    llm: { call: async () => ({ text: '{}' }) },
    memory: {},
    log: () => {},
  })
}

test('touch context survives a same-day restart and is released on sleep', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-touch-'))
  try {
    const a = service(root)
    a.pushTouch('head', '嘿嘿', ['happy'])
    assert.equal(a.touchMessages.length, 2)

    const b = service(root)
    assert.equal(b.touchMessages.length, 2, 'same-day restart restores the daily touch context')
    assert.equal(b.touchMessages[0].zone, 'head')

    b.setAsleep(true)
    const c = service(root)
    assert.equal(c.touchMessages.length, 0, 'sleep releases the touch context')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
