import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  CONFIG_FILE, DEFAULT_CONFIG, applyIncoming, dataPaths, ensureDataDirs, getPersona,
  loadConfig, personaState, publicConfig, resolveApiKey, saveConfig, savePersona,
} from './config.js'
import { LLMClient } from './llm.js'
import { MemoryStore } from './memory.js'
import { PetService, OUTFITS } from './pet.js'
import { QQClient } from './qq.js'
import { CompanionScheduler } from './schedule.js'
import { FreeActivities } from './activities.js'
import { WindowShell } from './window-shell.js'
import { cleanTextForChannel, shorten } from './prompts.js'
import {
  ensureDir, expandHome, isInside, listFiles, localDateKey, localStamp, makeLogger,
  nowIso, randomToken, readJsonl, readText, safeName, writeJsonAtomic,
} from './util.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WEB = path.join(HERE, '..', 'web')
const PET = path.join(HERE, '..', 'pet')
const ROUTE = '/dsh-whale'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

function json(res, code, value) {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(body.byteLength),
    'cache-control': 'no-store',
  })
  res.end(body)
}

function text(res, code, body, type = 'text/plain; charset=utf-8') {
  const buf = Buffer.from(String(body), 'utf8')
  res.writeHead(code, { 'content-type': type, 'content-length': String(buf.byteLength), 'cache-control': 'no-store' })
  res.end(buf)
}

function readBody(req, limit = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > limit) { reject(new Error('请求体过大')); req.destroy(); return }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function readJson(req, limit) {
  const buf = await readBody(req, limit)
  if (!buf.length) return {}
  return JSON.parse(buf.toString('utf8'))
}

function cookies(req) {
  const out = {}
  for (const part of String(req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function serveFile(res, file, { noStore = false, download = false } = {}) {
  let st
  try { st = fs.statSync(file) } catch { json(res, 404, { ok: false, error: '文件不存在' }); return }
  if (!st.isFile()) { json(res, 404, { ok: false, error: '不是文件' }); return }
  const ext = path.extname(file).toLowerCase()
  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'content-length': String(st.size),
    'cache-control': noStore ? 'no-store' : 'public, max-age=60',
    ...(download ? { 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(file))}` } : {}),
  })
  fs.createReadStream(file).pipe(res)
}

function sseStart(res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  })
  res.write(': whale\n\n')
}

function sseSend(res, data) {
  try { res.write(`data: ${JSON.stringify(data)}\n\n`) } catch {}
}

export default {
  name: 'dsh-whale-companion',
  inject: ['webServer', 'connection'],
  apply(ctx) {
    const STARTED_AT = Date.now()
    let config = loadConfig()
    let paths = ensureDataDirs(config)
    const log = makeLogger(path.join(paths.logs, 'whale.log'))

    if (!config.windowToken) {
      config.windowToken = loadConfig().windowToken
    }

    const llm = new LLMClient(() => config, () => resolveApiKey(config), log)
    const memory = new MemoryStore({ getConfig: () => config, llm, log })
    const pet = new PetService({
      getConfig: () => config,
      saveConfig: (next) => { config = next; saveConfig(config) },
      llm,
      memory,
      log,
    })
    globalThis.__whaleState = pet.publicState()

    const origin = () => {
      try {
        const o = ctx.webServer.getOrigin?.()
        if (o) return String(o).replace(/\/+$/, '')
      } catch {}
      const port = ctx.webServer.port ?? process.env.DSH_WEB_PORT ?? 0
      return `http://127.0.0.1:${port}`
    }

    const windows = new WindowShell({
      getConfig: () => config,
      getOrigin: origin,
      getToken: () => config.windowToken,
      dataPaths,
      onChatExit: () => {
        if (petChatOpen) memory.finalize('pet-chat', 'window-exit').catch((err) => log(`[chat] 窗口退出后总结失败：${err.message}`))
      },
      log,
    })

    let petChatOpen = false
    const petClients = new Set()
    const chatClients = new Set()
    const broadcast = (set, data) => {
      for (const res of [...set]) {
        try { sseSend(res, data) } catch { set.delete(res) }
      }
    }
    const sayToPet = (text, actions = ['happy']) => broadcast(petClients, { type: 'say', text, actions })
    const sayToChat = (message) => broadcast(chatClients, { type: 'message', message })

    let scheduler
    let qq
    let activities

    const isBusy = () => {
      for (const c of memory.convos.values()) {
        if (c.abort) return true
        if (Date.now() - (c.lastActivity || 0) < 60000) return true
      }
      return false
    }

    const handleQQMessage = async (msg) => {
      if (!scheduler.isAwake()) return
      const isPrivate = msg.type === 'private'
      const key = isPrivate ? `qq-private-${msg.userId}` : `qq-group-${msg.groupId}`
      const title = isPrivate ? 'QQ 私聊' : `QQ 群 ${msg.groupId}`
      const channel = isPrivate ? 'qq-private' : `qq-group-${msg.groupId}`
      memory.abort(key)
      const extra = isPrivate
        ? ''
        : `群号：${msg.groupId}；发消息的人：${msg.senderName}（QQ ${msg.userId}）。只回到群里，不要叫对方主人。`
      try {
        const r = await memory.chat({ key, title, channel, text: msg.text, extra })
        const clean = shorten(r.text, config.qq.maxReplyChars)
        if (!clean) return
        if (isPrivate) await qq.sendPrivate(msg.userId, clean)
        else await qq.sendGroup(msg.groupId, clean, msg.userId)
      } catch (err) {
        log(`[qq] 回复失败：${err.message}`)
      }
    }

    qq = new QQClient({
      getConfig: () => config,
      isAwake: () => scheduler?.isAwake?.() ?? false,
      onMessage: handleQQMessage,
      log,
    })

    const onMissOwner = async (text) => {
      const clean = cleanTextForChannel(text).slice(0, 300)
      if (!clean) return
      const openChat = petChatOpen
      const convo = memory.getConversation('pet-chat', { title: '桌宠聊天', channel: 'pet-chat' })
      if (!openChat) {
        try { windows.openPet({ openChat: '1' }) } catch {}
      }
      // Active messages are written into the same pet-chat history. If the
      // panel is open the SSE listener shows it immediately; if it just opened,
      // the initial history fetch shows it.
      memory.append(convo, 'assistant', clean)
      const msg = { seq: 0, at: Date.now(), role: 'assistant', content: clean, proactive: true }
      sayToChat(msg)
      if (!openChat) broadcast(petClients, { type: 'open-chat' })
      if (!windows.status().pet) {
        // No browser/window available: fall back to QQ or the pet bubble.
        if (config.qq.enabled && qq.connected && config.owner.qq) {
          try { await qq.sendPrivate(config.owner.qq, clean) } catch {}
        } else {
          sayToPet(clean, ['heart'])
        }
      }
    }

    activities = new FreeActivities({
      getConfig: () => config,
      llm,
      memory,
      pet,
      windows,
      isBusy,
      onSay: (text) => sayToPet(text, ['happy']),
      onMissOwner,
      lastUserAt: () => memory.lastUserAt() || STARTED_AT,
      log,
    })

    scheduler = new CompanionScheduler({
      getConfig: () => config,
      onWake: async (reason) => {
        pet.setAsleep(false)
        if (config.qq.enabled) await qq.connect()
        if (config.free.enabled) activities.start()
        sayToPet('唔……醒啦。', ['happy'])
        log(`[wake] ${reason}`)
      },
      onSleep: async (reason, opts = {}) => {
        petChatOpen = false
        broadcast(petClients, { type: 'close-chat' })
        qq.disconnect()
        try { activities.stopPlay('sleep') } catch {}
        activities.stop()
        pet.setAsleep(true)
        if (!opts.skipFinalize) {
          try { await memory.finalizeAll('sleep') } catch (err) { log(`[sleep] finalizeAll 失败：${err.message}`) }
          try { await memory.finalizeDay(localDateKey()) } catch (err) { log(`[sleep] 全天总结失败（保留材料，醒来后可重试）：${err.message}`) }
          try { await memory.consolidateDaily() } catch (err) { log(`[sleep] 旧日记压缩失败（保留材料）：${err.message}`) }
        }
        sayToPet('晚安，主人。', ['sleepy'])
        log(`[sleep] ${reason}`)
      },
      log,
    })

    // ---------- auth ----------
    function tokenOf(req, url) {
      return url.searchParams.get('token') || req.headers['x-whale-token'] || cookies(req).dsh_whale_token || ''
    }
    function authorized(req, url) {
      const token = String(tokenOf(req, url) || '')
      if (token && token === config.windowToken) return true
      try {
        const conn = ctx.get('connection') || ctx.connection
        if (conn && typeof conn.requestRejection === 'function') {
          const code = conn.requestRejection(req)
          if (code === undefined || code === null || code === false) return true
        }
      } catch {}
      return false
    }
    function setTokenCookie(res) {
      try {
        res.setHeader('set-cookie', `dsh_whale_token=${encodeURIComponent(config.windowToken)}; Path=${ROUTE}; HttpOnly; SameSite=Lax`)
      } catch {}
    }

    // ---------- route ----------
    const disposer = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: async (req, res) => {
        let url
        try { url = new URL(req.url, origin()) } catch { json(res, 400, { ok: false, error: 'bad url' }); return }
        const p = url.pathname
        const authed = authorized(req, url)
        try {
          // pages: token in query sets the cookie so subresources and APIs work.
          if ((p === `${ROUTE}/pet` || p === `${ROUTE}/chat` || p === `${ROUTE}/activity`) && req.method === 'GET') {
            if (!authed) { text(res, 403, '小肥鱼的窗口令牌不对。请从设置页重新打开窗口。', 'text/plain; charset=utf-8'); return }
            setTokenCookie(res)
            const page = p.endsWith('/pet') ? 'pet.html' : p.endsWith('/chat') ? 'chat.html' : 'activity.html'
            serveFile(res, path.join(WEB, page), { noStore: true })
            return
          }
          if (p === `${ROUTE}/settings` && req.method === 'GET') {
            if (!authed) { text(res, 403, '设置页需要通过 DSH「设置 → 小肥鱼」打开。', 'text/plain; charset=utf-8'); return }
            setTokenCookie(res)
            serveFile(res, path.join(WEB, 'settings.html'), { noStore: true })
            return
          }
          if (p === ROUTE || p === `${ROUTE}/`) {
            res.writeHead(302, { location: `${ROUTE}/settings` })
            res.end()
            return
          }

          if (p.startsWith(`${ROUTE}/static/`)) {
            if (!authed) { json(res, 403, { ok: false, error: '未授权' }); return }
            const rel = decodeURIComponent(p.slice(`${ROUTE}/static/`.length))
            let root = WEB
            let sub = rel
            if (rel.startsWith('ui/')) { root = WEB; sub = rel.slice(3) }
            else if (rel.startsWith('pet/')) { root = PET; sub = rel.slice(4) }
            else if (rel.startsWith('live2d/')) { root = path.join(PET, 'live2d'); sub = rel.slice(7) }
            else if (rel.startsWith('vendor/')) { root = path.join(PET, 'vendor'); sub = rel.slice(7) }
            else if (rel.startsWith('art/')) { root = paths.art; sub = rel.slice(4) }
            else if (rel.startsWith('games/')) { root = paths.games; sub = rel.slice(6) }
            const target = path.resolve(root, sub)
            if (!isInside(root, target) && target !== path.resolve(root)) { json(res, 403, { ok: false, error: '路径越界' }); return }
            if (url.searchParams.get('token') === config.windowToken) setTokenCookie(res)
            serveFile(res, target)
            return
          }

          if (p === `${ROUTE}/play` && req.method === 'GET') {
            if (!authed) { json(res, 403, { ok: false, error: '未授权' }); return }
            const rel = String(url.searchParams.get('file') || '')
            const root = paths.root
            const target = path.resolve(root, rel)
            if (!isInside(paths.games, target)) { json(res, 403, { ok: false, error: '只能运行自己的游戏' }); return }
            if (!/\.html?$/i.test(target)) { json(res, 400, { ok: false, error: '不是网页游戏' }); return }
            res.setHeader('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; media-src data:; font-src data:")
            serveFile(res, target, { noStore: true })
            return
          }

          if (!p.startsWith(`${ROUTE}/api/`)) { json(res, 404, { ok: false, error: 'not found' }); return }
          if (!authed) { json(res, 403, { ok: false, error: '未授权（缺少窗口令牌或 DSH 会话）' }); return }

          const api = p.slice(`${ROUTE}/api`.length)
          const method = req.method.toUpperCase()

          if (api === '/config' && method === 'GET') {
            json(res, 200, { ok: true, config: publicConfig(config), configPath: CONFIG_FILE, dataDir: paths.root, status: status() })
            return
          }
          if (api === '/config' && method === 'POST') {
            const body = await readJson(req, 2 * 1024 * 1024)
            const next = applyIncoming(config, body.config ?? body)
            const oldQQ = JSON.stringify(config.qq)
            config = next
            saveConfig(config)
            paths = ensureDataDirs(config)
            if (JSON.stringify(config.qq) !== oldQQ) {
              qq.disconnect()
              if (config.qq.enabled && scheduler.isAwake()) await qq.connect()
            }
            json(res, 200, { ok: true, config: publicConfig(config), dataDir: paths.root })
            return
          }

          if (api === '/persona' && method === 'GET') {
            json(res, 200, { ok: true, ...personaState(config) })
            return
          }
          if (api === '/persona' && method === 'POST') {
            const body = await readJson(req)
            const r = savePersona(config, body.text ?? '', Number(body.confirmations) || 0)
            config = loadConfig()
            json(res, 200, { ok: true, ...r })
            return
          }
          if (api === '/persona/template' && method === 'GET') {
            json(res, 200, { ok: true, text: readText(path.join(HERE, '..', 'persona-template.md'), '') })
            return
          }

          if (api === '/llm/test' && method === 'POST') {
            try {
              const r = await llm.call([
                { role: 'system', content: '你是一个连接测试。只回复两个字：在的。' },
                { role: 'user', content: '在吗' },
              ], { maxTokens: 32, temperature: 0.2 })
              json(res, 200, { ok: true, text: String(r.text || '').slice(0, 200) })
            } catch (err) {
              json(res, 200, { ok: false, error: String(err?.message ?? err), code: err?.code })
            }
            return
          }

          if (api === '/window/close-all' && method === 'POST') {
            windows.closeAll()
            json(res, 200, { ok: true, windows: windows.status() })
            return
          }
          if (api === '/window/token/rotate' && method === 'POST') {
            windows.closeAll()
            config.windowToken = randomToken(24)
            saveConfig(config)
            json(res, 200, { ok: true })
            return
          }

          if (api === '/memory/important' && method === 'GET') {
            json(res, 200, { ok: true, text: readText(paths.important, '') })
            return
          }

          if (api === '/ui-token' && method === 'GET') {
            json(res, 200, { ok: true, token: config.windowToken })
            return
          }

          if (api === '/status' && method === 'GET') {
            json(res, 200, { ok: true, status: status() })
            return
          }

          if (api === '/wake' && method === 'POST') {
            await scheduler.wake('manual')
            json(res, 200, { ok: true, status: status() })
            return
          }
          if (api === '/sleep' && method === 'POST') {
            await scheduler.sleep('manual')
            json(res, 200, { ok: true, status: status() })
            return
          }

          if (api === '/pet/touch' && method === 'POST') {
            const body = await readJson(req)
            const r = await pet.touch({ zone: body.zone, n: body.n })
            json(res, 200, r)
            return
          }
          if (api === '/pet/outfit' && method === 'POST') {
            const body = await readJson(req)
            json(res, 200, { ok: true, state: pet.setOutfit(String(body.outfit ?? '')) })
            return
          }
          if (api === '/pet/state' && method === 'GET') {
            json(res, 200, { ok: true, state: pet.publicState() })
            return
          }
          if (api === '/pet/open' && method === 'POST') {
            if (!config.pet.enabled) { json(res, 400, { ok: false, error: '桌宠已关闭' }); return }
            const r = windows.openPet()
            json(res, 200, { ok: true, ...r, windows: windows.status() })
            return
          }
          if (api === '/pet/close' && method === 'POST') {
            json(res, 200, { ok: true, ...windows.close('pet'), windows: windows.status() })
            return
          }
          if (api === '/pet/events' && method === 'GET') {
            sseStart(res)
            petClients.add(res)
            sseSend(res, { type: 'state', state: pet.publicState() })
            req.on('close', () => petClients.delete(res))
            return
          }

          if (api === '/chat/open' && method === 'POST') {
            let r = null
            try { r = windows.openPet({ openChat: '1' }) } catch (err) { log(`[chat] 打开桌宠失败：${err.message}`) }
            petChatOpen = true
            broadcast(petClients, { type: 'open-chat' })
            const w = windows.status()
            w.chat = true
            json(res, 200, { ok: Boolean(r), ...(r || {}), windows: w })
            return
          }
          if (api === '/chat/close' && method === 'POST') {
            petChatOpen = false
            memory.abort('pet-chat')
            broadcast(petClients, { type: 'close-chat' })
            const summary = await memory.finalize('pet-chat', 'chat-close').catch((err) => {
              log(`[chat] 折叠时总结失败：${err.message}`)
              return null
            })
            const w = windows.status()
            w.chat = false
            json(res, 200, { ok: true, summary, windows: w })
            return
          }
          if (api === '/pet/chat-state' && method === 'POST') {
            const body = await readJson(req).catch(() => ({}))
            petChatOpen = Boolean(body.open)
            json(res, 200, { ok: true, chatOpen: petChatOpen })
            return
          }
          if (api === '/chat/history' && method === 'GET') {
            const key = url.searchParams.get('channel') || 'pet-chat'
            json(res, 200, { ok: true, messages: memory.history(key, Number(url.searchParams.get('limit')) || 100) })
            return
          }
          if (api === '/chat/abort' && method === 'POST') {
            const body = await readJson(req)
            json(res, 200, { ok: true, aborted: memory.abort(body.channel || 'pet-chat') })
            return
          }
          if (api === '/chat/events' && method === 'GET') {
            sseStart(res)
            chatClients.add(res)
            req.on('close', () => chatClients.delete(res))
            return
          }
          if (api === '/chat/send' && method === 'POST') {
            const body = await readJson(req)
            const channel = String(body.channel || 'pet-chat')
            const text = String(body.text || '').trim()
            if (!text) { json(res, 400, { ok: false, error: '空消息' }); return }
            if (text.length > 8000) { json(res, 400, { ok: false, error: '消息太长' }); return }
            const key = channel === 'pet-chat' ? 'pet-chat' : channel
            memory.abort(key)
            const stream = body.stream !== false
            if (!stream) {
              const r = await memory.chat({ key, title: '桌宠聊天', channel, text })
              json(res, 200, { ok: true, text: r.text, usage: r.usage })
              return
            }
            sseStart(res)
            const abort = new AbortController()
            req.on('aborted', () => { try { abort.abort() } catch {} })
            res.on('close', () => { if (!res.writableEnded) { try { abort.abort() } catch {} } })
            try {
              for await (const chunk of memory.chatStream({
                key, title: '桌宠聊天', channel, text, signal: abort.signal,
              })) {
                if (chunk.type === 'delta') sseSend(res, { type: 'delta', text: chunk.text })
                else if (chunk.type === 'done') sseSend(res, { type: 'done', text: chunk.text })
                else if (chunk.type === 'aborted') sseSend(res, { type: 'aborted', text: chunk.text })
              }
            } catch (err) {
              sseSend(res, { type: 'error', error: String(err?.message ?? err), code: err?.code })
            }
            res.end()
            return
          }

          if (api === '/qq/status' && method === 'GET') {
            json(res, 200, { ok: true, qq: qq.status() })
            return
          }
          if (api === '/qq/connect' && method === 'POST') {
            qq.disconnect()
            const ok = await qq.connect({ force: true })
            json(res, 200, { ok, qq: qq.status() })
            return
          }
          if (api === '/qq/disconnect' && method === 'POST') {
            qq.disconnect()
            json(res, 200, { ok: true, qq: qq.status() })
            return
          }

          if (api === '/activities/status' && method === 'GET') {
            json(res, 200, { ok: true, activities: activities.status(), works: activities.listWorks() })
            return
          }
          if (api === '/activities/run' && method === 'POST') {
            const body = await readJson(req)
            const r = await activities.run(body.kind || 'auto', { manual: true })
            json(res, 200, r)
            return
          }
          if (api === '/activities/play/stop' && method === 'POST') {
            json(res, 200, { ok: true, ...activities.stopPlay('manual') })
            return
          }
          if (api === '/activity/close' && method === 'POST') {
            windows.close('activity')
            json(res, 200, { ok: true, windows: windows.status() })
            return
          }
          if (api === '/activities/python/run' && method === 'POST') {
            const body = await readJson(req)
            const rel = String(body.file || '')
            const target = path.resolve(paths.root, rel)
            if (!isInside(paths.games, target) || !target.toLowerCase().endsWith('.py')) {
              json(res, 400, { ok: false, error: '只能运行自己的 Python 游戏' }); return
            }
            const py = findPython()
            if (!py) { json(res, 400, { ok: false, error: '没找到 Python 运行时' }); return }
            const child = spawn(py, [target], { cwd: paths.games, detached: true, stdio: 'ignore', windowsHide: false })
            child.unref()
            json(res, 200, { ok: true, pid: child.pid })
            return
          }

          if (api === '/memory/list' && method === 'GET') {
            json(res, 200, { ok: true, items: memory.memoryList(), paths: paths.root })
            return
          }
          if (api === '/memory/read' && method === 'GET') {
            const rel = url.searchParams.get('path') || ''
            json(res, 200, { ok: true, text: memory.readMemory(rel) })
            return
          }
          if (api === '/memory/important' && method === 'POST') {
            const body = await readJson(req, 2 * 1024 * 1024)
            const saved = memory.writeImportant(body.text ?? '')
            json(res, 200, { ok: true, bytes: Buffer.byteLength(saved, 'utf8') })
            return
          }
          if (api === '/memory/finalize-day' && method === 'POST') {
            const body = await readJson(req).catch(() => ({}))
            const out = await memory.finalizeDay(body.date || localDateKey())
            json(res, 200, { ok: true, file: out })
            return
          }
          if (api === '/memory/consolidate' && method === 'POST') {
            const out = await memory.consolidateDaily()
            json(res, 200, { ok: true, ...out })
            return
          }
          if (api === '/open-folder' && method === 'POST') {
            const body = await readJson(req).catch(() => ({}))
            const which = String(body.which || 'root')
            const dir = which === 'art' ? paths.art : which === 'games' ? paths.games
              : which === 'books' ? activities.bookDir() : which === 'memory' ? paths.memory : paths.root
            ensureDir(dir)
            spawn('explorer.exe', [dir], { detached: true, stdio: 'ignore', windowsHide: false }).unref()
            json(res, 200, { ok: true, dir })
            return
          }

          json(res, 404, { ok: false, error: `未知接口 ${api}` })
        } catch (err) {
          log(`[http] ${p} 失败：${err?.stack ?? err}`)
          if (res.headersSent) { try { sseSend(res, { type: 'error', error: String(err?.message ?? err) }); res.end() } catch {} }
          else {
            const message = String(err?.message ?? err)
            const userError = /人设|请求|只能|格式|太长|空消息|路径|三次/.test(message)
            json(res, userError ? 400 : 500, { ok: false, error: message })
          }
        }
      },
    })

    function status() {
      const llmKey = Boolean(resolveApiKey(config))
      const windowsStatus = windows.status()
      windowsStatus.chat = petChatOpen
      return {
        awake: scheduler.isAwake(),
        asleep: !scheduler.isAwake(),
        schedule: scheduler.status(),
        qq: qq.status(),
        pet: pet.publicState(),
        windows: windowsStatus,
        activities: activities.status(),
        llm: { configured: llmKey, baseUrl: config.llm.baseUrl, model: config.llm.model },
        memory: {
          importantBytes: (() => { try { return fs.statSync(paths.important).size } catch { return 0 } })(),
          dailyCount: listFiles(paths.daily, (n) => n.endsWith('.md')).length,
          conversationCount: listFiles(paths.conversationSummaries, (n) => n.endsWith('.md')).length,
          freeLogToday: Boolean(readText(path.join(paths.freeLog, `${localDateKey()}.md`), '').trim()),
        },
        paths: { root: paths.root, persona: paths.persona, memory: paths.memory, books: activities.bookDir() },
        now: localStamp(),
        version: '0.2.0',
      }
    }

    scheduler.start()
    if (!config.pet.enabled) windows.close('pet')

    ctx.effect(() => () => {
      try { scheduler.stop() } catch {}
      try { qq.disconnect() } catch {}
      try { activities.stop() } catch {}
      try { windows.closeAll() } catch {}
      for (const set of [petClients, chatClients]) {
        for (const res of set) { try { res.end() } catch {} }
        set.clear()
      }
      try { disposer() } catch {}
    })

    log(`[whale] 设置页 / 已挂载：${ROUTE}/settings · 数据 ${paths.root}`)
  },
}

function findPython() {
  const bundled = path.join(DSH_HOME, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'python.exe')
  const cands = [
    process.env.WHALE_PYTHON,
    process.env.DSH_PYTHON,
    fs.existsSync(bundled) ? bundled : '',
    'python',
    'py',
  ].filter(Boolean)
  return cands[0]
}
