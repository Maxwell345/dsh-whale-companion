/**
 * dsh-whale-companion — browser half.
 *
 * Adds one row to DSH's settings: 「小肥鱼」. The actual settings UI is a
 * same-origin page served by the host half, embedded here so it can grow without
 * rebuilding a React bundle. All writes are enforced by the host.
 */
window.__ModuleLoader__.load({
  id: 'dsh-whale-companion',
  factory: (require) => {
    const React = require('react')
    const { createElement: h, useEffect, useState } = React

    const CSS_TAG = 'dsh-whale-companion/section.css'
    const CSS = [
      '.whc{display:flex;flex-direction:column;gap:10px;color:var(--dsw-alias-label-primary)}',
      '.whc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
      '.whc-title{margin:0;font-size:16px;font-weight:500;line-height:24px}',
      '.whc-sub{margin:2px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12.5px;line-height:19px}',
      '.whc-pill{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;line-height:18px;padding:2px 8px;border-radius:999px;background:rgba(127,127,127,.14);color:var(--dsw-alias-label-secondary)}',
      '.whc-dot{width:6px;height:6px;border-radius:999px;background:#2fb344;display:inline-block}',
      '.whc-dot.off{background:#9aa0a6}',
      '.whc-frame{width:100%;border:0;border-radius:10px;background:transparent;display:block}',
      '.whc-actions{display:flex;gap:8px;flex-wrap:wrap}',
      '.whc-btn{background:var(--dsw-alias-brand-primary);color:#fff;border:none;border-radius:6px;font-size:12.5px;height:30px;padding:0 12px;cursor:pointer}',
      '.whc-btn2{background:transparent;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}',
    ].join('')

    function useStyleOnce() {
      useEffect(() => {
        if (typeof document === 'undefined') return
        if (document.getElementById(CSS_TAG)) return
        const el = document.createElement('style')
        el.id = CSS_TAG
        el.textContent = CSS
        document.head.appendChild(el)
      }, [])
    }

    function WhaleSection() {
      useStyleOnce()
      const [status, setStatus] = useState(null)
      const [nonce, setNonce] = useState(0)
      const [src, setSrc] = useState('/dsh-whale/settings?embed=1')
      useEffect(() => {
        fetch('/dsh-whale/api/ui-token', { headers: { accept: 'application/json' } })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            if (j?.token) setSrc(`/dsh-whale/settings?embed=1&token=${encodeURIComponent(j.token)}`)
          })
          .catch(() => {})
      }, [])
      const load = async () => {
        try {
          const r = await fetch('/dsh-whale/api/status', { headers: { accept: 'application/json' } })
          if (r.ok) setStatus((await r.json()).status)
        } catch {}
      }
      useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [])
      const openPet = async () => {
        try { await fetch('/dsh-whale/api/pet/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }) } catch {}
        setNonce((n) => n + 1)
      }
      const openChat = async () => {
        try { await fetch('/dsh-whale/api/chat/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }) } catch {}
        setNonce((n) => n + 1)
      }
      const awake = status?.awake
      const qqOk = status?.qq?.connected
      return h('div', { className: 'whc' },
        h('div', { className: 'whc-head' },
          h('div', null,
            h('h3', { className: 'whc-title' }, '小肥鱼'),
            h('p', { className: 'whc-sub' }, '桌宠 · 独立聊天窗 · QQ 私聊/群聊 · 日记式记忆 · 作息与自由活动')),
          h('div', { className: 'whc-actions' },
            h('span', { className: 'whc-pill' }, h('i', { className: `whc-dot${awake ? '' : ' off'}` }), awake ? '醒着' : '睡着'),
            h('span', { className: 'whc-pill' }, h('i', { className: `whc-dot${qqOk ? '' : ' off'}` }), qqOk ? 'QQ 已连接' : 'QQ 未连接'),
            h('button', { className: 'whc-btn', onClick: openPet }, '打开桌宠'),
            h('button', { className: 'whc-btn whc-btn2', onClick: openChat }, '打开聊天窗'),
            h('button', { className: 'whc-btn whc-btn2', onClick: () => setNonce((n) => n + 1) }, '刷新'))),
        h('iframe', {
          key: `${nonce}:${src}`,
          className: 'whc-frame',
          src: `${src}${src.includes('?') ? '&' : '?'}n=${nonce}`,
          title: '小肥鱼设置',
          style: { height: 'min(76vh, 900px)' },
        }),
        h('p', { className: 'whc-sub' }, '提示：宿主端代码改动后需要重启 DSH；设置页改动保存后即时生效。'))
    }

    const NS = 'whale-companion'
    function apply(ctx) {
      ctx.effect(
        () => ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            { name: 'settings.section', id: NS, order: 7, label: () => '小肥鱼' },
            WhaleSection,
          ), 'whale-companion: settings section'),
        'whale-companion: settings section',
      )
    }

    return { name: 'dsh-whale-companion', inject: ['slots'], apply, WhaleSection }
  },
})
