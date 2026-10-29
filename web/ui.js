(function () {
  const API = '/dsh-whale/api'

  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      headers: { accept: 'application/json', ...(opts.body ? { 'content-type': 'application/json' } : {}), ...(opts.headers || {}) },
      ...opts,
      body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
    })
    const text = await res.text()
    let data = {}
    try { data = text ? JSON.parse(text) : {} } catch { data = { ok: false, error: text.slice(0, 400) } }
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`)
      err.status = res.status
      err.data = data
      throw err
    }
    return data
  }

  function esc(text) {
    return String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
  }

  function fmtBytes(n) {
    const x = Number(n) || 0
    if (x < 1024) return `${x} B`
    if (x < 1024 * 1024) return `${(x / 1024).toFixed(1)} KB`
    return `${(x / 1024 / 1024).toFixed(2)} MB`
  }

  function timeAgo(iso) {
    if (!iso) return ''
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return ''
    const s = Math.max(0, Math.round((Date.now() - t) / 1000))
    if (s < 60) return `${s} 秒前`
    if (s < 3600) return `${Math.floor(s / 60)} 分钟前`
    if (s < 86400) return `${Math.floor(s / 3600)} 小时前`
    return `${Math.floor(s / 86400)} 天前`
  }

  let toastTimer = null
  function toast(message, type = '') {
    let wrap = document.querySelector('.toast-wrap')
    if (!wrap) {
      wrap = document.createElement('div')
      wrap.className = 'toast-wrap'
      document.body.appendChild(wrap)
    }
    const el = document.createElement('div')
    el.className = `toast ${type}`
    el.textContent = String(message)
    wrap.appendChild(el)
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; setTimeout(() => el.remove(), 250) }, 4200)
  }

  function modal({ title = '', body = '', okText = '确认', cancelText = '取消', danger = false, hideCancel = false }) {
    return new Promise((resolve) => {
      const mask = document.createElement('div')
      mask.className = 'modal-mask show'
      mask.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="warn-badge">!</div>
          <h3>${esc(title)}</h3>
          <div class="body">${esc(body)}</div>
          <div class="foot">
            ${hideCancel ? '' : `<button class="btn ghost" data-x="cancel">${esc(cancelText)}</button>`}
            <button class="btn ${danger ? 'danger' : 'primary'}" data-x="ok">${esc(okText)}</button>
          </div>
        </div>`
      const close = (v) => { mask.remove(); resolve(v) }
      mask.querySelector('[data-x="cancel"]')?.addEventListener('click', () => close(false))
      mask.querySelector('[data-x="ok"]').addEventListener('click', () => close(true))
      mask.addEventListener('click', (e) => { if (e.target === mask) close(false) })
      document.body.appendChild(mask)
    })
  }

  function poll(fn, ms = 5000) {
    let stopped = false
    const tick = async () => { if (stopped) return; try { await fn() } catch {} ; setTimeout(tick, ms) }
    tick()
    return () => { stopped = true }
  }

  function getPath(obj, path) {
    return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
  }
  function setPath(obj, path, value) {
    const keys = String(path).split('.')
    let cur = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(keys[i + 1]) ? [] : {}
      cur = cur[k]
    }
    cur[keys[keys.length - 1]] = value
  }

  window.WhaleUI = { api, esc, fmtBytes, timeAgo, toast, modal, poll, getPath, setPath }
})()
