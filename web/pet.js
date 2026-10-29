(function () {
  const params = new URLSearchParams(location.search)
  const shell = window.whaleShell || null
  if (shell?.isElectron || params.get('shell') === 'electron') document.body.classList.add('electron')
  else if (params.get('chroma') === '1') document.body.classList.add('chroma')

  const avatarEl = document.getElementById('avatar')
  const bubble = document.getElementById('bubble')
  const toast = document.getElementById('toast')
  const zzz = document.getElementById('zzz')
  const outfitMenu = document.getElementById('outfitMenu')
  const toolbar = document.getElementById('toolbar')
  const petRoot = document.getElementById('petRoot')
  const petColumn = document.getElementById('petColumn')
  const chatDock = document.getElementById('chatDock')
  const chatFrame = document.getElementById('chatFrame')
  const contextMenu = document.getElementById('contextMenu')

  let avatar = null
  let state = null
  let bubbleTimer = null
  let lastZone = ''
  let rapid = 0
  let rapidAt = 0

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = false
      s.onload = resolve
      s.onerror = () => reject(new Error(`load ${src}`))
      document.head.appendChild(s)
    })
  }

  async function bootAvatar() {
    // Prefer the Live2D avatar if Codex has dropped it in; fall back to the
    // reference-art avatar. Both implement the same window.WhaleAvatar API.
    try { await loadScript('/dsh-whale/static/pet/live2d/avatar.js') } catch {}
    if (!window.WhaleAvatar) {
      try { await loadScript('/dsh-whale/static/ui/avatar-fallback.js') } catch {}
    }
    if (!window.WhaleAvatar) {
      avatarEl.innerHTML = '<div style="color:#fff;padding:20px;text-align:center">桌宠素材没找到。<br>请检查 pet/assets。</div>'
      return
    }
    avatar = window.WhaleAvatar
    avatar.init(avatarEl, { outfit: state?.outfit || 'maid' })
  }

  function showToast(text) {
    toast.hidden = false
    toast.textContent = text
    clearTimeout(showToast.t)
    showToast.t = setTimeout(() => { toast.hidden = true }, 2600)
  }

  function showBubble(text, actions = []) {
    if (!text) return
    bubble.hidden = false
    bubble.textContent = text
    bubble.style.animation = 'none'
    void bubble.offsetWidth
    bubble.style.animation = ''
    clearTimeout(bubbleTimer)
    const ms = state?.speechMs || 9000
    bubbleTimer = setTimeout(() => { bubble.hidden = true }, ms)
    play(actions)
  }

  function play(actions) {
    if (!avatar) return
    const list = (Array.isArray(actions) ? actions : [actions]).filter(Boolean)
    if (!list.length) return
    let i = 0
    const step = () => {
      if (i >= list.length) return
      avatar.play(list[i++])
      setTimeout(step, 420)
    }
    step()
    zzz.hidden = !list.includes('sleepy')
  }

  async function api(path, body) {
    const res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? { accept: 'application/json' } : { 'content-type': 'application/json', accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  }

  async function refreshState() {
    try {
      const r = await api('/dsh-whale/api/pet/state')
      state = r.state
      zzz.hidden = !state.asleep
      if (state.outfit && avatar?.setOutfit) avatar.setOutfit(state.outfit)
      if (state.asleep) {
        bubble.hidden = false
        bubble.textContent = '唔……睡着了……'
      }
    } catch {}
  }

  async function setChatState(open) {
    try { await api('/dsh-whale/api/pet/chat-state', { open: Boolean(open) }) } catch {}
  }

  async function openChatPanel() {
    if (document.body.classList.contains('chat-open')) return
    document.body.classList.add('chat-open')
    chatDock.hidden = false
    chatFrame.src = `/dsh-whale/chat?panel=1&v=${Date.now()}`
    if (shell?.setSize) await shell.setSize(840, 620).catch(() => {})
    else { try { window.resizeTo(840, 620) } catch {} }
    await setChatState(true)
  }

  async function foldChatPanel({ summarize = true } = {}) {
    if (!document.body.classList.contains('chat-open')) return
    if (summarize) {
      try { await api('/dsh-whale/api/chat/close', {}) } catch {}
    }
    document.body.classList.remove('chat-open')
    chatDock.hidden = true
    chatFrame.src = 'about:blank'
    if (shell?.setSize) await shell.setSize(380, 600).catch(() => {})
    else { try { window.resizeTo(380, 600) } catch {} }
    await setChatState(false)
  }

  async function closePet() {
    await foldChatPanel({ summarize: true })
    try {
      if (shell?.close) shell.close()
      else {
        await fetch('/dsh-whale/api/pet/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
        window.close()
      }
    } catch {}
  }

  async function toggleSleep() {
    try {
      if (state?.asleep) {
        await api('/dsh-whale/api/wake', {})
        showToast('醒啦')
      } else {
        const ok = confirm('现在就哄她睡觉吗？\n睡觉会折叠聊天、断开 QQ，并开始整理今天的记忆。')
        if (!ok) return
        await api('/dsh-whale/api/sleep', {})
        showToast('晚安')
      }
      await refreshState()
    } catch (err) { showToast(err.message) }
  }

  async function touch(zone) {
    const now = Date.now()
    if (zone === lastZone && now - rapidAt < 700) rapid++
    else rapid = 1
    lastZone = zone
    rapidAt = now
    try {
      const r = await api('/dsh-whale/api/pet/touch', { zone, n: rapid })
      if (r.state) {
        state = r.state
        zzz.hidden = !state.asleep
      }
      if (r.text) showBubble(r.text, r.actions || [])
      if (r.asleep) zzz.hidden = false
    } catch (err) {
      showToast(`摸不到：${err.message}`)
    }
  }

  const DRAG_THRESHOLD = 6
  const HOLD_TO_DRAG_MS = 260
  let gesture = null

  function spawnRipple(x, y) {
    const rect = avatarEl.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'particle'
    ripple.textContent = '♡'
    ripple.style.left = `${x - rect.left}px`
    ripple.style.top = `${y - rect.top}px`
    document.getElementById('particles').appendChild(ripple)
    setTimeout(() => ripple.remove(), 1200)
  }

  function beginDrag() {
    if (!gesture || gesture.dragging) return
    gesture.dragging = true
    clearTimeout(gesture.holdTimer)
    if (shell?.beginDrag) shell.beginDrag()
  }

  function finishGesture() {
    if (!gesture) return
    const g = gesture
    gesture = null
    clearTimeout(g.holdTimer)
    try { petColumn.releasePointerCapture?.(g.pointerId) } catch {}
    if (g.dragging && shell?.endDrag) shell.endDrag()
  }

  petColumn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    if (e.target.closest('.toolbar, .outfit-menu, .context-menu, .chat-dock, button, a, input, textarea')) return
    if (!e.target.closest('#petColumn')) return
    if (gesture) finishGesture()

    const zone = e.target.closest('.hit')?.dataset.zone || ''
    gesture = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      zone,
      dragging: false,
      startedAt: Date.now(),
      holdTimer: null,
    }
    try { petColumn.setPointerCapture?.(e.pointerId) } catch {}
    gesture.holdTimer = setTimeout(() => {
      if (gesture) beginDrag()
    }, HOLD_TO_DRAG_MS)
  })

  petColumn.addEventListener('pointermove', (e) => {
    if (!gesture || e.pointerId !== gesture.pointerId) return
    const dx = e.clientX - gesture.startX
    const dy = e.clientY - gesture.startY
    if (!gesture.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) beginDrag()
    if (!gesture.dragging) return
    e.preventDefault()
  })

  petColumn.addEventListener('pointerup', (e) => {
    if (!gesture || e.pointerId !== gesture.pointerId) return
    const g = gesture
    const quick = Date.now() - g.startedAt < 700
    finishGesture()
    if (!g.dragging && g.zone && quick) {
      spawnRipple(e.clientX, e.clientY)
      touch(g.zone)
    }
  })

  petColumn.addEventListener('pointercancel', finishGesture)
  petColumn.addEventListener('lostpointercapture', finishGesture)
  window.addEventListener('pointerup', () => {
    // Safety net: if the captured pointerup was lost, don't leave the window
    // following the cursor forever.
    if (gesture?.dragging) finishGesture()
  })

  toolbar.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]')
    if (!btn) return
    const act = btn.dataset.act
    if (act === 'chat') {
      await openChatPanel()
    } else if (act === 'outfit') {
      outfitMenu.hidden = !outfitMenu.hidden
    } else if (act === 'sleep') {
      await toggleSleep()
    } else if (act === 'close') {
      await closePet()
    }
  })

  outfitMenu.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-outfit]')
    if (!btn) return
    try {
      const r = await api('/dsh-whale/api/pet/outfit', { outfit: btn.dataset.outfit })
      state = r.state
      avatar?.setOutfit(btn.dataset.outfit)
      outfitMenu.hidden = true
      showToast('换好啦')
    } catch (err) { showToast(err.message) }
  })

  document.addEventListener('click', (e) => {
    if (!outfitMenu.hidden && !e.target.closest('#outfitMenu') && !e.target.closest('[data-act="outfit"]')) outfitMenu.hidden = true
    if (!contextMenu.hidden && !e.target.closest('#contextMenu')) contextMenu.hidden = true
  })

  petRoot.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#chatDock') || e.target.closest('#contextMenu')) return
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - 170)
    const y = Math.min(e.clientY, window.innerHeight - 180)
    contextMenu.style.left = `${Math.max(8, x)}px`
    contextMenu.style.top = `${Math.max(8, y)}px`
    contextMenu.hidden = false
    const sleepBtn = document.getElementById('menuSleep')
    if (sleepBtn) sleepBtn.textContent = state?.asleep ? '唤醒' : '哄睡'
  })

  contextMenu.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-menu]')
    if (!btn) return
    contextMenu.hidden = true
    const act = btn.dataset.menu
    if (act === 'chat') await openChatPanel()
    else if (act === 'outfit') outfitMenu.hidden = !outfitMenu.hidden
    else if (act === 'sleep') await toggleSleep()
    else if (act === 'close') await closePet()
  })

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return
    if (e.data?.type === 'whale:fold-chat') foldChatPanel({ summarize: true })
  })

  window.addEventListener('beforeunload', () => {
    if (document.body.classList.contains('chat-open')) {
      try { navigator.sendBeacon('/dsh-whale/api/chat/close', new Blob(['{}'], { type: 'application/json' })) } catch {}
    }
  })

  function connectEvents() {
    try {
      const es = new EventSource('/dsh-whale/api/pet/events')
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'say') showBubble(data.text, data.actions)
          else if (data.type === 'open-chat') openChatPanel()
          else if (data.type === 'close-chat') {
            document.body.classList.remove('chat-open')
            chatDock.hidden = true
            chatFrame.src = 'about:blank'
            if (shell?.setSize) shell.setSize(380, 600).catch(() => {})
          } else if (data.type === 'state' && data.state) {
            state = data.state
            zzz.hidden = !state.asleep
            if (state.outfit) avatar?.setOutfit(state.outfit)
          }
        } catch {}
      }
      es.onerror = () => { /* EventSource reconnects automatically */ }
    } catch {}
  }

  ;(async () => {
    await refreshState()
    await bootAvatar()
    if (state?.asleep) {
      zzz.hidden = false
      bubble.hidden = false
      bubble.textContent = '唔……睡着了……'
      avatar?.play('sleepy')
    }
    connectEvents()
    if (params.get('openChat') === '1') await openChatPanel()
    setInterval(refreshState, 10000)
  })()
})()
