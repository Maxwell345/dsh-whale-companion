(function () {
  const { api, esc, toast } = window.WhaleUI
  const params = new URLSearchParams(location.search)
  const view = params.get('view') || 'art'
  const file = params.get('file') || ''
  const remaining = Number(params.get('remaining') || 0)
  const base = file.split(/[\\/]/).pop() || ''
  const main = document.getElementById('actMain')
  const title = document.getElementById('actTitle')
  const sub = document.getElementById('actSub')
  const emoji = document.getElementById('actEmoji')
  const meta = document.getElementById('actMeta')
  const foot = document.getElementById('actFoot')
  const stopBtn = document.getElementById('btnStopPlay')
  let timer = null
  let left = remaining
  let stopped = false

  function updateMeta() {
    if (view === 'game' || view === 'python') {
      meta.textContent = remaining > 0 ? `今天还能玩 ${Math.max(0, left)} 分钟` : ''
      foot.hidden = false
      foot.textContent = '玩完记得点「结束游戏」，她会把这次玩游戏的时长写进自由活动日志。'
    }
  }

  function startTimer() {
    if (!(view === 'game' || view === 'python')) return
    timer = setInterval(() => {
      left = Math.max(0, left - 1 / 60)
      updateMeta()
      if (left <= 0 && !stopped) {
        stopped = true
        clearInterval(timer)
        stopPlay('time-up')
        toast('今天玩游戏的时间到啦，该休息了', 'err')
      }
    }, 1000)
  }

  async function stopPlay(reason) {
    if (stopped) return
    stopped = true
    clearInterval(timer)
    try { await api('/activities/play/stop', { method: 'POST', body: {} }) } catch {}
  }

  async function boot() {
    if (view === 'art' || view === 'image') {
      emoji.textContent = '🎨'
      title.textContent = '以前的画'
      sub.textContent = base
      const img = document.createElement('img')
      img.src = `/dsh-whale/static/art/${encodeURIComponent(base)}`
      img.alt = base
      main.innerHTML = ''
      main.appendChild(img)
      return
    }
    if (view === 'game') {
      emoji.textContent = '🎮'
      title.textContent = '自己写的小游戏'
      sub.textContent = base
      const frame = document.createElement('iframe')
      frame.sandbox = 'allow-scripts'
      frame.src = `/dsh-whale/play?file=${encodeURIComponent(file)}`
      frame.title = '小游戏'
      main.innerHTML = ''
      main.appendChild(frame)
      stopBtn.hidden = false
      startTimer()
      updateMeta()
      return
    }
    if (view === 'python') {
      emoji.textContent = '🐍'
      title.textContent = 'Python 小游戏'
      sub.textContent = base
      const res = await fetch(`/dsh-whale/static/games/${encodeURIComponent(base)}`)
      const code = await res.text()
      main.innerHTML = ''
      const pre = document.createElement('pre')
      pre.textContent = code
      main.appendChild(pre)
      stopBtn.hidden = false
      const run = document.createElement('button')
      run.className = 'btn'
      run.textContent = '在控制台运行'
      run.style.marginLeft = '8px'
      run.addEventListener('click', async () => {
        try {
          const r = await api('/activities/python/run', { method: 'POST', body: { file } })
          toast(r.ok ? '已经打开控制台啦' : (r.error || '启动失败'), r.ok ? 'ok' : 'err')
        } catch (err) { toast(err.message, 'err') }
      })
      document.querySelector('.act-actions').insertBefore(run, stopBtn)
      startTimer()
      updateMeta()
      return
    }
    main.innerHTML = `<div class="act-loading">不认识这个视图：${esc(view)}</div>`
  }

  stopBtn.addEventListener('click', async () => {
    await stopPlay('manual')
    toast('这次玩到这儿', 'ok')
    try { await api('/activity/close', { method: 'POST', body: {} }) } catch {}
    window.close()
  })
  document.getElementById('btnClose').addEventListener('click', async () => {
    if (view === 'game' || view === 'python') await stopPlay('close')
    try { await api('/activity/close', { method: 'POST', body: {} }) } catch {}
    window.close()
  })
  window.addEventListener('pagehide', () => {
    if (view === 'game' || view === 'python') {
      try { navigator.sendBeacon('/dsh-whale/api/activities/play/stop', new Blob(['{}'], { type: 'application/json' })) } catch {}
    }
  })

  boot().catch((err) => { main.innerHTML = `<div class="act-loading">打开失败：${esc(err.message)}</div>` })
})()
