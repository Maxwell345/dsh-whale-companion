import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { FreeActivities } from '../lib/activities.js'
import { ensureDataDirs } from '../lib/config.js'

function makeService(root) {
  const cfg = {
    dataDir: root,
    free: {
      enabled: true, booksDir: '', keepDays: 14, maxCodeBytes: 20480,
      activities: { draw: true, readBook: true, appreciate: true, clean: true, missOwner: true },
    },
    schedule: { freeEnabled: true, freeMinGapMin: 25, freeMaxGapMin: 55 },
    memory: { importantMaxChars: 7000 },
    pet: { outfit: 'maid' },
  }
  ensureDataDirs(cfg)
  return new FreeActivities({
    getConfig: () => cfg,
    llm: { call: async () => ({ text: '<svg></svg>' }) },
    memory: { appendFreeLog: () => {}, freeLogToday: () => '' },
    pet: { asleep: false },
    windows: { openActivity: () => {} },
    isBusy: () => false,
    onSay: () => {},
    onMissOwner: async () => {},
    log: () => {},
  })
}

test('SVG validation allows the required namespace but blocks scripts and external URLs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-svg-'))
  try {
    const s = makeService(root)
    assert.doesNotThrow(() => s.validateSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3"/></svg>'))
    assert.throws(() => s.validateSvg('<svg><script>alert(1)</script></svg>'))
    assert.throws(() => s.validateSvg('<svg><image href="https://x/a.png"/></svg>'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('game-writing and game-playing activities are removed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-no-games-'))
  try {
    const s = makeService(root)
    assert.equal(typeof s.codeGame, 'undefined')
    assert.equal(typeof s.playGame, 'undefined')
    assert.equal(typeof s.validatePython, 'undefined')
    assert.equal(typeof s.validateHtml, 'undefined')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('clean only removes old art and never books', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-clean-'))
  try {
    const s = makeService(root)
    const p = ensureDataDirs({ ...s.getConfig(), dataDir: root })
    const old = new Date(Date.now() - 40 * 86400000)
    const art = path.join(p.art, 'old.svg')
    const book = path.join(p.books, 'book.txt')
    fs.writeFileSync(art, '<svg></svg>')
    fs.writeFileSync(book, 'text')
    fs.utimesSync(art, old, old)
    const r = await s.clean()
    assert.equal(r.ok, true)
    assert.ok(!fs.existsSync(art))
    assert.ok(fs.existsSync(book), 'books are never deleted')
    assert.equal(s.status().artCount, 0)
    assert.equal(s.status().bookCount >= 1, true)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
