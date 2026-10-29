import path from 'node:path'
import { dataPaths } from './config.js'
import { localDateKey, localStamp, readJson, timeToMinutes, writeJsonAtomic } from './util.js'

export function withinWindow(now, wake, sleep) {
  const m = now.getHours() * 60 + now.getMinutes()
  const w = timeToMinutes(wake, 450)
  const s = timeToMinutes(sleep, 1350)
  if (w === s) return true
  if (w < s) return m >= w && m < s
  return m >= w || m < s
}

export class CompanionScheduler {
  constructor({ getConfig, onWake, onSleep, log = () => {} }) {
    this.getConfig = getConfig
    this.onWake = onWake
    this.onSleep = onSleep
    this.log = log
    this.timer = null
    this.busy = false
    this.state = this.load()
  }

  get file() {
    return dataPaths(this.getConfig()).state
  }

  load() {
    const raw = readJson(this.file, null)
    return {
      asleep: typeof raw?.asleep === 'boolean' ? raw.asleep : null,
      awakeAt: Number(raw?.awakeAt) || 0,
      lastWakeDate: String(raw?.lastWakeDate ?? ''),
      lastSleepDate: String(raw?.lastSleepDate ?? ''),
      forceUntil: Number(raw?.forceUntil) || 0,
      lastReason: String(raw?.lastReason ?? ''),
      updatedAt: raw?.updatedAt ?? null,
    }
  }

  save() {
    this.state.updatedAt = localStamp()
    writeJsonAtomic(this.file, this.state)
  }

  isAwake() {
    return this.state.asleep === false
  }

  start() {
    if (this.timer) clearInterval(this.timer)
    const cfg = this.getConfig()
    if (!cfg.schedule.enabled) {
      this.state.asleep = false
      this.state.awakeAt = Date.now()
      this.save()
    } else if (this.state.asleep === null) {
      this.state.asleep = !withinWindow(new Date(), cfg.schedule.wake, cfg.schedule.sleep)
      this.state.awakeAt = this.state.asleep ? 0 : Date.now()
      this.save()
    }
    this.timer = setInterval(() => { this.tick().catch(() => {}) }, 15000)
    // 启动时按当前状态恢复服务，但不读旧消息。
    if (this.isAwake()) {
      Promise.resolve(this.onWake?.('startup')).catch((e) => this.log(`[schedule] startup wake 失败：${e.message}`))
    } else {
      Promise.resolve(this.onSleep?.('startup', { skipFinalize: true })).catch((e) => this.log(`[schedule] startup sleep 失败：${e.message}`))
    }
    this.log(`[schedule] 已启动：${this.isAwake() ? '醒着' : '睡着'}；作息 ${cfg.schedule.wake}–${cfg.schedule.sleep}`)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async tick() {
    if (this.busy) return
    this.busy = true
    try {
      const cfg = this.getConfig()
      if (!cfg.schedule.enabled) {
        if (this.state.asleep !== false) await this.wake('manual')
        return
      }
      if (Date.now() < this.state.forceUntil) return
      const now = new Date()
      const shouldAwake = withinWindow(now, cfg.schedule.wake, cfg.schedule.sleep)
      if (shouldAwake && this.state.asleep !== false) await this.wake('schedule')
      else if (!shouldAwake && this.state.asleep === false) await this.sleep('schedule')
    } finally {
      this.busy = false
    }
  }

  async wake(reason = 'manual') {
    if (this.state.asleep === false) return
    this.state.asleep = false
    this.state.awakeAt = Date.now()
    this.state.lastWakeDate = localDateKey()
    this.state.lastReason = reason
    if (reason === 'manual') this.state.forceUntil = Date.now() + 10 * 60 * 1000
    this.save()
    this.log(`[schedule] 醒来（${reason}）`)
    try { await this.onWake?.(reason) } catch (err) { this.log(`[schedule] onWake 失败：${err.message}`) }
  }

  async sleep(reason = 'manual', opts = {}) {
    if (this.state.asleep === true) return
    this.state.asleep = true
    this.state.lastSleepDate = localDateKey()
    this.state.lastReason = reason
    if (reason === 'manual') this.state.forceUntil = Date.now() + 10 * 60 * 1000
    this.save()
    this.log(`[schedule] 睡觉（${reason}）`)
    try { await this.onSleep?.(reason, opts) } catch (err) { this.log(`[schedule] onSleep 失败：${err.message}`) }
  }

  status() {
    const cfg = this.getConfig()
    return {
      ...this.state,
      awake: this.isAwake(),
      wake: cfg.schedule.wake,
      sleep: cfg.schedule.sleep,
      enabled: cfg.schedule.enabled,
      now: localStamp(),
      withinWindow: withinWindow(new Date(), cfg.schedule.wake, cfg.schedule.sleep),
    }
  }
}
