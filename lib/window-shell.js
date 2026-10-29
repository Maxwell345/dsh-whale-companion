import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureDir } from './util.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PLUGIN_ROOT = path.join(HERE, '..')

function exists(file) {
  try { return fs.existsSync(file) } catch { return false }
}

export function findBrowser() {
  const env = process.env.WHALE_BROWSER || process.env.EDGE_PATH
  const candidates = [
    env,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean)
  for (const f of candidates) if (exists(f)) return f
  return ''
}

export function findElectron(dataRoot) {
  const candidates = [
    process.env.WHALE_ELECTRON,
    dataRoot ? path.join(dataRoot, 'pet-shell', 'electron', 'electron.exe') : '',
    path.join('F:\\DeepSeekBot\\whale-companion', 'pet-shell', 'electron', 'electron.exe'),
    path.join(PLUGIN_ROOT, 'pet', 'electron', 'electron.exe'),
  ].filter(Boolean)
  for (const f of candidates) if (exists(f)) return f
  return ''
}

export class WindowShell {
  constructor({ getConfig, getOrigin, getToken, dataPaths, onChatExit = null, log = () => {} }) {
    this.getConfig = getConfig
    this.getOrigin = getOrigin
    this.getToken = getToken
    this.dataPaths = dataPaths
    this.onChatExit = onChatExit
    this.log = log
    this.windows = new Map()
    this.helperScript = path.join(PLUGIN_ROOT, 'tools', 'pet-window.ps1')
    this.electronApp = path.join(PLUGIN_ROOT, 'pet', 'electron-app')
  }

  available() {
    return Boolean(findElectron(this.dataPaths(this.getConfig()).root) || findBrowser())
  }

  electron() {
    return findElectron(this.dataPaths(this.getConfig()).root)
  }

  urlFor(page, extra = {}) {
    const origin = this.getOrigin()
    const token = encodeURIComponent(this.getToken())
    const params = new URLSearchParams({ token, ...extra })
    return `${origin}/dsh-whale/${page}?${params.toString()}`
  }

  profileDir(kind) {
    const dir = path.join(this.dataPaths(this.getConfig()).edge, `profile-${kind}`)
    ensureDir(dir)
    return dir
  }

  /** True transparent single-window shell. */
  openElectron({ width = 380, height = 600, extra = {} } = {}) {
    const exe = this.electron()
    if (!exe) throw new Error('没有找到 Electron 壳。请先安装 Electron 到 whale-companion/pet-shell/electron。')
    if (this.windows.get('pet')?.proc && !this.windows.get('pet').proc.killed) {
      return { ok: true, already: true, kind: 'pet', electron: true }
    }
    const url = this.urlFor('pet', { ...extra, shell: 'electron' })
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE
    env.WHALE_URL = url
    env.WHALE_WIDTH = String(width)
    env.WHALE_HEIGHT = String(height)
    const proc = spawn(exe, [this.electronApp], { env, stdio: 'ignore', windowsHide: false })
    const entry = { kind: 'pet', page: 'pet', proc, url, openedAt: Date.now(), electron: true }
    this.windows.set('pet', entry)
    proc.on('exit', () => {
      this.log('[window] Electron 桌宠已关闭')
      try { this.onChatExit?.() } catch {}
      if (this.windows.get('pet') === entry) this.windows.delete('pet')
    })
    proc.on('error', (err) => {
      this.log(`[window] Electron 启动失败：${err.message}`)
      this.windows.delete('pet')
    })
    this.log(`[window] 打开 Electron 桌宠：${url.replace(/([?&]token=)[^&]+/, '$1***')}`)
    return { ok: true, kind: 'pet', pid: proc.pid, electron: true }
  }

  /** Edge fallback: borderless-ish app window with magenta key. */
  openEdge(kind, page, { width, height, x, y, extra = {}, chroma = false, title = '', topMost = undefined } = {}) {
    if (this.windows.get(kind)?.proc && !this.windows.get(kind).proc.killed) {
      return { ok: true, already: true, kind }
    }
    const browser = findBrowser()
    if (!browser) {
      throw new Error('没找到 Electron，也没找到 Edge/Chrome。请安装 Electron 或 Microsoft Edge。')
    }
    const cfg = this.getConfig()
    const url = this.urlFor(page, { ...extra, ...(chroma ? { chroma: '1' } : {}) })
    const profile = this.profileDir(kind)
    const args = [
      `--app=${url}`,
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      `--window-position=${x},${y}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=msEdgeSidebarV2,msEdgeShoppingAssistant,msEdgeCollections',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-session-crashed-bubble',
    ]
    const proc = spawn(browser, args, { stdio: 'ignore', windowsHide: false })
    const entry = { kind, page, proc, url, openedAt: Date.now(), helper: null }
    this.windows.set(kind, entry)
    proc.on('exit', () => {
      this.log(`[window] ${kind} 已关闭`)
      if (this.windows.get(kind) === entry) this.windows.delete(kind)
    })
    proc.on('error', (err) => {
      this.log(`[window] ${kind} 启动失败：${err.message}`)
      this.windows.delete(kind)
    })

    const shouldTop = topMost === undefined ? cfg.pet?.alwaysOnTop !== false : Boolean(topMost)
    if (process.platform === 'win32' && (shouldTop || chroma)) {
      setTimeout(() => {
        try {
          const ps = spawn('powershell.exe', [
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden',
            '-File', this.helperScript,
            '-Title', title || (page === 'pet' ? 'Whale Pet' : page === 'chat' ? 'Whale Chat' : 'Whale World'),
            '-ProcessId', String(proc.pid),
            '-TopMost', shouldTop ? '1' : '0',
            '-Chroma', chroma ? '1' : '0',
            '-Color', 'FF00FF',
            '-DragHeight', page === 'pet' ? '42' : '0',
            '-Width', String(width),
            '-Height', String(height),
            '-StateFile', path.join(this.profileDir(kind), 'window.json'),
          ], { stdio: 'ignore', windowsHide: true })
          entry.helper = ps
        } catch (err) {
          this.log(`[window] 窗口助手启动失败：${err.message}`)
        }
      }, 1600)
    }
    this.log(`[window] 打开 Edge ${kind}：${url.replace(/([?&]token=)[^&]+/, '$1***')}`)
    return { ok: true, kind, pid: proc.pid, electron: false }
  }

  openPet(extra = {}) {
    const cfg = this.getConfig()
    const scale = Number(cfg.pet?.scale) || 1
    const width = Math.round(380 * scale)
    const height = Math.round(600 * scale)
    if (this.electron()) return this.openElectron({ width, height, extra })
    return this.openEdge('pet', 'pet', {
      width,
      height,
      x: 980,
      y: 360,
      extra,
      chroma: cfg.pet?.chromaKey !== false,
      title: 'Whale Pet',
    })
  }

  /** Legacy separate chat window; the merged shell no longer uses it. */
  openChat() {
    return this.openEdge('chat', 'chat', {
      width: 460,
      height: 720,
      x: 520,
      y: 120,
      title: 'Whale Chat',
      topMost: false,
    })
  }

  openActivity({ view = 'game', file = '', remaining = 0 } = {}) {
    let rel = ''
    try {
      const root = this.dataPaths(this.getConfig()).root
      rel = path.relative(root, file).replaceAll('\\', '/')
    } catch {}
    return this.openEdge('activity', 'activity', {
      width: 780,
      height: 620,
      x: 260,
      y: 100,
      extra: { view, file: rel, remaining: String(remaining) },
      title: 'Whale World',
      topMost: false,
    })
  }

  close(kind) {
    const entry = this.windows.get(kind)
    if (!entry) return { ok: true, already: true }
    try {
      if (entry.helper) spawn('taskkill', ['/PID', String(entry.helper.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    } catch {}
    try {
      spawn('taskkill', ['/PID', String(entry.proc.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    } catch {}
    this.windows.delete(kind)
    return { ok: true }
  }

  closeAll() {
    for (const kind of [...this.windows.keys()]) this.close(kind)
  }

  status() {
    const out = {}
    for (const kind of ['pet', 'chat', 'activity']) {
      out[kind] = Boolean(this.windows.get(kind)?.proc && !this.windows.get(kind).proc.killed)
    }
    return out
  }
}
