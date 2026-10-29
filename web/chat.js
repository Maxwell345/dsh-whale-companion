(function () {
  const { api, esc, toast, timeAgo } = window.WhaleUI
  const $ = (s) => document.querySelector(s)
  const log = $('#chatLog')
  const input = $('#input')
  const sendBtn = $('#btnSend')
  const typing = $('#typing')
  const badge = $('#awakeBadge')
  const sub = $('#chatSub')

  let streaming = false
  let controller = null
  let sendSeq = 0
  let currentAssistant = null
  let currentText = ''
  let lastUserText = ''
  let emptyEl = $('#chatEmpty')

  function scrollBottom() { log.scrollTop = log.scrollHeight }

  function clearEmpty() {
    if (emptyEl) { emptyEl.remove(); emptyEl = null }
  }

  function timeText(at) {
    try { return new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  function appendMessage(role, text, { proactive = false, at = Date.now() } = {}) {
    clearEmpty()
    const wrap = document.createElement('div')
    wrap.className = `msg ${role}${proactive ? ' proactive' : ''}`
    const who = document.createElement('div')
    who.className = 'who'
    who.innerHTML = role === 'assistant'
      ? '<img src="/dsh-whale/static/pet/assets/maid.png" alt="">'
      : '你'
    const body = document.createElement('div')
    body.className = 'bubble'
    body.textContent = text
    const meta = document.createElement('div')
    meta.className = 'meta'
    meta.textContent = timeText(at)
    const col = document.createElement('div')
    col.appendChild(body)
    col.appendChild(meta)
    wrap.appendChild(who)
    wrap.appendChild(col)
    log.appendChild(wrap)
    scrollBottom()
    return { wrap, body, meta }
  }

  function showTyping(on) {
    typing.hidden = !on
    if (on) scrollBottom()
  }

  async function loadHistory() {
    try {
      const r = await api('/chat/history?channel=pet-chat&limit=120')
      log.innerHTML = ''
      emptyEl = null
      if (!r.messages?.length) {
        log.innerHTML = `<div class="chat-empty" id="chatEmpty">
          <div class="empty-emoji">🐋</div>
          <p>和她说点什么吧。</p>
          <p class="muted">这里和 DSH 聊天框、QQ 都是分开的。关掉窗口时，这一轮会被写成「单轮对话总结日记」。</p>
        </div>`
        emptyEl = $('#chatEmpty')
        return
      }
      for (const m of r.messages) {
        if (m.role !== 'user' && m.role !== 'assistant') continue
        appendMessage(m.role, m.content, { proactive: Boolean(m.proactive), at: m.at })
      }
    } catch (err) {
      toast(`读取聊天记录失败：${err.message}`, 'err')
    }
  }

  async function loadStatus() {
    try {
      const r = await api('/status')
      const s = r.status
      badge.textContent = s.awake ? '醒着' : '睡着'
      badge.className = `chat-badge${s.awake ? '' : ' off'}`
      sub.textContent = [
        s.awake ? '在线' : '睡着了',
        s.qq.connected ? 'QQ 在线' : '',
        s.llm.configured ? s.llm.model : '模型未配置',
      ].filter(Boolean).join(' · ')
    } catch {}
  }

  function markInterrupted(reason) {
    if (!currentAssistant) return
    if (!currentText.trim()) {
      currentAssistant.body.innerHTML = `<span class="interrupted">${esc(reason === 'new' ? '（被新消息打断）' : '（被打断）')}</span>`
    } else {
      const span = document.createElement('span')
      span.className = 'interrupted'
      span.textContent = reason === 'new' ? '（被新消息打断）' : '（被打断）'
      currentAssistant.body.appendChild(document.createElement('br'))
      currentAssistant.body.appendChild(span)
    }
  }

  function abortCurrent(reason = 'barge') {
    if (controller) {
      try { controller.abort() } catch {}
      controller = null
    }
    if (streaming) {
      streaming = false
      showTyping(false)
      markInterrupted(reason)
    }
    currentAssistant = null
    currentText = ''
  }

  async function sendMessage(text) {
    text = String(text || '').trim()
    if (!text) return
    if (streaming) abortCurrent('new')
    const mySeq = ++sendSeq
    lastUserText = text
    input.value = ''
    autoSize()
    appendMessage('user', text)
    showTyping(true)
    currentText = ''
    currentAssistant = null
    const ctrl = new AbortController()
    controller = ctrl
    streaming = true
    try {
      const res = await fetch('/dsh-whale/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
        body: JSON.stringify({ channel: 'pet-chat', text, stream: true }),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt.slice(0, 300) || `HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let done = false
      while (!done) {
        const { value, done: rd } = await reader.read()
        if (rd) break
        buf += dec.decode(value, { stream: true })
        let idx
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, idx)
          buf = buf.slice(idx + 2)
          for (const line of block.split(/\r?\n/)) {
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (!data) continue
            let ev
            try { ev = JSON.parse(data) } catch { continue }
            if (ev.type === 'delta') {
              if (!currentAssistant) {
                showTyping(false)
                currentAssistant = appendMessage('assistant', '')
              }
              currentText += ev.text
              currentAssistant.body.textContent = currentText
              scrollBottom()
            } else if (ev.type === 'done') {
              if (!currentAssistant) currentAssistant = appendMessage('assistant', ev.text || '')
              else currentAssistant.body.textContent = ev.text || currentText
              currentText = ev.text || currentText
              done = true
            } else if (ev.type === 'aborted') {
              done = true
            } else if (ev.type === 'error') {
              throw new Error(ev.error || '模型错误')
            }
          }
        }
      }
      if (currentAssistant?.meta) currentAssistant.meta.textContent = timeText(Date.now())
      showTyping(false)
    } catch (err) {
      if (err.name === 'AbortError') {
        markInterrupted('barge')
      } else {
        showTyping(false)
        if (currentAssistant) currentAssistant.body.textContent = `（连接不上：${err.message}）`
        else appendMessage('assistant', `（连接不上：${err.message}）`)
      }
    } finally {
      if (mySeq === sendSeq) {
        streaming = false
        controller = null
        currentAssistant = null
        currentText = ''
        showTyping(false)
      }
      loadStatus()
    }
  }

  // composer
  function autoSize() {
    input.style.height = 'auto'
    input.style.height = `${Math.min(120, input.scrollHeight)}px`
  }
  input.addEventListener('input', autoSize)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input.value)
    }
  })
  sendBtn.addEventListener('click', () => sendMessage(input.value))

  const isPanel = new URLSearchParams(location.search).get('panel') === '1'
    || window.self !== window.top
  if (isPanel) document.body.classList.add('panel-mode')

  // Fold: summarize and clear. The pet window owns the panel and the finalize call.
  async function foldChat() {
    if (isPanel && window.parent !== window) {
      window.parent.postMessage({ type: 'whale:fold-chat' }, location.origin)
      return
    }
    try {
      await fetch('/dsh-whale/api/chat/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    } catch {}
    try { window.close() } catch {}
    setTimeout(() => { try { window.close() } catch {} }, 200)
  }
  $('#btnCloseChat').addEventListener('click', foldChat)
  window.addEventListener('pagehide', () => {
    if (isPanel) return
    try {
      const blob = new Blob(['{}'], { type: 'application/json' })
      navigator.sendBeacon('/dsh-whale/api/chat/close', blob)
    } catch {}
  })

  // proactive messages
  function connectEvents() {
    try {
      const es = new EventSource('/dsh-whale/api/chat/events')
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'message' && data.message) {
            appendMessage('assistant', data.message.content, { proactive: true, at: data.message.at })
          }
        } catch {}
      }
    } catch {}
  }

  // boot
  ;(async () => {
    await loadStatus()
    await loadHistory()
    connectEvents()
    setInterval(loadStatus, 10000)
  })()
})()
