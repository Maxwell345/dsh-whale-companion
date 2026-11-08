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
    main.innerHTML = `<div class="act-loading">不认识这个视图：${esc(view)}</div>`
  }

  document.getElementById('btnClose').addEventListener('click', async () => {
    try {
      await fetch('/dsh-whale/api/activity/close', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    } catch {}
    window.close()
  })

  boot().catch((err) => { main.innerHTML = `<div class="act-loading">打开失败：${esc(err.message)}</div>` })
})()
