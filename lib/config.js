import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  ensureDir, expandHome, hashText, localStamp, randomToken, readJson, readText,
  timeToMinutes, writeJsonAtomic, writeTextAtomic,
} from './util.js'

export const PLUGIN_NAME = 'dsh-whale-companion'
export const CONFIG_VERSION = 1

export const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
export const CONFIG_DIR = path.join(DSH_HOME, 'whale-companion')
export const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

// Prefer F: so a normal GitHub install does not fill the system drive. If F:
// is missing or not writable, fall back to the old per-user location instead
// of failing to start. WHALE_DATA_DIR can override this for portable installs.
export const F_DATA_DIR = 'F:\\DeepSeekBot\\whale-companion'
function chooseDefaultDataDir() {
  const override = process.env.WHALE_DATA_DIR
  if (override) return path.resolve(expandHome(override))
  try {
    if (fs.existsSync('F:\\')) {
      fs.accessSync('F:\\', fs.constants.W_OK)
      const parent = 'F:\\DeepSeekBot'
      fs.mkdirSync(parent, { recursive: true })
      fs.accessSync(parent, fs.constants.W_OK)
      return F_DATA_DIR
    }
  } catch {}
  return CONFIG_DIR
}
export const DEFAULT_DATA_DIR = chooseDefaultDataDir()

export const DEFAULT_CONFIG = {
  version: CONFIG_VERSION,
  dataDir: DEFAULT_DATA_DIR,
  windowToken: '',
  owner: {
    name: '主人',
    qq: '',
  },
  self: {
    name: '小肥鱼',
    qq: '',
  },
  persona: {
    file: '人设人格卡.md',
    locked: false,
    hash: '',
    updatedAt: null,
  },
  llm: {
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat',
    contextLimit: 64000,
    temperature: 1.15,
    maxTokens: 1000,
    timeoutMs: 120000,
  },
  qq: {
    enabled: false,
    wsUrl: 'ws://127.0.0.1:3001',
    httpUrl: '',
    token: '',
    groups: ['', '', ''],
    reconnect: true,
    replyAt: true,
    maxReplyChars: 900,
  },
  pet: {
    enabled: true,
    scale: 1,
    alwaysOnTop: true,
    chromaKey: true,
    outfit: 'maid',
    touchCooldownMs: 450,
    speechMs: 9000,
    showToolbar: true,
  },
  schedule: {
    enabled: true,
    wake: '07:30',
    sleep: '22:30',
    freeEnabled: true,
    freeMinGapMin: 25,
    freeMaxGapMin: 55,
    missOwnerAfterMin: 120,
  },
  memory: {
    maxDailyRead: 7,
    maxDailyChars: 9000,
    maxConversationChars: 5000,
    importantMaxChars: 7000,
    keepConversationFiles: true,
    consolidateAfterDays: 14,
  },
  free: {
    enabled: true,
    booksDir: '',
    maxGameMinutesPerDay: 30,
    keepDays: 14,
    allowPython: true,
    maxCodeBytes: 20480,
    activities: {
      draw: true,
      codeGame: true,
      readBook: true,
      appreciate: true,
      playGame: true,
      clean: true,
      missOwner: true,
    },
  },
  ui: {
    theme: 'auto',
  },
}

const clone = (v) => JSON.parse(JSON.stringify(v))

export function mergeDeep(base, over) {
  if (Array.isArray(over)) return clone(over)
  if (over && typeof over === 'object') {
    const out = { ...(base && typeof base === 'object' ? base : {}) }
    for (const [k, v] of Object.entries(over)) {
      out[k] = v && typeof v === 'object' && !Array.isArray(v) ? mergeDeep(base?.[k] ?? {}, v) : v
    }
    return out
  }
  return over === undefined ? clone(base) : over
}

export function loadConfig() {
  let user = {}
  try { user = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch {}
  const cfg = mergeDeep(DEFAULT_CONFIG, user || {})
  if (!cfg.windowToken || typeof cfg.windowToken !== 'string') {
    cfg.windowToken = randomToken(24)
    try { writeJsonAtomic(CONFIG_FILE, cfg, 0o600) } catch {}
  }
  return cfg
}

export function saveConfig(cfg) {
  ensureDir(path.dirname(CONFIG_FILE))
  writeJsonAtomic(CONFIG_FILE, cfg, 0o600)
  return cfg
}

export function resolveDataDir(cfg) {
  const configured = expandHome(cfg?.dataDir)
  return path.resolve(configured || DEFAULT_DATA_DIR)
}

export function dataPaths(cfg) {
  const root = resolveDataDir(cfg)
  return {
    root,
    persona: path.join(root, '人设人格卡.md'),
    memory: path.join(root, '记忆卡'),
    important: path.join(root, '记忆卡', '重要信息记忆.md'),
    daily: path.join(root, '记忆卡', '全天总结日记'),
    conversationSummaries: path.join(root, '记忆卡', '单轮对话总结日记'),
    freeLog: path.join(root, '记忆卡', '自由活动日志'),
    temp: path.join(root, '记忆卡', '临时记忆'),
    conversations: path.join(root, '对话历史'),
    free: path.join(root, '自由活动'),
    art: path.join(root, '自由活动', '画'),
    games: path.join(root, '自由活动', '游戏'),
    books: path.join(root, '书'),
    logs: path.join(root, '日志'),
    state: path.join(root, '状态.json'),
    edge: path.join(root, '窗口缓存'),
    exports: path.join(root, '导出'),
  }
}

export function ensureDataDirs(cfg) {
  const p = dataPaths(cfg)
  for (const d of [p.root, p.memory, p.daily, p.conversationSummaries, p.freeLog, p.temp,
    p.conversations, p.free, p.art, p.games, p.books, p.logs, p.edge, p.exports]) {
    ensureDir(d)
  }
  if (!fs.existsSync(p.important)) {
    writeTextAtomic(p.important,
      '# 重要信息记忆\n\n> 这里只记主人明确说过、且长期有用的事：喜欢/讨厌、习惯、重要的人、近期发生的事。\n> 小肥鱼会在每次对话前读它。\n\n（还没有内容）\n')
  }
  if (!fs.existsSync(p.persona)) {
    writeTextAtomic(p.persona,
      '# 人设人格卡（固定）\n\n> 第一次请在这里写下她是谁。保存后，再修改必须连续确认三次。\n\n')
  }
  const booksReadme = path.join(p.books, '把书放这里.txt')
  if (!fs.existsSync(booksReadme)) {
    writeTextAtomic(booksReadme,
      '把你想让她读的 .txt 文件放进这个文件夹。\n她只会读，不会删除这里的任何书。\n\n她自己的画和游戏在「自由活动」文件夹里。\n')
  }
  return p
}

export function getPersona(cfg) {
  const p = dataPaths(cfg)
  return readText(p.persona, '')
}

export function savePersona(cfg, text, confirmations = 0) {
  const p = dataPaths(cfg)
  const previous = readText(p.persona, '')
  const next = String(text ?? '')
  if (next.length > 20000) throw new Error('人设最长 20000 字')
  const meaningfulPrevious = previous.replace(/^#.*$/gm, '').replace(/>.*$/gm, '').trim()
  const changed = next.trim() !== previous.trim()
  if (meaningfulPrevious && changed && Number(confirmations) < 3) {
    throw new Error('人设已存在。修改人设必须连续确认三次。')
  }
  writeTextAtomic(p.persona, next, 0o600)
  cfg.persona = {
    ...(cfg.persona || {}),
    locked: Boolean(meaningfulPrevious || next.trim()),
    hash: hashText(next),
    updatedAt: localStamp(),
  }
  saveConfig(cfg)
  return { bytes: Buffer.byteLength(next, 'utf8'), updatedAt: cfg.persona.updatedAt }
}

function asString(v, fallback = '') {
  return typeof v === 'string' ? v : fallback
}

function asNumber(v, fallback, min, max) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function asBool(v, fallback) {
  return typeof v === 'boolean' ? v : fallback
}

/** Merge a settings-page payload into the current config, preserving secrets left blank. */
export function applyIncoming(current, incoming) {
  const next = mergeDeep(current, incoming && typeof incoming === 'object' ? incoming : {})
  next.version = CONFIG_VERSION
  next.windowToken = current.windowToken || next.windowToken || randomToken(24)
  // `publicConfig` adds display-only *Set flags; never persist them.
  for (const k of ['apiKeySet', 'tokenSet']) {
    delete next.llm?.[k]
    delete next.qq?.[k]
  }
  // Voice call was removed; drop the section from older config files.
  delete next.voice

  next.owner.name = asString(next.owner?.name, '主人').slice(0, 40) || '主人'
  next.owner.qq = asString(next.owner.qq, '').replace(/\D/g, '').slice(0, 20)
  next.self.name = asString(next.self.name, '小肥鱼').slice(0, 40) || '小肥鱼'
  next.self.qq = asString(next.self.qq, '').replace(/\D/g, '').slice(0, 20)

  next.llm.baseUrl = asString(next.llm?.baseUrl, DEFAULT_CONFIG.llm.baseUrl).replace(/\/+$/, '')
  next.llm.model = asString(next.llm?.model, 'deepseek-chat').slice(0, 80) || 'deepseek-chat'
  next.llm.contextLimit = Math.round(asNumber(next.llm?.contextLimit, 64000, 8000, 200000))
  next.llm.temperature = asNumber(next.llm?.temperature, 1.15, 0, 2)
  next.llm.maxTokens = Math.round(asNumber(next.llm?.maxTokens, 1000, 64, 8192))
  next.llm.timeoutMs = Math.round(asNumber(next.llm?.timeoutMs, 120000, 10000, 600000))
  if (!asString(incoming?.llm?.apiKey, '').trim()) next.llm.apiKey = current.llm?.apiKey ?? ''

  next.qq.enabled = asBool(next.qq?.enabled, false)
  next.qq.wsUrl = asString(next.qq?.wsUrl, DEFAULT_CONFIG.qq.wsUrl).trim()
  next.qq.httpUrl = asString(next.qq?.httpUrl, '').trim().replace(/\/+$/, '')
  if (!asString(incoming?.qq?.token, '').trim()) next.qq.token = current.qq?.token ?? ''
  next.qq.groups = (Array.isArray(next.qq?.groups) ? next.qq.groups : [])
    .map((g) => asString(g, '').replace(/\D/g, '').slice(0, 20))
    .filter(Boolean)
    .slice(0, 3)
  while (next.qq.groups.length < 3) next.qq.groups.push('')
  next.qq.reconnect = asBool(next.qq?.reconnect, true)
  next.qq.replyAt = asBool(next.qq?.replyAt, true)
  next.qq.maxReplyChars = Math.round(asNumber(next.qq?.maxReplyChars, 900, 100, 4000))

  next.pet.enabled = asBool(next.pet?.enabled, true)
  next.pet.scale = asNumber(next.pet?.scale, 1, 0.6, 1.8)
  next.pet.alwaysOnTop = asBool(next.pet?.alwaysOnTop, true)
  next.pet.chromaKey = asBool(next.pet?.chromaKey, true)
  next.pet.outfit = ['maid', 'knit', 'winter'].includes(next.pet?.outfit) ? next.pet.outfit : 'maid'
  next.pet.touchCooldownMs = Math.round(asNumber(next.pet?.touchCooldownMs, 450, 150, 3000))
  next.pet.speechMs = Math.round(asNumber(next.pet?.speechMs, 9000, 2000, 30000))
  next.pet.showToolbar = asBool(next.pet?.showToolbar, true)

  next.schedule.enabled = asBool(next.schedule?.enabled, true)
  next.schedule.wake = /^\d{2}:\d{2}$/.test(next.schedule?.wake) ? next.schedule.wake : '07:30'
  next.schedule.sleep = /^\d{2}:\d{2}$/.test(next.schedule?.sleep) ? next.schedule.sleep : '22:30'
  if (timeToMinutes(next.schedule.wake, -1) < 0 || timeToMinutes(next.schedule.sleep, -1) < 0) {
    throw new Error('作息时间格式应为 HH:MM')
  }
  next.schedule.freeEnabled = asBool(next.schedule?.freeEnabled, true)
  next.schedule.freeMinGapMin = Math.round(asNumber(next.schedule?.freeMinGapMin, 25, 5, 240))
  next.schedule.freeMaxGapMin = Math.round(asNumber(next.schedule?.freeMaxGapMin, 55, next.schedule.freeMinGapMin + 1, 480))
  next.schedule.missOwnerAfterMin = Math.round(asNumber(next.schedule?.missOwnerAfterMin, 120, 20, 1440))

  next.memory.maxDailyRead = Math.round(asNumber(next.memory?.maxDailyRead, 7, 1, 60))
  next.memory.maxDailyChars = Math.round(asNumber(next.memory?.maxDailyChars, 9000, 1000, 40000))
  next.memory.maxConversationChars = Math.round(asNumber(next.memory?.maxConversationChars, 5000, 1000, 30000))
  next.memory.importantMaxChars = Math.round(asNumber(next.memory?.importantMaxChars, 7000, 1000, 30000))
  next.memory.keepConversationFiles = asBool(next.memory?.keepConversationFiles, true)
  next.memory.consolidateAfterDays = Math.round(asNumber(next.memory?.consolidateAfterDays, 14, 7, 90))

  next.free.enabled = asBool(next.free?.enabled, true)
  next.free.booksDir = asString(next.free?.booksDir, '').trim()
  // Hard cap: the owner asked for at most 30 minutes of games per day.
  next.free.maxGameMinutesPerDay = Math.round(asNumber(next.free?.maxGameMinutesPerDay, 30, 0, 30))
  next.free.keepDays = Math.round(asNumber(next.free?.keepDays, 14, 1, 365))
  next.free.allowPython = asBool(next.free?.allowPython, true)
  next.free.maxCodeBytes = Math.round(asNumber(next.free?.maxCodeBytes, 20480, 1024, 20480))
  for (const k of Object.keys(DEFAULT_CONFIG.free.activities)) {
    next.free.activities[k] = asBool(next.free?.activities?.[k], DEFAULT_CONFIG.free.activities[k])
  }

  next.ui.theme = ['auto', 'dark', 'light'].includes(next.ui?.theme) ? next.ui.theme : 'auto'
  return next
}

export function publicConfig(cfg) {
  const out = clone(cfg)
  out.llm.apiKey = ''
  out.llm.apiKeySet = Boolean(cfg.llm?.apiKey)
  out.qq.token = ''
  out.qq.tokenSet = Boolean(cfg.qq?.token)
  out.windowToken = ''
  return out
}

/** Resolve the DeepSeek key: explicit setting, env, or DSH's own credential store. */
export function resolveApiKey(cfg) {
  const explicit = String(cfg?.llm?.apiKey ?? '').trim()
  if (explicit) return explicit
  const env = String(process.env.DEEPSEEK_API_KEY ?? '').trim()
  if (env) return env
  try {
    const text = readText(path.join(DSH_HOME, '.credentials.yaml'), '')
    const m = text.match(/sk-[A-Za-z0-9]{16,}/)
    if (m) return m[0]
  } catch {}
  return ''
}

export function personaState(cfg) {
  const p = dataPaths(cfg)
  const text = readText(p.persona, '')
  // The shipped file starts with a heading and a blockquote; that is not a
  // persona yet. Only real body text counts as "already filled".
  const meaningful = text.replace(/^#.*$/gm, '').replace(/>.*$/gm, '').trim()
  return {
    text,
    bytes: Buffer.byteLength(text, 'utf8'),
    exists: meaningful.length > 0,
    locked: Boolean(cfg.persona?.locked),
    updatedAt: cfg.persona?.updatedAt ?? null,
  }
}
