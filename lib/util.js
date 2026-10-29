import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function nowIso() {
  return new Date().toISOString()
}

export function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function localTimeKey(d = new Date()) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function localStamp(d = new Date()) {
  return `${localDateKey(d)} ${localTimeKey(d)}`
}

export function timeToMinutes(text, fallback = 0) {
  const m = String(text ?? '').match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return fallback
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return fallback
  return h * 60 + min
}

export function minutesToTime(minutes) {
  const total = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export function writeJsonAtomic(file, value, mode = 0o600) {
  ensureDir(path.dirname(file))
  const tmp = `${file}.${crypto.randomUUID()}.tmp`
  try {
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8')
    try { fs.chmodSync(tmp, mode) } catch {}
    fs.renameSync(tmp, file)
  } finally {
    try { fs.rmSync(tmp, { force: true }) } catch {}
  }
}

export function readText(file, fallback = '') {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return fallback
  }
}

export function writeTextAtomic(file, text, mode = 0o600) {
  ensureDir(path.dirname(file))
  const tmp = `${file}.${crypto.randomUUID()}.tmp`
  try {
    fs.writeFileSync(tmp, text, 'utf8')
    try { fs.chmodSync(tmp, mode) } catch {}
    fs.renameSync(tmp, file)
  } finally {
    try { fs.rmSync(tmp, { force: true }) } catch {}
  }
}

export function appendJsonl(file, value) {
  ensureDir(path.dirname(file))
  fs.appendFileSync(file, JSON.stringify(value) + '\n', 'utf8')
}

export function readJsonl(file, limit = 0) {
  let text = ''
  try { text = fs.readFileSync(file, 'utf8') } catch { return [] }
  const lines = text.split(/\r?\n/).filter(Boolean)
  const slice = limit > 0 ? lines.slice(-limit) : lines
  const out = []
  for (const line of slice) {
    try { out.push(JSON.parse(line)) } catch {}
  }
  return out
}

export function listFiles(dir, predicate = () => true) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && predicate(d.name))
      .map((d) => path.join(dir, d.name))
  } catch {
    return []
  }
}

export function safeName(text, fallback = 'item') {
  const cleaned = String(text ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return cleaned || fallback
}

export function stripCodeFence(text) {
  let s = String(text ?? '').trim()
  s = s.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '').replace(/\n?```\s*$/, '')
  return s.trim()
}

export function extractJson(text) {
  const s = String(text ?? '')
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first >= 0 && last > first) {
    try { return JSON.parse(s.slice(first, last + 1)) } catch {}
  }
  return null
}

export function truncate(text, max) {
  const s = String(text ?? '')
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)) + '…'
}

export function estimateTokens(text) {
  const s = String(text ?? '')
  let cjk = 0
  let ascii = 0
  for (const ch of s) {
    const code = ch.codePointAt(0)
    if (code <= 0x7f) ascii++
    else cjk++
  }
  return Math.ceil(cjk + ascii / 3.5)
}

export function estimateMessages(messages) {
  let total = 0
  for (const m of messages) {
    total += 6
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '')
    total += estimateTokens(content)
  }
  return total
}

export function splitMessage(text, limit = 700) {
  const s = String(text ?? '').trim()
  if (s.length <= limit) return s ? [s] : []
  const parts = []
  let rest = s
  while (rest.length > limit) {
    let cut = rest.lastIndexOf('\n', limit)
    if (cut < Math.floor(limit * 0.5)) cut = rest.lastIndexOf('。', limit)
    if (cut < Math.floor(limit * 0.5)) cut = rest.lastIndexOf('！', limit)
    if (cut < Math.floor(limit * 0.5)) cut = limit
    parts.push(rest.slice(0, cut + 1).trim())
    rest = rest.slice(cut + 1).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

export function isInside(parent, child) {
  const p = path.resolve(parent)
  const c = path.resolve(child)
  if (p === c) return false
  return c.startsWith(p.endsWith(path.sep) ? p : p + path.sep)
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url')
}

export function hashText(text) {
  return crypto.createHash('sha256').update(String(text ?? '')).digest('hex')
}

export function expandHome(p) {
  const s = String(p ?? '').trim()
  if (!s) return s
  if (s === '~') return process.env.USERPROFILE || process.env.HOME || s
  if (s.startsWith('~/') || s.startsWith('~\\')) {
    return path.join(process.env.USERPROFILE || process.env.HOME || '', s.slice(2))
  }
  return s
}

export function makeLogger(file) {
  return (message) => {
    const line = `[${nowIso()}] ${message}`
    try { console.log(`[whale] ${message}`) } catch {}
    if (!file) return
    try {
      ensureDir(path.dirname(file))
      fs.appendFileSync(file, line + '\n', 'utf8')
    } catch {}
  }
}

export function parseTimeList(text) {
  return String(text ?? '')
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
