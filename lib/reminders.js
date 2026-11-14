import crypto from 'node:crypto'
import { localDateKey, localTimeKey } from './util.js'

const DAY = 86400000
const CN_DIGITS = {
  零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
}
const WEEKDAYS = { 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 }

function numberFrom(raw) {
  if (/^\d+$/.test(raw)) return Number(raw)
  if (raw === '十') return 10
  if (raw.startsWith('十')) return 10 + (CN_DIGITS[raw.slice(1)] ?? 0)
  if (raw.includes('十')) {
    const [a, b] = raw.split('十')
    return (CN_DIGITS[a] ?? 1) * 10 + (CN_DIGITS[b] ?? 0)
  }
  return CN_DIGITS[raw] ?? NaN
}

function at(now, year, month, day, hour = 20, minute = 0) {
  const d = new Date(now)
  d.setFullYear(year, month - 1, day)
  d.setHours(hour, minute, 0, 0)
  return d
}

function timeOf(text, fallback = 20) {
  const m = String(text).match(/(上午|下午|晚上|中午|早上|凌晨)?\s*(\d{1,2})\s*(?::|点|时)\s*(\d{1,2})?/)
  if (!m) return { hour: fallback, minute: 0 }
  let hour = Number(m[2])
  const minute = Number(m[3] ?? 0)
  if ((m[1] === '下午' || m[1] === '晚上') && hour < 12) hour += 12
  if (m[1] === '中午' && hour < 11) hour += 12
  if (m[1] === '凌晨' && hour === 12) hour = 0
  return { hour: Math.min(23, hour), minute: Math.min(59, minute) }
}

/** Parse common Chinese deadline expressions. Returns null when no deadline is present. */
export function parseDeadline(text, now = new Date()) {
  const raw = String(text ?? '').trim()
  if (!raw) return null
  const t = timeOf(raw, 20)
  let m

  m = raw.match(/(20\d{2})\s*[-/年]\s*(\d{1,2})\s*[-/月]\s*(\d{1,2})\s*日?/)
  if (m) {
    const due = at(now, Number(m[1]), Number(m[2]), Number(m[3]), t.hour, t.minute)
    return { dueAt: due.getTime(), label: `${m[1]}-${m[2]}-${m[3]}` }
  }

  m = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/)
  if (m) {
    let year = now.getFullYear()
    let due = at(now, year, Number(m[1]), Number(m[2]), t.hour, t.minute)
    if (due.getTime() < now.getTime() - DAY) due = at(now, year + 1, Number(m[1]), Number(m[2]), t.hour, t.minute)
    return { dueAt: due.getTime(), label: `${m[1]}月${m[2]}日` }
  }

  m = raw.match(/(\d{1,2})\s*[/-]\s*(\d{1,2})(?!\d)/)
  if (m && !/:\s*\d/.test(raw.slice(Math.max(0, m.index - 2), m.index + m[0].length + 2))) {
    let year = now.getFullYear()
    let due = at(now, year, Number(m[1]), Number(m[2]), t.hour, t.minute)
    if (due.getTime() < now.getTime() - DAY) due = at(now, year + 1, Number(m[1]), Number(m[2]), t.hour, t.minute)
    return { dueAt: due.getTime(), label: `${m[1]}/${m[2]}` }
  }

  m = raw.match(/(\d+)\s*(天|日)\s*(?:后|以后)/)
  if (m) return { dueAt: now.getTime() + Number(m[1]) * DAY, label: `${m[1]}天后` }
  m = raw.match(/(\d+)\s*个?\s*小时\s*(?:后|以后)/)
  if (m) return { dueAt: now.getTime() + Number(m[1]) * 3600000, label: `${m[1]}小时后` }

  if (/今晚|今天晚上/.test(raw)) return { dueAt: at(now, now.getFullYear(), now.getMonth() + 1, now.getDate(), 20, 0).getTime(), label: '今晚' }
  if (/明天|明晚|明天晚上/.test(raw)) return { dueAt: at(now, now.getFullYear(), now.getMonth() + 1, now.getDate() + 1, 20, 0).getTime(), label: '明天' }
  if (/后天/.test(raw)) return { dueAt: at(now, now.getFullYear(), now.getMonth() + 1, now.getDate() + 2, 20, 0).getTime(), label: '后天' }
  if (/大后天/.test(raw)) return { dueAt: at(now, now.getFullYear(), now.getMonth() + 1, now.getDate() + 3, 20, 0).getTime(), label: '大后天' }

  if (/下个?周末/.test(raw)) {
    const due = new Date(now)
    due.setDate(due.getDate() + ((6 - due.getDay() + 7) % 7 || 7) + 7)
    due.setHours(20, 0, 0, 0)
    return { dueAt: due.getTime(), label: '下周末' }
  }
  if (/周末|礼拜天|星期日/.test(raw)) {
    const due = new Date(now)
    let delta = (6 - due.getDay() + 7) % 7
    if (delta === 0 && due.getHours() >= 20) delta = 7
    due.setDate(due.getDate() + delta)
    due.setHours(20, 0, 0, 0)
    return { dueAt: due.getTime(), label: '周末' }
  }

  m = raw.match(/(下下|下个?|这)?\s*(?:周|星期|礼拜)([一二三四五六日天])/)
  if (m) {
    const target = WEEKDAYS[m[2]]
    const due = new Date(now)
    let delta = (target - due.getDay() + 7) % 7
    if (delta === 0 && due.getHours() >= 20) delta = 7
    if (m[1]?.startsWith('下')) delta += 7
    due.setDate(due.getDate() + delta)
    due.setHours(20, 0, 0, 0)
    return { dueAt: due.getTime(), label: `周${m[2]}` }
  }

  if (/月底|月末/.test(raw)) {
    const due = new Date(now.getFullYear(), now.getMonth() + 1, 0, 20, 0, 0, 0)
    return { dueAt: due.getTime(), label: '月底' }
  }
  if (/下个?月/.test(raw)) {
    const due = new Date(now.getFullYear(), now.getMonth() + 1, 1, 20, 0, 0, 0)
    return { dueAt: due.getTime(), label: '下个月' }
  }

  return null
}

function sectionOf(markdown) {
  const source = String(markdown ?? '')
  const match = source.match(/^##\s*约定与未完事项\s*$/m)
  if (!match) return ''
  const start = match.index + match[0].length
  const rest = source.slice(start)
  const end = rest.search(/^##\s+/m)
  return end < 0 ? rest : rest.slice(0, end)
}

/** Extract only dated commitments from the `约定与未完事项` section. */
export function extractDatedCommitments(markdown, now = new Date()) {
  const section = sectionOf(markdown)
  if (!section) return []
  const out = []
  const seen = new Set()
  for (const raw of section.split(/\r?\n/)) {
    const text = raw.replace(/^\s*(?:[-*+]|\d+[.、)])\s*/, '').trim()
    if (!text || /^（.*）$/.test(text)) continue
    const deadline = parseDeadline(text, now)
    if (!deadline) continue
    const id = crypto.createHash('sha1').update(`${text}|${deadline.dueAt}`).digest('hex').slice(0, 16)
    if (seen.has(id)) continue
    seen.add(id)
    const remindAt = Math.max(now.getTime() + 60000, deadline.dueAt - DAY)
    out.push({
      id,
      text,
      label: deadline.label,
      dueAt: deadline.dueAt,
      remindAt,
      createdAt: now.getTime(),
      remindedAt: 0,
    })
  }
  return out
}

export function reminderText(item) {
  return `主人，之前说过的「${item.text}」快到约定期限了。`
}

export function reminderFilename(date = new Date()) {
  return `${localDateKey(date)}-${localTimeKey(date).replace(':', '')}`
}
