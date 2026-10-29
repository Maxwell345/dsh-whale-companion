(function () {
  const { api, esc, fmtBytes, timeAgo, toast, modal, poll, getPath, setPath } = window.WhaleUI

  let config = null
  let persona = null
  let status = null

  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

  // tabs
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.toggle('active', t === tab))
      $$('.section').forEach((s) => s.classList.toggle('active', s.dataset.section === tab.dataset.tab))
    })
  })

  function fillForm(cfg) {
    for (const el of $$('[data-path]')) {
      const path = el.dataset.path
      const v = getPath(cfg, path)
      if (el.type === 'checkbox') el.checked = Boolean(v)
      else el.value = v == null ? '' : String(v)
    }
    const scale = Number(getPath(cfg, 'pet.scale') || 1)
    if ($('#scaleHint')) $('#scaleHint').textContent = `${scale.toFixed(2)}×`
    // secret placeholders
    const secretHints = [
      ['llm.apiKey', cfg.llm?.apiKeySet],
      ['qq.token', cfg.qq?.tokenSet],
    ]
    for (const [path, has] of secretHints) {
      const el = $(`[data-path="${path}"]`)
      if (el) el.placeholder = has ? '已设置（留空保持不变）' : (el.getAttribute('data-placeholder') || el.placeholder)
    }
  }

  function collect() {
    const out = JSON.parse(JSON.stringify(config || {}))
    for (const el of $$('[data-path]')) {
      const path = el.dataset.path
      let v
      if (el.type === 'checkbox') v = el.checked
      else if (el.type === 'number' || el.type === 'range') v = el.value === '' ? 0 : Number(el.value)
      else v = el.value
      setPath(out, path, v)
    }
    return out
  }

  async function loadConfig() {
    const data = await api('/config')
    config = data.config
    fillForm(config)
    status = data.status
    renderStatus()
    await Promise.all([loadPersona(), loadMemory(), loadImportant()])
    return data
  }

  async function loadPersona() {
    try {
      persona = await api('/persona')
      $('#personaText').value = persona.text || ''
      $('#personaBytes').textContent = String(persona.bytes || 0)
      $('#personaUpdated').textContent = persona.updatedAt ? `上次修改 ${persona.updatedAt}` : '尚未保存'
      $('#personaLocked').textContent = persona.locked ? '已锁定（改动需三次确认）' : '尚未锁定'
    } catch (err) { toast(`读取人设失败：${err.message}`, 'err') }
  }

  async function loadImportant() {
    try {
      const r = await api('/memory/important')
      $('#importantText').value = r.text || ''
      $('#importantBytes').textContent = fmtBytes(new Blob([r.text || '']).size)
    } catch (err) { toast(`读取重要信息失败：${err.message}`, 'err') }
  }

  async function loadMemory() {
    try {
      const r = await api('/memory/list')
      const list = $('#memList')
      list.innerHTML = ''
      const kindLabel = { important: '重要', daily: '全天', conversation: '单轮', free: '自由活动' }
      for (const item of r.items) {
        const row = document.createElement('div')
        row.className = 'mem-item'
        row.innerHTML = `<span class="pill">${esc(kindLabel[item.kind] || item.kind)}</span>
          <span class="name">${esc(item.name)}</span>
          <span class="meta">${fmtBytes(item.bytes)} · ${esc(timeAgo(item.mtime))}</span>`
        row.addEventListener('click', async () => {
          try {
            const d = await api(`/memory/read?path=${encodeURIComponent(item.path)}`)
            const pre = $('#memPreview')
            pre.style.display = 'block'
            pre.textContent = d.text || '（空）'
            pre.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          } catch (err) { toast(`读取失败：${err.message}`, 'err') }
        })
        list.appendChild(row)
      }
      if (!r.items.length) list.innerHTML = '<p class="hint">还没有记忆文件。</p>'
    } catch (err) { toast(`读取记忆列表失败：${err.message}`, 'err') }
  }

  function pill(text, cls = '') {
    return `<span class="pill"><i class="dot ${cls}"></i>${esc(text)}</span>`
  }

  function renderStatus() {
    if (!status) return
    const s = status
    $('#pills').innerHTML = [
      pill(s.awake ? '醒着' : '睡着', s.awake ? 'ok' : ''),
      pill(s.qq.connected ? 'QQ 已连接' : 'QQ 未连接', s.qq.connected ? 'ok' : 'bad'),
      pill(s.llm.configured ? `模型 ${s.llm.model}` : '模型未配置', s.llm.configured ? 'ok' : 'bad'),
      pill(s.windows.pet ? '桌宠窗开着' : '桌宠窗关着', s.windows.pet ? 'ok' : ''),
    ].join('')

    const rows = [
      ['作息', s.schedule.enabled ? `${s.schedule.wake} – ${s.schedule.sleep}` : '已关闭（一直醒着）'],
      ['现在', s.now],
      ['心情 / 亲近 / 精力', `${s.pet.mood} / ${s.pet.affection} / ${s.pet.energy}`],
      ['抚摸次数', String(s.pet.totalTouches)],
      ['QQ', s.qq.connected ? `已连接 ${s.qq.selfId || ''}` : (s.qq.lastError || '未连接')],
      ['桌宠 / 聊天窗', `${s.windows.pet ? '开' : '关'} / ${s.windows.chat ? '开' : '关'}`],
      ['今天玩游戏', `${s.activities.minutes} / ${s.activities.maxMinutes} 分钟`],
      ['记忆', `重要信息 ${fmtBytes(s.memory.importantBytes)} · 全天 ${s.memory.dailyCount} · 今日单轮 ${s.memory.conversationCount}`],
      ['自由活动日志', s.memory.freeLogToday ? '今天已有' : '今天还没有'],
    ]
    $('#overviewState').innerHTML = rows.map(([k, v]) => `<div class="item"><span class="grow">${esc(k)}</span><b>${esc(v)}</b></div>`).join('')
    $('#pathList').innerHTML = [
      ['共享目录', s.paths.root], ['人设卡', s.paths.persona], ['记忆卡', s.paths.memory], ['书目录', s.paths.books],
    ].map(([k, v]) => `<div class="item"><span class="grow">${esc(k)}</span><small title="${esc(v)}">${esc(v)}</small></div>`).join('')

    $('#qqState').textContent = s.qq.connected ? '已连接' : (s.qq.connecting ? '连接中…' : (s.qq.lastError || '未连接'))
    $('#llmState').textContent = s.llm.configured ? '已配置' : '未配置'
    $('#llmState').className = `pill ${s.llm.configured ? 'ok' : 'bad'}`

    const free = s.activities
    $('#freeStatus').innerHTML = [
      ['状态', free.running ? '正在做' : '空闲'],
      ['今天玩了', `${free.minutes} / ${free.maxMinutes} 分钟`],
      ['作品', `${free.artCount} 张画 · ${free.gameCount} 个游戏 · ${free.bookCount} 本书`],
      ['上次活动', free.lastActivityAt ? timeAgo(new Date(free.lastActivityAt).toISOString()) : '还没有'],
      ['下次大致', free.nextAt ? timeAgo(new Date(free.nextAt).toISOString()).replace('前', '后') : '—'],
    ].map(([k, v]) => `<div class="item"><span class="grow">${esc(k)}</span><b>${esc(v)}</b></div>`).join('')

    renderWorks(s.activities)
  }

  function renderWorks() {
    if (!status?.activities) return
    // works are fetched separately by refreshWorks
  }

  async function refreshWorks() {
    try {
      const r = await api('/activities/status')
      const w = r.works || {}
      const lines = []
      for (const f of (w.art || []).slice(0, 12)) lines.push(`<div class="item"><span class="pill">画</span><span class="grow">${esc(f.name)}</span><small>${fmtBytes(f.bytes)}</small></div>`)
      for (const f of (w.games || []).slice(0, 12)) lines.push(`<div class="item"><span class="pill">游戏</span><span class="grow">${esc(f.name)}</span><small>${fmtBytes(f.bytes)}</small></div>`)
      for (const f of (w.books || []).slice(0, 12)) lines.push(`<div class="item"><span class="pill">书</span><span class="grow">${esc(f.name)}</span><small>${fmtBytes(f.bytes)}</small></div>`)
      $('#worksList').innerHTML = lines.join('') || '<p class="hint">还没有作品。</p>'
    } catch {}
  }

  async function saveAll() {
    try {
      const body = { config: collect() }
      const r = await api('/config', { method: 'POST', body })
      config = r.config
      fillForm(config)
      toast('已保存，立即生效', 'ok')
      status = (await api('/status')).status
      renderStatus()
    } catch (err) {
      toast(`保存失败：${err.message}`, 'err')
    }
  }

  async function savePersona() {
    const text = $('#personaText').value
    const changed = persona?.exists && text.trim() !== String(persona.text || '').trim()
    if (changed) {
      const ok1 = await modal({
        title: '第一次确认',
        body: '你正在修改她的人设人格卡。\n\n人设是她是谁——不只是说话风格，还包括她怎么看待你、怎么看待自己。改掉之后，她就不再是你最初养的那条鱼了。\n\n你确认真的要这么做吗？',
        okText: '我知道，继续', danger: true,
      })
      if (!ok1) return
      const ok2 = await modal({
        title: '第二次确认',
        body: '改人设不会重写记忆。\n\n「重要信息记忆」「全天总结日记」里仍然保留着旧的人设下发生的事。新的人设和旧记忆可能会打架，她会显得有点分裂。\n\n你确认真的要这么做吗？',
        okText: '我知道，继续', danger: true,
      })
      if (!ok2) return
      const ok3 = await modal({
        title: '最后一次确认',
        body: '这是第三次，也是最后一次。\n\n保存后，QQ 私聊、QQ 群聊、桌宠聊天、抚摸互动都会立刻改用新的人设。没有自动备份，也不会问你第四遍。\n\n你确认真的要这么做吗？',
        okText: '确认修改', danger: true,
      })
      if (!ok3) return
    }
    try {
      const r = await api('/persona', { method: 'POST', body: { text, confirmations: changed ? 3 : 0 } })
      toast(`人设已保存（${r.bytes} 字节）`, 'ok')
      await loadPersona()
    } catch (err) {
      toast(`保存人设失败：${err.message}`, 'err')
    }
  }

  async function loadTemplate() {
    try {
      const r = await api('/persona/template')
      $('#personaText').value = r.text || ''
      toast('模板已载入，改成你自己的再保存', 'ok')
    } catch (err) { toast(`载入模板失败：${err.message}`, 'err') }
  }

  async function saveImportant() {
    try {
      const r = await api('/memory/important', { method: 'POST', body: { text: $('#importantText').value } })
      $('#importantBytes').textContent = fmtBytes(r.bytes || 0)
      toast('重要信息已保存', 'ok')
      loadMemory()
    } catch (err) { toast(`保存失败：${err.message}`, 'err') }
  }

  async function openFolder(which) {
    try { await api('/open-folder', { method: 'POST', body: { which } }); toast('已打开目录', 'ok') }
    catch (err) { toast(err.message, 'err') }
  }

  async function finalizeDay() {
    const ok = await modal({
      title: '整理今天？',
      body: '会把今天所有「单轮对话总结日记」和「自由活动日志」合成一份「全天总结日记」，然后删掉这些临时材料。\n\n如果现在还没睡觉，聊天窗不会被关闭。',
      okText: '开始整理',
    })
    if (!ok) return
    try {
      const r = await api('/memory/finalize-day', { method: 'POST', body: {} })
      toast(r.file ? '全天总结写好了' : '今天还没有材料', 'ok')
      await Promise.all([loadMemory(), refreshStatus()])
    } catch (err) { toast(`整理失败：${err.message}`, 'err') }
  }

  async function consolidate() {
    const ok = await modal({
      title: '压缩旧日记？',
      body: '会把超过期限的「全天总结日记」整理进「重要信息记忆」，然后删除这些旧日记。\n\n只保留长期有用/难忘的部分；失败时旧文件不会删除。',
      okText: '开始压缩',
    })
    if (!ok) return
    try {
      const r = await api('/memory/consolidate', { method: 'POST', body: {} })
      toast(r.compressed ? `压缩了 ${r.compressed} 份旧日记` : '还没有超过期限的旧日记', 'ok')
      await Promise.all([loadMemory(), refreshStatus()])
    } catch (err) { toast(`压缩失败：${err.message}`, 'err') }
  }

  async function refreshStatus() {
    try {
      const r = await api('/status')
      status = r.status
      renderStatus()
      refreshWorks()
    } catch {}
  }

  // buttons
  $('#btnSave').addEventListener('click', saveAll)
  $('#btnReloadConfig').addEventListener('click', () => loadConfig().then(() => toast('已重新读取', 'ok')).catch((e) => toast(e.message, 'err')))
  $('#btnSavePersona').addEventListener('click', savePersona)
  $('#btnPersonaTemplate').addEventListener('click', loadTemplate)
  $('#btnSaveImportant').addEventListener('click', saveImportant)
  $('#btnRefreshMemory').addEventListener('click', loadMemory)
  $('#btnOpenMemory').addEventListener('click', () => openFolder('memory'))
  $('#btnOpenMemory2').addEventListener('click', () => openFolder('memory'))
  $('#btnOpenBooks').addEventListener('click', () => openFolder('books'))
  $('#btnOpenRoot').addEventListener('click', () => openFolder('root'))
  $('#btnFinalizeDay').addEventListener('click', finalizeDay)
  $('#btnFinalizeDay2').addEventListener('click', finalizeDay)
  $('#btnConsolidate').addEventListener('click', consolidate)
  $('#btnWake').addEventListener('click', async () => { try { await api('/wake', { method: 'POST', body: {} }); toast('醒来了', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnWake2').addEventListener('click', async () => { try { await api('/wake', { method: 'POST', body: {} }); toast('醒来了', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnSleep').addEventListener('click', async () => { try { await api('/sleep', { method: 'POST', body: {} }); toast('晚安', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnSleep2').addEventListener('click', async () => { try { await api('/sleep', { method: 'POST', body: {} }); toast('晚安', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnOpenPet').addEventListener('click', async () => { try { await api('/pet/open', { method: 'POST', body: {} }); toast('桌宠窗口已打开', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnOpenPet2').addEventListener('click', async () => { try { await api('/pet/open', { method: 'POST', body: {} }); toast('桌宠窗口已打开', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnClosePet').addEventListener('click', async () => { try { await api('/pet/close', { method: 'POST', body: {} }); toast('桌宠已关闭', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnOpenChat').addEventListener('click', async () => { try { await api('/chat/open', { method: 'POST', body: {} }); toast('聊天窗已打开', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnOpenChat2').addEventListener('click', async () => { try { await api('/chat/open', { method: 'POST', body: {} }); toast('聊天窗已打开', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnRunActivity').addEventListener('click', async () => { try { const r = await api('/activities/run', { method: 'POST', body: { kind: 'auto' } }); toast(r.ok ? '她去忙了' : r.error, r.ok ? 'ok' : 'err'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnQQConnect').addEventListener('click', async () => { try { const r = await api('/qq/connect', { method: 'POST', body: {} }); toast(r.ok ? '正在连接…' : (r.qq?.lastError || '连接失败'), r.ok ? 'ok' : 'err'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnQQDisconnect').addEventListener('click', async () => { try { await api('/qq/disconnect', { method: 'POST', body: {} }); toast('已断开', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnTestLLM').addEventListener('click', async () => { try { $('#llmState').textContent = '测试中…'; const r = await api('/llm/test', { method: 'POST', body: {} }); $('#llmState').textContent = r.ok ? '连接正常' : '失败'; toast(r.ok ? `模型回复：${r.text}` : r.error, r.ok ? 'ok' : 'err') } catch (e) { $('#llmState').textContent = '失败'; toast(e.message, 'err') } })
  $('#btnResetWindows').addEventListener('click', async () => { try { await api('/window/close-all', { method: 'POST', body: {} }); toast('窗口已关闭', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') } })
  $('#btnRotateToken').addEventListener('click', async () => {
    const ok = await modal({ title: '重置窗口令牌？', body: '旧桌宠/聊天窗会立刻失效，需要重新打开。', okText: '重置', danger: true })
    if (!ok) return
    try { await api('/window/token/rotate', { method: 'POST', body: {} }); toast('令牌已重置', 'ok'); refreshStatus() } catch (e) { toast(e.message, 'err') }
  })

  $$('[data-outfit]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await api('/pet/outfit', { method: 'POST', body: { outfit: b.dataset.outfit } })
      const sel = $('[data-path="pet.outfit"]')
      if (sel) sel.value = b.dataset.outfit
      toast('换好啦', 'ok')
    } catch (e) { toast(e.message, 'err') }
  }))

  $$('[data-run]').forEach((b) => b.addEventListener('click', async () => {
    const kind = b.dataset.run
    b.disabled = true
    try {
      const r = await api('/activities/run', { method: 'POST', body: { kind } })
      toast(r.ok ? (r.say || '做完啦') : (r.error || '没做成'), r.ok ? 'ok' : 'err')
      await refreshStatus()
    } catch (e) { toast(e.message, 'err') } finally { b.disabled = false }
  }))

  const scaleInput = $('[data-path="pet.scale"]')
  if (scaleInput) scaleInput.addEventListener('input', () => { $('#scaleHint').textContent = `${Number(scaleInput.value).toFixed(2)}×` })

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveAll() }
  })

  loadConfig().then(() => {
    refreshWorks()
    poll(refreshStatus, 5000)
  }).catch((err) => {
    toast(`读取设置失败：${err.message}`, 'err')
    document.body.insertAdjacentHTML('afterbegin', `<div style="padding:20px;color:#ff6b7a">读取设置失败：${esc(err.message)}<br><br>如果你是直接在浏览器打开这个页面，请从 DSH「设置 → 小肥鱼」进入，或让插件给你带 token 的链接。</div>`)
  })
})()
