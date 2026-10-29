import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { personaState, dataPaths } from '../lib/config.js'

test('the shipped persona header does not count as a filled persona', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-persona-'))
  try {
    const cfg = { dataDir: root, persona: { locked: false } }
    const p = dataPaths(cfg)
    fs.mkdirSync(path.dirname(p.persona), { recursive: true })
    fs.writeFileSync(p.persona, '# 人设人格卡（固定）\n\n> 第一次请在这里写下她是谁。\n\n')
    assert.equal(personaState(cfg).exists, false)
    fs.writeFileSync(p.persona, '# 我是谁\n\n我叫小肥鱼，是一只小鲸鱼娘。\n')
    assert.equal(personaState(cfg).exists, true)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
