import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { CompanionScheduler, withinWindow } from '../lib/schedule.js'

test('withinWindow handles same-day and overnight schedules', () => {
  const d = (h, m = 0) => new Date(2026, 9, 28, h, m)
  assert.equal(withinWindow(d(8), '07:30', '22:30'), true)
  assert.equal(withinWindow(d(23), '07:30', '22:30'), false)
  assert.equal(withinWindow(d(2), '22:30', '07:30'), true)
  assert.equal(withinWindow(d(12), '22:30', '07:30'), false)
})

test('manual wake and sleep update the persisted state', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-sched-'))
  try {
    const cfg = {
      dataDir: root,
      schedule: { enabled: true, wake: '07:30', sleep: '22:30', freeEnabled: true },
    }
    let woke = 0
    let slept = 0
    const s = new CompanionScheduler({
      getConfig: () => cfg,
      onWake: async () => { woke++ },
      onSleep: async () => { slept++ },
      log: () => {},
    })
    s.state.asleep = true
    await s.wake('manual')
    assert.equal(s.isAwake(), true)
    assert.equal(woke, 1)
    await s.sleep('manual')
    assert.equal(s.isAwake(), false)
    assert.equal(slept, 1)
    const saved = JSON.parse(fs.readFileSync(path.join(root, '状态.json'), 'utf8'))
    assert.equal(saved.asleep, true)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
