import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { MemoryStore } from '../lib/memory.js'
import { dataPaths, ensureDataDirs } from '../lib/config.js'
import { localDateKey, readJsonl, readText } from '../lib/util.js'

function makeConfig(root) {
  return {
    dataDir: root,
    self: { name: '小肥鱼' },
    owner: { name: '主人' },
    llm: { contextLimit: 8000, maxTokens: 200 },
    qq: { contextIdleMinutes: 180 },
    memory: {
      maxDailyRead: 7, maxDailyChars: 9000, maxConversationChars: 5000,
      importantMaxChars: 7000, keepConversationFiles: true,
    },
    pet: { outfit: 'maid' },
    schedule: { wake: '07:30', sleep: '22:30' },
  }
}

function fakeLLM() {
  return {
    async call(messages) {
      if (!Array.isArray(messages) || messages[0]?.role !== 'system') {
        throw new Error('LLM messages must start with a system message')
      }
      const text = messages.map((m) => m.content).join('\n')
      if (text.includes('单轮对话总结')) {
        return { text: '# 这次聊了什么\n主人说他喜欢吃白米饭。\n\n## 主人透露的信息\n- 喜欢白米饭' }
      }
      if (text.includes('旧的全天总结日记')) {
        return { text: '# 重要信息记忆\n\n## 主人喜欢\n- 白米饭\n\n## 难忘的事\n- 第一次一起过生日' }
      }
      if (text.includes('重要信息记忆')) {
        return { text: '# 重要信息记忆\n\n## 主人喜欢\n- 白米饭' }
      }
      if (text.includes('全天总结日记')) {
        return { text: '# 今天和主人\n今天聊了白米饭。' }
      }
      if (text.includes('主人说他喜欢吃白米饭')) {
        return { text: '记得啦，主人喜欢白米饭。' }
      }
      return { text: '好呀，主人。' }
    },
    async *stream(messages) {
      const r = await this.call(messages)
      yield { type: 'delta', text: r.text }
      yield { type: 'done', text: r.text }
    },
  }
}

test('memory keeps an exact archive and compacts on close', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-memory-'))
  try {
    const cfg = makeConfig(root)
    ensureDataDirs(cfg)
    const store = new MemoryStore({ getConfig: () => cfg, llm: fakeLLM(), log: () => {} })

    const convo = store.getConversation('pet-chat', { title: '桌宠聊天', channel: 'pet-chat' })
    for (let i = 0; i < 40; i++) {
      store.append(convo, 'user', `第 ${i} 轮：${'白米饭'.repeat(120)}`)
      store.append(convo, 'assistant', `第 ${i} 轮回复：${'好呀'.repeat(120)}`)
    }
    store.trim(convo)
    const archive = readJsonl(store.tempFile('pet-chat'))
    assert.ok(archive.length > 0, 'oldest messages must be archived verbatim')
    assert.ok(archive[0].content.includes('第 0 轮'), 'archive starts at the oldest message')
    assert.ok(convo.messages.length < 80, 'window must shrink')

    const r = await store.chat({ key: 'pet-chat', title: '桌宠聊天', channel: 'pet-chat', text: '主人说他喜欢吃白米饭' })
    assert.match(r.text, /白米饭/)

    const summary = await store.finalize('pet-chat', 'test-close')
    assert.ok(summary && fs.existsSync(summary), 'single-conversation summary exists')
    assert.ok(!fs.existsSync(store.tempFile('pet-chat')), 'temporary archive is deleted after summary')
    const important = readText(dataPaths(cfg).important, '')
    assert.match(important, /白米饭/)
    const files = fs.readdirSync(dataPaths(cfg).conversationSummaries)
    assert.equal(files.length, 1)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('daily finalize merges summaries and free log, then deletes them', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-day-'))
  try {
    const cfg = makeConfig(root)
    const p = ensureDataDirs(cfg)
    const date = localDateKey()
    fs.writeFileSync(path.join(p.conversationSummaries, `${date}-1200-桌宠聊天.md`), '# 单轮\n聊了白米饭。\n')
    fs.mkdirSync(p.freeLog, { recursive: true })
    fs.writeFileSync(path.join(p.freeLog, `${date}.md`), '# 自由活动日志\n画了一只鲸鱼。\n')

    const store = new MemoryStore({ getConfig: () => cfg, llm: fakeLLM(), log: () => {} })
    const out = await store.finalizeDay(date)
    assert.ok(out && fs.existsSync(out))
    assert.match(readText(out, ''), /全天总结日记/)
    assert.equal(fs.readdirSync(p.conversationSummaries).length, 0)
    assert.ok(!fs.existsSync(path.join(p.freeLog, `${date}.md`)))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('QQ context loads every message from today and preserves consecutive roles', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-qq-context-'))
  try {
    const cfg = makeConfig(root)
    cfg.llm.contextLimit = 32000
    ensureDataDirs(cfg)
    const store = new MemoryStore({ getConfig: () => cfg, llm: fakeLLM(), log: () => {} })
    const convo = store.getConversation('qq-private-10001', { title: 'QQ 私聊', channel: 'qq-private' })
    for (let i = 0; i < 60; i++) {
      store.append(convo, 'user', `消息 ${i}`)
      store.append(convo, 'assistant', `回复 ${i}`)
    }
    // Consecutive assistant messages must stay as separate messages.
    store.append(convo, 'assistant', '再补一句')
    const yesterday = { seq: 999, at: Date.now() - 86400000, role: 'user', content: '昨天的消息' }
    fs.appendFileSync(store.qqHistoryFile(convo), JSON.stringify(yesterday) + '\n')

    const messages = store.requestMessages(convo, 'SYSTEM')
    assert.equal(messages[0].content, 'SYSTEM')
    assert.ok(messages.some((m) => m.content === '消息 0'), 'oldest message today is loaded')
    assert.ok(messages.some((m) => m.content === '回复 59'))
    assert.equal(messages.filter((m) => m.content === '再补一句').length, 1)
    assert.ok(!messages.some((m) => m.content === '昨天的消息'), 'yesterday is excluded')
    assert.equal(messages.filter((m) => m.role === 'assistant').length >= 61, true)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('QQ idle gap adds a reset note and proactive messages use today history', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-qq-proactive-'))
  try {
    const cfg = makeConfig(root)
    ensureDataDirs(cfg)
    let captured = []
    const llm = {
      async call(messages) {
        captured = messages
        return { text: '主人，我想你啦。' }
      },
      async *stream(messages) {
        captured = messages
        yield { type: 'delta', text: '好呀' }
        yield { type: 'done', text: '好呀' }
      },
    }
    const store = new MemoryStore({ getConfig: () => cfg, llm, log: () => {} })
    const convo = store.getConversation('qq-private-10001', { title: 'QQ 私聊', channel: 'qq-private' })
    store.append(convo, 'user', '早上的旧消息')
    store.append(convo, 'assistant', '早上的旧回复')
    const daily = store.qqHistoryFile(convo)
    const rows = readJsonl(daily)
    rows[0].at = Date.now() - 240 * 60000
    fs.writeFileSync(daily, rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
    fs.writeFileSync(store.keyFile(convo.key), '')

    const store2 = new MemoryStore({ getConfig: () => cfg, llm, log: () => {} })
    await store2.chat({ key: convo.key, title: 'QQ 私聊', channel: 'qq-private', texts: ['刚刚回来', '在吗'] })
    assert.match(captured[0].content, /上下文重置/)
    assert.ok(captured.some((m) => m.content === '早上的旧消息'))
    assert.ok(captured.some((m) => m.content === '刚刚回来'))
    assert.ok(captured.some((m) => m.content === '在吗'))

    await store2.proactive({
      key: convo.key, title: 'QQ 私聊', channel: 'qq-private',
      extra: '你现在有点想主人。',
    })
    assert.ok(captured.some((m) => m.content === '早上的旧消息'))
    const after = readJsonl(store2.qqHistoryFile(convo))
    assert.equal(after[after.length - 1].role, 'assistant')
    assert.equal(after[after.length - 1].proactive, true)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('consolidateDaily compresses only dailies older than the threshold', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whale-consolidate-'))
  try {
    const cfg = makeConfig(root)
    cfg.memory.consolidateAfterDays = 14
    const p = ensureDataDirs(cfg)
    const old1 = '2026-01-01.md'
    const old2 = '2026-01-02.md'
    const today = `${localDateKey()}.md`
    for (const f of [old1, old2, today]) fs.writeFileSync(path.join(p.daily, f), `# 全天\n${f} 的内容\n`)
    const store = new MemoryStore({ getConfig: () => cfg, llm: fakeLLM(), log: () => {} })
    const r = await store.consolidateDaily()
    assert.equal(r.compressed, 2)
    assert.ok(!fs.existsSync(path.join(p.daily, old1)))
    assert.ok(!fs.existsSync(path.join(p.daily, old2)))
    assert.ok(fs.existsSync(path.join(p.daily, today)))
    assert.match(readText(p.important, ''), /第一次一起过生日/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
