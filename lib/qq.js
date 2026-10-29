import { splitMessage, sleep } from './util.js'

function textFromSegments(segments) {
  if (!Array.isArray(segments)) {
    return String(segments ?? '')
      .replace(/\[CQ:at,[^\]]*\]/g, '')
      .replace(/\[CQ:[^\]]*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  let out = ''
  for (const seg of segments) {
    if (!seg || typeof seg !== 'object') continue
    if (seg.type === 'text') out += String(seg.data?.text ?? '')
  }
  return out.replace(/\s+/g, ' ').trim()
}

function atSelf(segments, selfQQ) {
  if (!selfQQ) return false
  if (Array.isArray(segments)) {
    return segments.some((s) => s?.type === 'at' && String(s?.data?.qq ?? '') === String(selfQQ))
  }
  return new RegExp(`\\[CQ:at,qq=${String(selfQQ)}(?:,[^\\]]*)?\\]`).test(String(segments ?? ''))
}

export { textFromSegments, atSelf }

export class QQClient {
  constructor({ getConfig, onMessage, isAwake, log = () => {} }) {
    this.getConfig = getConfig
    this.onMessage = onMessage
    this.isAwake = isAwake
    this.log = log
    this.ws = null
    this.connected = false
    this.connecting = false
    this.selfId = ''
    this.lastError = ''
    this.lastEventAt = 0
    this.retry = 0
    this.timer = null
    this.echo = 0
    this.pending = new Map()
    this.manualClose = false
    this.awakeAt = 0
  }

  status() {
    const cfg = this.getConfig()
    return {
      enabled: Boolean(cfg.qq.enabled),
      connected: this.connected,
      connecting: this.connecting,
      selfId: this.selfId,
      lastError: this.lastError,
      lastEventAt: this.lastEventAt,
      wsUrl: cfg.qq.wsUrl,
      groups: cfg.qq.groups.filter(Boolean),
    }
  }

  async connect({ force = false } = {}) {
    const cfg = this.getConfig()
    if (!cfg.qq.enabled) {
      this.lastError = 'QQ 未启用'
      return false
    }
    if (!this.isAwake()) {
      this.lastError = '小肥鱼在睡觉，QQ 不连接'
      return false
    }
    if (this.connected || this.connecting) return this.connected
    this.manualClose = false
    this.connecting = true
    this.awakeAt = Date.now()
    const base = String(cfg.qq.wsUrl || '').trim()
    if (!base) {
      this.connecting = false
      this.lastError = '没有填写 NapCat WebSocket 地址'
      return false
    }
    let url = base
    if (cfg.qq.token) {
      const sep = url.includes('?') ? '&' : '?'
      url += `${sep}access_token=${encodeURIComponent(cfg.qq.token)}`
    }
    this.log(`[qq] 连接 ${base}`)
    try {
      const ws = new WebSocket(url)
      this.ws = ws
      const timeout = setTimeout(() => {
        if (!this.connected) {
          this.lastError = '连接超时（NapCat 没启动 / 端口不对 / token 不对）'
          try { ws.close() } catch {}
        }
      }, 12000)
      ws.addEventListener('open', () => {
        clearTimeout(timeout)
        this.connected = true
        this.connecting = false
        this.retry = 0
        this.lastError = ''
        this.log('[qq] 已连接')
      })
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(String(event.data))
          this.handle(data)
        } catch (err) {
          this.log(`[qq] 收到无法解析的消息：${err.message}`)
        }
      })
      ws.addEventListener('error', () => {
        this.lastError = 'WebSocket 错误（检查 NapCat 是否启动、地址和 token）'
      })
      ws.addEventListener('close', () => {
        clearTimeout(timeout)
        const was = this.connected
        this.connected = false
        this.connecting = false
        this.ws = null
        if (was) this.log('[qq] 连接已断开')
        this.scheduleReconnect()
      })
      return true
    } catch (err) {
      this.connecting = false
      this.lastError = `连接失败：${err?.message ?? err}`
      this.scheduleReconnect()
      return false
    }
  }

  scheduleReconnect() {
    const cfg = this.getConfig()
    if (this.manualClose || !cfg.qq.enabled || !cfg.qq.reconnect || !this.isAwake()) return
    if (this.timer) clearTimeout(this.timer)
    const delay = Math.min(60000, 3000 * Math.pow(2, Math.min(4, this.retry++)))
    this.timer = setTimeout(() => {
      this.timer = null
      this.connect().catch(() => {})
    }, delay)
  }

  disconnect() {
    this.manualClose = true
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    try { this.ws?.close() } catch {}
    this.ws = null
    this.connected = false
    this.connecting = false
  }

  handle(data) {
    if (!data || typeof data !== 'object') return
    if (data.echo != null && this.pending.has(data.echo)) {
      const { resolve, reject, timer } = this.pending.get(data.echo)
      this.pending.delete(data.echo)
      clearTimeout(timer)
      if (data.status === 'ok' || data.retcode === 0) resolve(data)
      else reject(new Error(data.message || data.wording || `OneBot retcode=${data.retcode}`))
      return
    }
    if (data.post_type !== 'message') return
    this.lastEventAt = Date.now()
    const cfg = this.getConfig()
    if (!this.isAwake()) return
    const selfQQ = String(cfg.self.qq || data.self_id || '')
    const senderId = String(data.user_id ?? data.sender?.user_id ?? '')
    if (!senderId || senderId === selfQQ) return
    if (Number(data.time) * 1000 && Number(data.time) * 1000 < this.awakeAt - 5000) {
      // 醒来前的旧消息，不看。
      return
    }
    const segments = data.message
    const text = textFromSegments(segments)
    if (!text) return

    if (data.message_type === 'private') {
      if (!cfg.owner.qq || senderId !== String(cfg.owner.qq)) return
      this.onMessage({
        type: 'private',
        userId: senderId,
        groupId: '',
        text,
        atMe: true,
        senderName: String(data.sender?.nickname ?? data.sender?.card ?? '主人'),
        raw: data,
      }).catch((err) => this.log(`[qq] 私聊处理失败：${err.message}`))
      return
    }

    if (data.message_type === 'group') {
      const gid = String(data.group_id ?? '')
      const groups = cfg.qq.groups.filter(Boolean).map(String)
      if (!gid || !groups.includes(gid)) return
      if (!atSelf(segments, selfQQ)) return
      this.onMessage({
        type: 'group',
        userId: senderId,
        groupId: gid,
        text,
        atMe: true,
        senderName: String(data.sender?.card || data.sender?.nickname || senderId),
        raw: data,
      }).catch((err) => this.log(`[qq] 群聊处理失败：${err.message}`))
    }
  }

  async action(action, params = {}) {
    const cfg = this.getConfig()
    if (!this.connected) throw new Error('QQ 未连接')
    const echo = `whale-${Date.now()}-${++this.echo}`
    const payload = { action, params, echo }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(echo)
        reject(new Error('OneBot 请求超时'))
      }, 15000)
      this.pending.set(echo, { resolve, reject, timer })
      try {
        this.ws.send(JSON.stringify(payload))
      } catch (err) {
        clearTimeout(timer)
        this.pending.delete(echo)
        reject(err)
      }
    })
  }

  async sendPrivate(userId, text) {
    const cfg = this.getConfig()
    const parts = splitMessage(text, cfg.qq.maxReplyChars)
    for (const part of parts) {
      await this.action('send_private_msg', { user_id: Number(userId), message: [{ type: 'text', data: { text: part } }] })
      if (parts.length > 1) await sleep(350)
    }
  }

  async sendGroup(groupId, text, atUserId = '') {
    const cfg = this.getConfig()
    const parts = splitMessage(text, cfg.qq.maxReplyChars)
    for (let i = 0; i < parts.length; i++) {
      const message = []
      if (i === 0 && atUserId && cfg.qq.replyAt) {
        message.push({ type: 'at', data: { qq: String(atUserId) } })
        message.push({ type: 'text', data: { text: ' ' } })
      }
      message.push({ type: 'text', data: { text: parts[i] } })
      await this.action('send_group_msg', { group_id: Number(groupId), message })
      if (parts.length > 1) await sleep(350)
    }
  }
}
