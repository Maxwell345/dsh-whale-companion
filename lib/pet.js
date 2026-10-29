import path from 'node:path'
import { dataPaths } from './config.js'
import { ACTION_TAGS, buildSystemPrompt, touchUserPrompt } from './prompts.js'
import {
  ensureDir, extractJson, localDateKey, localStamp, readJson, readText, truncate, writeJsonAtomic,
} from './util.js'

const OUTFITS = ['maid', 'knit', 'winter']

function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(Number(n) || 0)))
}

function inferAction(text) {
  const s = String(text ?? '')
  if (/喷水|水花|哗啦|喷泉/.test(s)) return 'spray'
  if (/转圈|转个圈|旋转/.test(s)) return 'spin'
  if (/尾巴/.test(s)) return 'tail'
  if (/耳朵/.test(s)) return 'ear'
  if (/害羞|脸红|羞/.test(s)) return 'shy'
  if (/哼|生气|讨厌|不理你|腻/.test(s)) return 'pout'
  if (/困|睡|哈欠/.test(s)) return 'sleepy'
  if (/开心|舒服|喜欢|好耶|贴贴|蹭/.test(s)) return 'happy'
  if (/跳舞|转起来/.test(s)) return 'dance'
  return 'happy'
}

export class PetService {
  constructor({ getConfig, saveConfig, llm, memory, log = () => {} }) {
    this.getConfig = getConfig
    this.saveConfig = saveConfig
    this.llm = llm
    this.memory = memory
    this.log = log
    this.asleep = false
    this.touchDate = localDateKey()
    this.touchMessages = this.loadTouchContext()
    this.state = this.loadState()
  }

  get stateFile() {
    return path.join(dataPaths(this.getConfig()).root, '桌宠状态.json')
  }

  get touchFile() {
    return path.join(dataPaths(this.getConfig()).root, '抚摸上下文.json')
  }

  loadTouchContext() {
    const today = localDateKey()
    const raw = readJson(this.touchFile, null)
    if (raw?.date === today && Array.isArray(raw.messages)) {
      this.touchDate = today
      return raw.messages.slice(-24)
    }
    return []
  }

  saveTouchContext() {
    writeJsonAtomic(this.touchFile, { date: this.touchDate, messages: this.touchMessages.slice(-24) })
  }

  ensureTouchDay() {
    const today = localDateKey()
    if (this.touchDate !== today) {
      this.touchDate = today
      this.touchMessages = []
      this.saveTouchContext()
    }
  }

  loadState() {
    const raw = readJson(this.stateFile, null)
    return {
      mood: clamp(raw?.mood ?? 72),
      affection: clamp(raw?.affection ?? 55),
      energy: clamp(raw?.energy ?? 78),
      outfit: OUTFITS.includes(raw?.outfit) ? raw.outfit : (this.getConfig().pet?.outfit || 'maid'),
      lastTouchAt: Number(raw?.lastTouchAt) || 0,
      lastZone: String(raw?.lastZone ?? ''),
      streak: Number(raw?.streak) || 0,
      totalTouches: Number(raw?.totalTouches) || 0,
      updatedAt: raw?.updatedAt ?? null,
    }
  }

  saveState() {
    this.state.updatedAt = localStamp()
    writeJsonAtomic(this.stateFile, this.state)
    globalThis.__whaleState = this.publicState()
  }

  setAsleep(asleep) {
    this.asleep = Boolean(asleep)
    if (this.asleep) {
      this.touchMessages = []
      this.touchDate = localDateKey()
      this.saveTouchContext()
      this.state.streak = 0
      this.state.lastZone = ''
      this.state.energy = clamp(this.state.energy + 6)
      this.saveState()
    }
  }

  setOutfit(outfit) {
    if (!OUTFITS.includes(outfit)) throw new Error('未知服装')
    this.state.outfit = outfit
    const cfg = this.getConfig()
    cfg.pet.outfit = outfit
    this.saveConfig(cfg)
    this.saveState()
    return this.publicState()
  }

  publicState() {
    const cfg = this.getConfig()
    return {
      asleep: this.asleep,
      mood: this.state.mood,
      affection: this.state.affection,
      energy: this.state.energy,
      outfit: this.state.outfit,
      outfits: OUTFITS,
      streak: this.state.streak,
      totalTouches: this.state.totalTouches,
      lastTouchAt: this.state.lastTouchAt,
      speechMs: cfg.pet?.speechMs ?? 9000,
    }
  }

  async touch({ zone = 'head', n = 1 } = {}) {
    this.ensureTouchDay()
    const cfg = this.getConfig()
    if (!cfg.pet?.enabled) return { ok: false, error: '桌宠互动已关闭' }
    if (this.asleep) {
      return {
        ok: true,
        asleep: true,
        text: '唔……睡着了……（尾巴轻轻卷了一下）',
        actions: ['sleepy'],
        state: this.publicState(),
      }
    }
    const now = Date.now()
    const gapSec = this.state.lastTouchAt ? Math.max(0, Math.round((now - this.state.lastTouchAt) / 1000)) : 999
    if (this.state.lastZone === zone && now - this.state.lastTouchAt < 120000) this.state.streak += 1
    else this.state.streak = 1
    this.state.lastZone = zone
    this.state.lastTouchAt = now
    this.state.totalTouches += Math.max(1, Math.min(5, Number(n) || 1))
    this.state.mood = clamp(this.state.mood + 2)
    this.state.affection = clamp(this.state.affection + 1)
    if (this.state.streak >= 4) this.state.mood = clamp(this.state.mood - 1)
    this.saveState()

    const recent = this.touchMessages
      .filter((m) => m.role === 'user' && m.zone)
      .slice(-6)
      .map((m) => ({ zone: m.zone, action: m.action }))

    const system = buildSystemPrompt({
      config: cfg,
      persona: truncate(readText(dataPaths(cfg).persona, ''), 6000),
      important: truncate(readText(dataPaths(cfg).important, ''), cfg.memory.importantMaxChars),
      dailySummaries: [],
      conversationSummaries: [],
      channel: 'pet-touch',
      state: this.publicState(),
    })
    const user = touchUserPrompt({
      zone, streak: this.state.streak, gapSec, recent,
      mood: this.state.mood, affection: this.state.affection,
    })
    const messages = [
      { role: 'system', content: system },
      ...this.touchMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: user },
    ]

    let raw = ''
    try {
      const r = await this.llm.call(messages, { maxTokens: 320, temperature: 1.25 })
      raw = r.text
    } catch (err) {
      this.log(`[pet] 抚摸互动调用失败：${err.message}`)
      const fallback = this.fallbackTouch(zone, this.state.streak)
      this.pushTouch(zone, fallback.text, fallback.actions)
      return { ok: true, ...fallback, state: this.publicState(), degraded: true }
    }

    const parsed = extractJson(raw)
    let text = String(parsed?.text ?? raw ?? '').trim()
    let actions = Array.isArray(parsed?.actions) ? parsed.actions.filter((a) => ACTION_TAGS.includes(a)) : []
    if (!actions.length) actions = [inferAction(text)]
    if (!text) text = this.fallbackTouch(zone, this.state.streak).text
    text = truncate(text.replace(/^["“]|["”]$/g, ''), 120)
    const moodDelta = clamp(parsed?.moodDelta ?? 1, -8, 8)
    const affDelta = clamp(parsed?.affectionDelta ?? 1, -5, 6)
    this.state.mood = clamp(this.state.mood + moodDelta)
    this.state.affection = clamp(this.state.affection + affDelta)
    if (this.state.streak >= 3) this.state.affection = clamp(this.state.affection - 1)
    this.saveState()
    this.pushTouch(zone, text, actions)

    return { ok: true, text, actions: actions.slice(0, 2), state: this.publicState() }
  }

  pushTouch(zone, text, actions = []) {
    const at = Date.now()
    this.touchMessages.push({ role: 'user', content: `[桌宠互动] ${zone}`, zone, action: actions[0], at })
    // Keep the action tags in the assistant turn too: the next touch sees what
    // she actually did last time, which is what makes repeated pats get stale.
    this.touchMessages.push({
      role: 'assistant',
      content: JSON.stringify({ text, actions: actions.slice(0, 2) }),
      at,
    })
    this.touchMessages = this.touchMessages.slice(-24)
    this.saveTouchContext()
  }

  fallbackTouch(zone, streak) {
    if (streak >= 5) {
      return { text: '呜……再摸就要秃了啦！', actions: ['pout'] }
    }
    if (streak >= 3) {
      return { text: '哼，人家又不是抱枕……', actions: ['pout'] }
    }
    const table = {
      head: { text: '嘿嘿……再摸一下下。', actions: ['happy'] },
      ear: { text: '呀！耳朵很敏感的！', actions: ['shy', 'ear'] },
      belly: { text: '肚、肚子不行啦，好痒！', actions: ['shy'] },
      tail: { text: '尾巴不可以乱摸！……就一下哦。', actions: ['tail', 'shy'] },
      cheek: { text: '唔，戳脸会变胖的。', actions: ['pout'] },
      hand: { text: '牵、牵手……也不是不行。', actions: ['heart'] },
      back: { text: '呼……好舒服。', actions: ['happy'] },
    }
    return table[zone] ?? table.head
  }
}

export { OUTFITS }
