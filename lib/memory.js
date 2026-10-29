import fs from 'node:fs'
import path from 'node:path'
import {
  appendJsonl, ensureDir, estimateMessages, estimateTokens, listFiles, localDateKey,
  localStamp, localTimeKey, readJsonl, readText, safeName, stripCodeFence, truncate,
  writeTextAtomic,
} from './util.js'
import { dataPaths, getPersona } from './config.js'
import {
  buildSystemPrompt, consolidatePrompt, dailyPrompt, importantPrompt, summaryPrompt,
} from './prompts.js'

const ROLE_LABEL = { user: '主人', assistant: '小肥鱼', system: '系统' }

function transcriptOf(rows) {
  return rows.map((m) => {
    const time = m.at ? new Date(m.at) : null
    const stamp = time ? `${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}` : ''
    return `[${stamp}] ${ROLE_LABEL[m.role] ?? m.role}：${m.content}`
  }).join('\n\n')
}

export class MemoryStore {
  constructor({ getConfig, llm, log = () => {} }) {
    this.getConfig = getConfig
    this.llm = llm
    this.log = log
    this.convos = new Map()
    this.locks = new Map()
  }

  paths() {
    return dataPaths(this.getConfig())
  }

  keyFile(key) {
    return path.join(this.paths().conversations, `${safeName(key, 'chat')}.jsonl`)
  }

  tempFile(key) {
    return path.join(this.paths().temp, `${safeName(key, 'chat')}.jsonl`)
  }

  summaryFile(key, title, date = new Date()) {
    const dir = this.paths().conversationSummaries
    const name = `${localDateKey(date)}-${localTimeKey(date).replace(':', '')}-${safeName(title || key, '对话')}.md`
    return path.join(dir, name)
  }

  async withLock(key, fn) {
    const prev = this.locks.get(key) ?? Promise.resolve()
    let release
    const gate = new Promise((r) => { release = r })
    const next = prev.then(() => gate)
    this.locks.set(key, next)
    await prev
    try {
      return await fn()
    } finally {
      release()
      if (this.locks.get(key) === next) this.locks.delete(key)
    }
  }

  getConversation(key, meta = {}) {
    if (this.convos.has(key)) {
      const c = this.convos.get(key)
      if (meta.title) c.title = meta.title
      if (meta.channel) c.channel = meta.channel
      return c
    }
    const file = this.keyFile(key)
    const rows = readJsonl(file, 80)
    const convo = {
      key,
      title: meta.title || key,
      channel: meta.channel || key,
      messages: rows,
      archive: this.tempFile(key),
      abort: null,
      createdAt: rows[0]?.at ?? Date.now(),
      lastActivity: rows[rows.length - 1]?.at ?? Date.now(),
      finalized: false,
    }
    this.convos.set(key, convo)
    return convo
  }

  systemFor(convo, extra = '') {
    const cfg = this.getConfig()
    const p = this.paths()
    const persona = truncate(getPersona(cfg), 7000)
    const important = truncate(readText(p.important, ''), cfg.memory.importantMaxChars)
    const daily = []
    const dailyFiles = listFiles(p.daily, (n) => n.endsWith('.md')).sort().slice(-cfg.memory.maxDailyRead)
    let dailyChars = 0
    for (const f of dailyFiles) {
      const text = truncate(readText(f, ''), 1200)
      if (dailyChars + text.length > cfg.memory.maxDailyChars) break
      daily.push(`### ${path.basename(f, '.md')}\n${text}`)
      dailyChars += text.length
    }
    const conv = []
    let convChars = 0
    const today = localDateKey()
    const convFiles = listFiles(p.conversationSummaries, (n) => n.startsWith(today) && n.endsWith('.md')).sort()
    for (const f of convFiles) {
      const text = truncate(readText(f, ''), 1200)
      if (convChars + text.length > cfg.memory.maxConversationChars) break
      conv.push(`### ${path.basename(f, '.md')}\n${text}`)
      convChars += text.length
    }
    const state = globalThis.__whaleState ?? {}
    return buildSystemPrompt({
      config: cfg,
      persona,
      important,
      dailySummaries: daily,
      conversationSummaries: conv,
      channel: convo.channel,
      state,
      extra,
    })
  }

  /** Read the newest verbatim messages from the temp archive, oldest first. */
  archiveTail(convo, maxTokens = 3000) {
    try {
      const rows = readJsonl(convo.archive, 80)
      const out = []
      let used = 0
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i]
        if (!row || (row.role !== 'user' && row.role !== 'assistant')) continue
        const cost = estimateTokens(row.content) + 6
        if (used + cost > maxTokens) break
        out.unshift({ role: row.role, content: String(row.content ?? '') })
        used += cost
      }
      return out
    } catch {
      return []
    }
  }

  /** system + verbatim archive (newest part that fits) + live window. */
  requestMessages(convo, system) {
    const cfg = this.getConfig()
    const max = cfg.llm.contextLimit - cfg.llm.maxTokens - 400
    const archive = this.archiveTail(convo, Math.max(0, Math.min(5000, Math.floor(max * 0.3))))
    const window = convo.messages.map((m) => ({ role: m.role, content: m.content }))
    while (archive.length) {
      const all = [{ role: 'system', content: system }, ...archive, ...window]
      if (estimateMessages(all) <= max) break
      archive.shift()
    }
    return [{ role: 'system', content: system }, ...archive, ...window]
  }

  append(convo, role, content) {
    const seq = (convo.messages[convo.messages.length - 1]?.seq ?? 0) + 1
    const msg = { seq, at: Date.now(), role, content: String(content ?? '') }
    convo.messages.push(msg)
    convo.lastActivity = msg.at
    appendJsonl(this.keyFile(convo.key), msg)
    return msg
  }

  trim(convo) {
    const cfg = this.getConfig()
    const system = this.systemFor(convo)
    const reserve = Math.max(500, Number(cfg.llm.maxTokens) || 1000)
    const budget = Math.max(2000, cfg.llm.contextLimit - reserve - estimateTokens(system) - 300)
    let used = estimateMessages(convo.messages.map((m) => ({ role: m.role, content: m.content })))
    let moved = 0
    while (used > budget && convo.messages.length > 2) {
      const old = convo.messages.shift()
      appendJsonl(convo.archive, old)
      used -= estimateTokens(old.content) + 6
      moved++
    }
    if (moved) this.log(`[memory] ${convo.key}: 上下文窗口满，${moved} 条最早消息已原样写入临时记忆 ${convo.archive}`)
    return moved
  }

  async *chatStream({ key, title, channel, text, signal, extra = '' }) {
    const convo = this.getConversation(key, { title, channel })
    const cfg = this.getConfig()
    this.append(convo, 'user', text)
    this.trim(convo)
    const system = this.systemFor(convo, extra)
    const messages = this.requestMessages(convo, system)
    const controller = new AbortController()
    convo.abort = controller
    const merged = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal
    let full = ''
    let usage = null
    try {
      for await (const chunk of this.llm.stream(messages, { signal: merged })) {
        if (chunk.type === 'delta') {
          full += chunk.text
          yield { type: 'delta', text: chunk.text }
        } else if (chunk.type === 'done') {
          usage = chunk.usage
        }
      }
      this.append(convo, 'assistant', full)
      yield { type: 'done', text: full, usage, conversation: key }
    } catch (err) {
      if (err?.code === 'ABORTED') {
        yield { type: 'aborted', text: full }
        return
      }
      throw err
    } finally {
      if (convo.abort === controller) convo.abort = null
    }
  }

  async chat({ key, title, channel, text, signal, extra = '' }) {
    const convo = this.getConversation(key, { title, channel })
    this.append(convo, 'user', text)
    this.trim(convo)
    const system = this.systemFor(convo, extra)
    const messages = this.requestMessages(convo, system)
    const controller = new AbortController()
    convo.abort = controller
    const merged = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal
    try {
      const result = await this.llm.call(messages, { signal: merged })
      this.append(convo, 'assistant', result.text)
      return result
    } finally {
      if (convo.abort === controller) convo.abort = null
    }
  }

  lastUserAt() {
    let max = 0
    for (const convo of this.convos.values()) {
      for (const m of convo.messages) {
        if (m.role === 'user') max = Math.max(max, Number(m.at) || 0)
      }
    }
    return max
  }

  abort(key) {
    const convo = this.convos.get(key)
    if (convo?.abort) {
      try { convo.abort.abort() } catch {}
      return true
    }
    return false
  }

  async summarizeTranscript(title, channel, transcript) {
    if (transcript.length <= 26000) {
      return (await this.llm.call([
        { role: 'system', content: '你是一个精确、克制的记忆整理员。' },
        { role: 'user', content: summaryPrompt({ title, channel, transcript }) },
      ], { maxTokens: 1400, temperature: 0.4 })).text
    }
    const chunks = []
    let rest = transcript
    while (rest.length) {
      let cut = rest.lastIndexOf('\n\n', 24000)
      if (cut < 8000) cut = 24000
      chunks.push(rest.slice(0, cut))
      rest = rest.slice(cut).trim()
    }
    const partials = []
    for (let i = 0; i < chunks.length; i++) {
      const r = await this.llm.call([
        { role: 'system', content: '你是一个精确、克制的记忆整理员。' },
        { role: 'user', content: summaryPrompt({ title: `${title}（第 ${i + 1}/${chunks.length} 段）`, channel, transcript: chunks[i] }) },
      ], { maxTokens: 900, temperature: 0.4 })
      partials.push(`### 第 ${i + 1} 段\n${r.text}`)
    }
    const r = await this.llm.call([
      { role: 'system', content: '你是一个精确、克制的记忆整理员。把分段总结合并成一份，不要丢主人透露的事实。' },
      { role: 'user', content: `对话标题：${title}\n通道：${channel}\n\n${partials.join('\n\n')}\n\n请合并成 300–900 字的单轮总结，结构：这次聊了什么 / 主人透露的信息 / 小肥鱼的表现 / 未完成的事。` },
    ], { maxTokens: 1400, temperature: 0.4 })
    return r.text
  }

  async finalize(key, reason = 'close') {
    return this.withLock(key, async () => {
      const convo = this.convos.get(key)
      const file = this.keyFile(key)
      const rows = readJsonl(file)
      if (!rows.length) {
        this.convos.delete(key)
        try { fs.rmSync(this.tempFile(key), { force: true }) } catch {}
        return null
      }
      const title = convo?.title || key
      const channel = convo?.channel || key
      const transcript = transcriptOf(rows)
      const summary = stripCodeFence(await this.summarizeTranscript(title, channel, transcript))
      const out = this.summaryFile(key, title)
      writeTextAtomic(out, `# 单轮对话总结 · ${title}\n\n> 通道：${channel} · 结束方式：${reason} · ${localStamp()}\n\n${summary}\n`)
      try {
        await this.updateImportant(summary)
      } catch (err) {
        this.log(`[memory] 更新重要信息失败（保留单轮总结）：${err.message}`)
      }
      try { fs.rmSync(this.tempFile(key), { force: true }) } catch {}
      const archived = path.join(this.paths().conversations, `已归档-${safeName(title, key)}-${Date.now()}.jsonl`)
      try {
        if (this.getConfig().memory.keepConversationFiles) fs.renameSync(file, archived)
        else fs.rmSync(file, { force: true })
      } catch {}
      this.convos.delete(key)
      this.log(`[memory] 单轮总结已写入 ${out}`)
      return out
    })
  }

  async finalizeAll(reason = 'sleep') {
    const keys = new Set(this.convos.keys())
    for (const f of listFiles(this.paths().conversations, (n) => n.endsWith('.jsonl') && !n.startsWith('已归档-'))) {
      keys.add(path.basename(f, '.jsonl'))
    }
    const out = []
    for (const key of keys) {
      if (key === 'pet-touch') continue
      try {
        const r = await this.finalize(key, reason)
        if (r) out.push(r)
      } catch (err) {
        this.log(`[memory] 结束对话 ${key} 失败：${err.message}`)
      }
    }
    return out
  }

  async updateImportant(summary) {
    const p = this.paths()
    const existing = readText(p.important, '')
    const r = await this.llm.call([
      { role: 'system', content: '你是一个精确、克制的长期记忆整理员。' },
      { role: 'user', content: importantPrompt({ existing, summary }) },
    ], { maxTokens: 1800, temperature: 0.3 })
    const text = stripCodeFence(r.text).slice(0, this.getConfig().memory.importantMaxChars)
    writeTextAtomic(p.important, text.endsWith('\n') ? text : text + '\n')
    return text
  }

  async finalizeDay(date = localDateKey()) {
    const p = this.paths()
    const convFiles = listFiles(p.conversationSummaries, (n) => n.startsWith(date) && n.endsWith('.md')).sort()
    const freeFile = path.join(p.freeLog, `${date}.md`)
    const freeLog = readText(freeFile, '')
    if (!convFiles.length && !freeLog.trim()) return null
    const conversations = convFiles.map((f) => `### ${path.basename(f, '.md')}\n${readText(f, '')}`).join('\n\n')
    const r = await this.llm.call([
      { role: 'system', content: '你在写小肥鱼的全天总结日记。保留具体细节，不要编造。' },
      { role: 'user', content: dailyPrompt({ date, conversations, freeLog }) },
    ], { maxTokens: 1800, temperature: 0.7 })
    const text = stripCodeFence(r.text)
    const out = path.join(p.daily, `${date}.md`)
    writeTextAtomic(out, `# 全天总结日记 · ${date}\n\n${text}\n`)
    for (const f of convFiles) {
      try { fs.rmSync(f, { force: true }) } catch {}
    }
    try { fs.rmSync(freeFile, { force: true }) } catch {}
    this.log(`[memory] 全天总结已写入 ${out}，已清理 ${convFiles.length} 份单轮总结和自由活动日志`)
    return out
  }

  async consolidateDaily() {
    const cfg = this.getConfig()
    const p = this.paths()
    const days = Math.max(7, Math.min(90, Number(cfg.memory?.consolidateAfterDays) || 14))
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - days)
    const files = listFiles(p.daily, (n) => /^\d{4}-\d{2}-\d{2}\.md$/.test(n))
      .filter((f) => {
        const d = new Date(`${path.basename(f, '.md')}T00:00:00`)
        return Number.isFinite(d.getTime()) && d < cutoff
      })
      .sort()
    if (!files.length) return { ok: true, compressed: 0, files: [] }

    let compressed = 0
    const removed = []
    for (let i = 0; i < files.length; i += 8) {
      const batch = files.slice(i, i + 8)
      const existing = readText(p.important, '')
      const dailies = batch.map((f) => `### ${path.basename(f, '.md')}\n${truncate(readText(f, ''), 2600)}`).join('\n\n')
      const r = await this.llm.call([
        { role: 'system', content: '你是一个像人脑一样会遗忘琐事、只保留重要片段的长期记忆整理员。' },
        { role: 'user', content: consolidatePrompt({ existing, dailies, days }) },
      ], { maxTokens: 1800, temperature: 0.3 })
      const text = stripCodeFence(r.text).slice(0, cfg.memory.importantMaxChars)
      writeTextAtomic(p.important, text.endsWith('\n') ? text : text + '\n')
      for (const f of batch) {
        try { fs.rmSync(f, { force: true }); removed.push(path.basename(f)); compressed++ } catch {}
      }
    }
    if (compressed) this.log(`[memory] 已把 ${compressed} 份超过 ${days} 天的全天总结压缩进重要信息记忆`)
    return { ok: true, compressed, files: removed }
  }

  history(key, limit = 80) {
    return readJsonl(this.keyFile(key), limit)
  }

  memoryList() {
    const p = this.paths()
    const rel = (f) => path.relative(p.root, f).replaceAll('\\', '/')
    const items = []
    for (const f of listFiles(p.memory, (n) => n.endsWith('.md'))) {
      const st = safeStat(f)
      items.push({ kind: 'important', name: path.basename(f), path: rel(f), bytes: st.size, mtime: st.mtime })
    }
    for (const [kind, dir] of [['daily', p.daily], ['conversation', p.conversationSummaries], ['free', p.freeLog]]) {
      for (const f of listFiles(dir, (n) => n.endsWith('.md'))) {
        const st = safeStat(f)
        items.push({ kind, name: path.basename(f), path: rel(f), bytes: st.size, mtime: st.mtime })
      }
    }
    return items.sort((a, b) => String(b.mtime).localeCompare(String(a.mtime)))
  }

  readMemory(relPath) {
    const p = this.paths()
    const target = path.resolve(p.root, String(relPath || ''))
    if (!target.startsWith(p.root + path.sep) && target !== p.root) throw new Error('路径越界')
    if (!/\.(md|txt|json|jsonl)$/i.test(target)) throw new Error('只能读取文本记忆文件')
    return readText(target, '')
  }

  writeImportant(text) {
    const p = this.paths()
    const next = String(text ?? '').slice(0, this.getConfig().memory.importantMaxChars)
    writeTextAtomic(p.important, next.endsWith('\n') ? next : next + '\n')
    return next
  }

  appendFreeLog(entry) {
    const p = this.paths()
    const date = localDateKey()
    const file = path.join(p.freeLog, `${date}.md`)
    ensureDir(path.dirname(file))
    if (!fs.existsSync(file)) {
      writeTextAtomic(file, `# 自由活动日志 · ${date}\n\n`)
    }
    fs.appendFileSync(file, `\n## ${localTimeKey()}\n\n${entry}\n`, 'utf8')
    return file
  }

  freeLogToday() {
    return readText(path.join(this.paths().freeLog, `${localDateKey()}.md`), '')
  }
}

function safeStat(file) {
  try {
    const st = fs.statSync(file)
    return { size: st.size, mtime: st.mtime.toISOString() }
  } catch {
    return { size: 0, mtime: null }
  }
}
