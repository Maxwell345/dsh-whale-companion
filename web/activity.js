(function () {
  const { esc } = window.WhaleUI
  const params = new URLSearchParams(location.search)
  const view = params.get('view') || 'art'
  const file = params.get('file') || ''
  const base = file.split(/[\\/]/).pop() || ''
  const main = document.getElementById('actMain')
  const title = document.getElementById('actTitle')
  const sub = document.getElementById('actSub')
  const emoji = document.getElementById('actEmoji')
  const meta = document.getElementById('actMeta')
  const foot = document.getElementById('actFoot')
  const SVG_NS = 'http://www.w3.org/2000/svg'
  let runToken = 0

  function svgEl(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name)
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
    return el
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function animateValue(duration, token, onFrame) {
    return new Promise((resolve) => {
      const start = performance.now()
      function frame(now) {
        if (token !== runToken) { resolve(false); return }
        const p = Math.min(1, (now - start) / Math.max(1, duration))
        onFrame(p)
        if (p < 1) requestAnimationFrame(frame)
        else resolve(true)
      }
      requestAnimationFrame(frame)
    })
  }

  async function loadPlan(planName) {
    try {
      const res = await fetch(`/dsh-whale/static/art/${encodeURIComponent(planName)}`, { cache: 'no-store' })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }

  function makeStage(plan) {
    const wrapper = document.createElement('div')
    wrapper.className = 'draw-wrap'

    const stage = document.createElement('div')
    stage.className = 'draw-stage'
    const svg = svgEl('svg', {
      viewBox: plan.viewBox || '0 0 512 512',
      class: 'draw-svg',
      role: 'img',
      'aria-label': base,
    })
    const fills = svgEl('g', { class: 'draw-fills' })
    const strokes = svgEl('g', { class: 'draw-strokes' })
    const fillSteps = []
    const strokeSteps = []
    const fillClips = []
    plan.steps.forEach((step, index) => {
      if (step.type === 'fill') {
        const clipId = `draw-clip-${index}`
        const clip = svgEl('clipPath', { id: clipId })
        const circle = svgEl('circle', {
          cx: step.seed?.[0] ?? 256,
          cy: step.seed?.[1] ?? 256,
          r: 0,
        })
        clip.appendChild(circle)
        const path = svgEl('path', {
          d: step.d,
          fill: step.fill,
          'clip-path': `url(#${clipId})`,
          'data-step': String(index),
        })
        fills.appendChild(path)
        svg.appendChild(clip)
        fillSteps.push({ path, circle })
        fillClips.push({ path, circle })
      } else {
        const path = svgEl('path', {
          d: step.d,
          fill: 'none',
          stroke: step.color,
          'stroke-width': String(step.width || 3),
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'data-step': String(index),
        })
        strokes.appendChild(path)
        strokeSteps.push({ path })
      }
    })
    svg.appendChild(fills)
    svg.appendChild(strokes)
    const pen = svgEl('circle', { class: 'draw-pen', r: 5, cx: 256, cy: 256, opacity: 0 })
    svg.appendChild(pen)
    stage.appendChild(svg)

    const bar = document.createElement('div')
    bar.className = 'draw-bar'
    const progress = document.createElement('div')
    progress.className = 'draw-progress'
    const fill = document.createElement('i')
    progress.appendChild(fill)
    const replay = document.createElement('button')
    replay.className = 'btn'
    replay.textContent = '重新画一遍'
    const label = document.createElement('span')
    label.className = 'draw-label'
    bar.append(progress, label, replay)
    wrapper.append(stage, bar)
    main.innerHTML = ''
    main.appendChild(wrapper)
    return { svg, fillSteps, strokeSteps, pen, fill, label, replay }
  }

  async function playPlan(plan, ui) {
    const token = ++runToken
    const steps = plan.steps || []
    let done = 0
    ui.label.textContent = `0 / ${steps.length}`
    // Reset.
    for (const { path, circle } of ui.fillSteps) {
      circle.setAttribute('r', '0')
      path.style.opacity = '1'
    }
    for (const { path } of ui.strokeSteps) {
      try {
        const length = path.getTotalLength()
        path.style.strokeDasharray = String(length)
        path.style.strokeDashoffset = String(length)
      } catch {}
    }
    ui.pen.setAttribute('opacity', '0')

    for (let index = 0; index < steps.length; index++) {
      if (token !== runToken) return
      const step = steps[index]
      if (step.type === 'fill') {
        const item = ui.fillSteps[index - countStrokesBefore(steps, index)]
        if (!item) continue
        const cx = Number(step.seed?.[0] ?? 256)
        const cy = Number(step.seed?.[1] ?? 256)
        const radius = Math.max(760, Math.hypot(512 - cx, 512 - cy) + 80)
        ui.pen.setAttribute('cx', String(cx))
        ui.pen.setAttribute('cy', String(cy))
        ui.pen.setAttribute('opacity', '0.9')
        await animateValue(step.duration * 1000, token, (p) => {
          item.circle.setAttribute('r', String(radius * p))
        })
      } else {
        const item = ui.strokeSteps[index - countFillsBefore(steps, index)]
        if (!item) continue
        let length = 0
        try { length = item.path.getTotalLength() } catch {}
        await animateValue(step.duration * 1000, token, (p) => {
          item.path.style.strokeDashoffset = String(length * (1 - p))
          try {
            const point = item.path.getPointAtLength(length * p)
            ui.pen.setAttribute('cx', String(point.x))
            ui.pen.setAttribute('cy', String(point.y))
            ui.pen.setAttribute('opacity', '0.95')
          } catch {}
        })
      }
      done++
      ui.label.textContent = `${done} / ${steps.length}`
      ui.fill.style.width = `${(done / steps.length) * 100}%`
    }
    ui.pen.setAttribute('opacity', '0')
    ui.label.textContent = '画完了'
  }

  function countFillsBefore(steps, index) {
    let n = 0
    for (let i = 0; i < index; i++) if (steps[i].type === 'fill') n++
    return n
  }

  function countStrokesBefore(steps, index) {
    let n = 0
    for (let i = 0; i < index; i++) if (steps[i].type !== 'fill') n++
    return n
  }

  function staticImage() {
    const img = document.createElement('img')
    img.src = `/dsh-whale/static/art/${encodeURIComponent(base)}`
    img.alt = base
    main.innerHTML = ''
    main.appendChild(img)
  }

  async function boot() {
    if (view !== 'art' && view !== 'image') {
      main.innerHTML = `<div class="act-loading">不认识这个视图：${esc(view)}</div>`
      return
    }
    emoji.textContent = '🎨'
    title.textContent = '以前的画'
    sub.textContent = base
    const planName = /\.svg$/i.test(base) ? base.replace(/\.svg$/i, '.draw.json') : ''
    const plan = planName ? await loadPlan(planName) : null
    if (!plan || !Array.isArray(plan.steps) || !plan.steps.length) {
      staticImage()
      return
    }
    meta.textContent = `${plan.steps.length} 步`
    foot.hidden = false
    foot.textContent = '这是她一笔一笔画出来的过程。'
    const ui = makeStage(plan)
    ui.replay.addEventListener('click', () => playPlan(plan, ui))
    playPlan(plan, ui).catch(() => staticImage())
  }

  document.getElementById('btnClose').addEventListener('click', async () => {
    runToken++
    try {
      await fetch('/dsh-whale/api/activity/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    } catch {}
    window.close()
  })

  boot().catch((err) => { main.innerHTML = `<div class="act-loading">打开失败：${esc(err.message)}</div>` })
})()
