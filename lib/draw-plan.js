const VIEWBOX = '0 0 512 512'
const MAX_STEPS = 90
const MAX_PATH_CHARS = 24000

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)
}

function cleanPath(value) {
  if (typeof value !== 'string') throw new Error('path 必须是字符串')
  const d = value.trim()
  if (!d || d.length > MAX_PATH_CHARS) throw new Error('path 长度不合法')
  if (!/^[MmLlHhVvCcSsQqTtAaZz0-9.,+\-\s]+$/.test(d)) throw new Error('path 含不允许的字符')
  return d
}

function numberIn(value, fallback, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * Accept the model's structured painting plan and return a normalized plan.
 * The plan is ordered: stroke, stroke, fill, stroke... so the viewer can
 * literally draw one line, then the next, then colour one region.
 */
export function parseDrawPlan(raw, { maxBytes = 20480 } = {}) {
  let data = raw
  if (typeof data === 'string') {
    const text = data.trim()
    if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error('绘画计划超过大小限制')
    try { data = JSON.parse(text) } catch {
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start < 0 || end <= start) throw new Error('绘画计划不是 JSON')
      data = JSON.parse(text.slice(start, end + 1))
    }
  }
  if (!data || typeof data !== 'object') throw new Error('绘画计划为空')

  const rawSteps = Array.isArray(data.steps)
    ? data.steps
    : [
        ...(Array.isArray(data.strokes) ? data.strokes.map((s) => ({ ...s, type: 'stroke' })) : []),
        ...(Array.isArray(data.fills) ? data.fills.map((f) => ({ ...f, type: 'fill' })) : []),
      ]
  if (!rawSteps.length || rawSteps.length > MAX_STEPS) throw new Error('绘画步骤数量不合法')

  const steps = rawSteps.map((step, index) => {
    if (!step || typeof step !== 'object') throw new Error(`第 ${index + 1} 步为空`)
    const type = step.type === 'fill' ? 'fill' : 'stroke'
    const d = cleanPath(step.d)
    if (type === 'fill') {
      if (!isHexColor(step.fill)) throw new Error(`第 ${index + 1} 步颜色不合法`)
      const seed = Array.isArray(step.seed) && step.seed.length >= 2
        ? [numberIn(step.seed[0], 256, 0, 512), numberIn(step.seed[1], 256, 0, 512)]
        : [256, 256]
      return {
        type,
        d,
        fill: step.fill,
        duration: numberIn(step.duration, 0.8, 0.08, 3),
        seed,
      }
    }
    if (!isHexColor(step.color)) throw new Error(`第 ${index + 1} 步颜色不合法`)
    return {
      type,
      d,
      color: step.color,
      width: numberIn(step.width, 3, 0.5, 16),
      duration: numberIn(step.duration, 0.35, 0.06, 2),
    }
  })

  if (!steps.some((s) => s.type === 'stroke')) throw new Error('绘画计划至少需要一条线稿')
  const serialized = JSON.stringify({ viewBox: VIEWBOX, steps })
  if (Buffer.byteLength(serialized, 'utf8') > maxBytes) throw new Error('绘画计划超过大小限制')
  return { viewBox: VIEWBOX, steps }
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Build the final still SVG from the ordered plan. */
export function planToSvg(plan) {
  if (!plan || !Array.isArray(plan.steps)) throw new Error('绘画计划为空')
  const fills = []
  const strokes = []
  plan.steps.forEach((step, index) => {
    if (step.type === 'fill') {
      fills.push(`<path data-step="${index}" d="${esc(step.d)}" fill="${esc(step.fill)}"/>`)
    } else {
      strokes.push(`<path data-step="${index}" d="${esc(step.d)}" fill="none" stroke="${esc(step.color)}" stroke-width="${step.width}" stroke-linecap="round" stroke-linejoin="round"/>`)
    }
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${plan.viewBox || VIEWBOX}">`,
    '<g class="draw-fills">',
    ...fills,
    '</g>',
    '<g class="draw-strokes">',
    ...strokes,
    '</g>',
    '</svg>',
  ].join('')
}

export function drawPlanSvg(plan) {
  return planToSvg(plan)
}
