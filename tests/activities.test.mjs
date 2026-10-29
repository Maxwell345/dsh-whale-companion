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
      enabled: true, booksDir: '', maxGameMinutesPerDay: 30, keepDays: 14,
      allowPython: true, maxCodeBytes: 20480,
      activities: { draw: true, codeGame: true, readBook: true, appreciate: true, playGame: true, clean: true, missOwner: true },
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

test('HTML game validation blocks external resources and network', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-act-'))
  try {
    const s = makeService(root)
    assert.doesNotThrow(() => s.validateHtml('<!doctype html><html><body><script>console.log(1)</script></body></html>'))
    assert.throws(() => s.validateHtml('<!doctype html><html><body><script src="https://x/a.js"></script></body></html>'))
    assert.throws(() => s.validateHtml('<!doctype html><html><body><script>fetch("x")</script></body></html>'))
    assert.doesNotThrow(() => s.validateHtml('<html><body>hi</body></html>'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

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

test('Python game validation blocks system and network imports', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-py-'))
  try {
    const s = makeService(root)
    assert.doesNotThrow(() => s.validatePython('import random\nprint(random.randint(1, 3))\n'))
    assert.throws(() => s.validatePython('import os\nprint(os.getcwd())\n'))
    assert.throws(() => s.validatePython('import socket\n'))
    assert.throws(() => s.validatePython('open("x", "w")\n'))
    assert.throws(() => s.validatePython('eval("1+1")\n'))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('clean only removes old art/games and never books', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-clean-'))
  try {
    const s = makeService(root)
    const p = ensureDataDirs({ ...s.getConfig(), dataDir: root })
    const old = new Date(Date.now() - 40 * 86400000)
    const art = path.join(p.art, 'old.svg')
    const game = path.join(p.games, 'old.html')
    const book = path.join(p.books, 'book.txt')
    fs.writeFileSync(art, '<svg></svg>')
    fs.writeFileSync(game, '<!doctype html><html></html>')
    fs.writeFileSync(book, 'text')
    for (const f of [art, game]) fs.utimesSync(f, old, old)
    const r = await s.clean()
    assert.equal(r.ok, true)
    assert.ok(!fs.existsSync(art))
    assert.ok(!fs.existsSync(game))
    assert.ok(fs.existsSync(book), 'books are never deleted')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
