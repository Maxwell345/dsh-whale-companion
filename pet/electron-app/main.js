const { app, BrowserWindow, ipcMain, screen } = require('electron')
const fs = require('fs')
const path = require('path')

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
app.commandLine.appendSwitch('enable-transparent-visuals')

let win = null
let closing = false
let dragState = null
let dragTimer = null
let climbSide = ''
let climbTimer = null
let avatarAxisX = 190
let wallInsetLeft = 0
let wallInsetRight = 0
const CLIMB_SPEED = 36 // px per second

function createWindow() {
  const url = process.env.WHALE_URL || ''
  if (!url) {
    console.error('[whale-shell] WHALE_URL is required')
    app.quit()
    return
  }
  const width = Number(process.env.WHALE_WIDTH || 380)
  const height = Number(process.env.WHALE_HEIGHT || 600)
  avatarAxisX = Math.round(width / 2)
  wallInsetLeft = 0
  wallInsetRight = width
  const work = screen.getPrimaryDisplay().workArea
  const x = Number(process.env.WHALE_X || (work.x + work.width - width - 40))
  const y = Number(process.env.WHALE_Y || (work.y + Math.round((work.height - height) / 2)))

  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 220,
    minHeight: 350,
    transparent: true,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    show: false,
    title: 'Whale Pet',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      webSecurity: true,
    },
  })
  win.setMenuBarVisibility(false)
  win.setAlwaysOnTop(true, 'screen-saver')
  try { win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }) } catch {}
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, next) => {
    try {
      if (new URL(next).origin !== new URL(url).origin) event.preventDefault()
    } catch { event.preventDefault() }
  })
  win.once('ready-to-show', () => { win.show() })
  win.on('closed', () => {
    win = null
    dragState = null
    climbSide = ''
    if (dragTimer) clearInterval(dragTimer)
    dragTimer = null
    if (climbTimer) clearInterval(climbTimer)
    climbTimer = null
  })
  win.loadURL(url).catch((err) => console.error('[whale-shell] load failed', err))

  win.webContents.on('did-finish-load', () => {
    console.log('[whale-shell] loaded', win.getBounds())
    if (process.env.WHALE_TEST_TOUCH === '1') {
      setTimeout(async () => {
        try {
          const selector = process.env.WHALE_TEST_ZONE || '.hit-head'
          const out = await win.webContents.executeJavaScript(`(() => {
            const el = document.querySelector(${JSON.stringify(selector)})
            if (!el) return 'no-hit'
            const r = el.getBoundingClientRect()
            const point = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType: 'mouse' }
            el.dispatchEvent(new PointerEvent('pointerdown', point))
            el.dispatchEvent(new PointerEvent('pointerup', point))
            return 'dispatched ' + Math.round(r.left) + ',' + Math.round(r.top)
          })()`)
          console.log('[whale-shell] touch test', out)
        } catch (err) { console.error('[whale-shell] touch test failed', err) }
      }, 3000)
    }
    if (process.env.WHALE_TEST_DRAG === '1') {
      setTimeout(async () => {
        try {
          const before = win.getBounds()
          const point = await win.webContents.executeJavaScript(`(() => {
            const r = document.querySelector('.hit-head').getBoundingClientRect()
            return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
          })()`)
          win.webContents.sendInputEvent({ type: 'mouseDown', x: point.x, y: point.y, button: 'left', clickCount: 1 })
          setTimeout(() => win.webContents.sendInputEvent({ type: 'mouseMove', x: point.x + 60, y: point.y + 40, button: 'left', clickCount: 0 }), 120)
          setTimeout(() => win.webContents.sendInputEvent({ type: 'mouseUp', x: point.x + 60, y: point.y + 40, button: 'left', clickCount: 1 }), 240)
          await new Promise((r) => setTimeout(r, 700))
          console.log('[whale-shell] drag test', before, '=>', win.getBounds())
        } catch (err) { console.error('[whale-shell] drag test failed', err) }
      }, 3000)
    }
    if (process.env.WHALE_TEST_FOLD === '1') {
      setTimeout(async () => {
        try {
          const frame = win.webContents.mainFrame.frames.find((f) => f.url.includes('/dsh-whale/chat'))
          if (frame) await frame.executeJavaScript("document.getElementById('btnCloseChat').click()")
          console.log('[whale-shell] fold clicked')
        } catch (err) { console.error('[whale-shell] fold test failed', err) }
      }, 3500)
    }
    if (process.env.WHALE_AUTOCLOSE === '1') {
      setTimeout(async () => {
        try {
          if (process.env.WHALE_CAPTURE) {
            const image = await win.webContents.capturePage()
            fs.writeFileSync(process.env.WHALE_CAPTURE, image.toPNG())
            console.log('[whale-shell] captured', process.env.WHALE_CAPTURE)
          }
        } catch (err) { console.error('[whale-shell] capture failed', err) }
        app.quit()
      }, Number(process.env.WHALE_AUTOCLOSE_MS || (process.env.WHALE_TEST_FOLD === '1' ? 6500 : 2500)))
    }
  })
}

ipcMain.handle('whale:set-size', (_event, size) => {
  if (!win || win.isDestroyed()) return null
  const width = Math.max(220, Math.min(1200, Math.round(Number(size?.width) || 380)))
  const height = Math.max(350, Math.min(1000, Math.round(Number(size?.height) || 600)))
  const b = win.getBounds()
  win.setBounds({ x: b.x, y: b.y, width, height }, false)
  return win.getBounds()
})

ipcMain.handle('whale:get-bounds', () => (win && !win.isDestroyed() ? win.getBounds() : null))

// Manual drag: the renderer decides whether a press is a touch (quick click)
// or a drag (hold / move). Once dragging, main polls the cursor at ~60fps and
// moves with an explicit width/height. Calling setPosition on every renderer
// pointermove caused transparent-window flicker and 1px-per-move size creep.
function stopDragTimer() {
  if (dragTimer) clearInterval(dragTimer)
  dragTimer = null
  dragState = null
}

function workAreaFor(bounds) {
  let display
  try { display = screen.getDisplayMatching(bounds) } catch { display = screen.getPrimaryDisplay() }
  return display.workArea
}

// The avatar's center line is the wall contact. At the threshold the window is
// deliberately allowed to sit half outside the screen.
function edgeSideFor(bounds) {
  const work = workAreaFor(bounds)
  const axis = bounds.x + avatarAxisX
  if (axis <= work.x) return 'left'
  if (axis >= work.x + work.width) return 'right'
  return ''
}

function stopClimb(sendIdle = true) {
  if (climbTimer) clearInterval(climbTimer)
  climbTimer = null
  const had = Boolean(climbSide)
  climbSide = ''
  if (had && sendIdle && win && !win.isDestroyed()) {
    try { win.webContents.send('whale:climb', '') } catch {}
  }
}

function startClimb(side) {
  if (!win || win.isDestroyed()) return
  stopDragTimer()
  if (climbSide === side && climbTimer) return
  if (climbTimer) clearInterval(climbTimer)

  const work = workAreaFor(win.getBounds())
  const b = win.getBounds()
  const width = b.width
  const height = b.height
  // The centerline crossing the edge is only the trigger. Align the painted
  // body edge to the screen edge, not the window rectangle's transparent margin.
  const x = side === 'left' ? work.x - wallInsetLeft : work.x + work.width - wallInsetRight
  win.setBounds({ x: Math.round(x), y: b.y, width, height }, false)
  climbSide = side
  try { win.webContents.send('whale:climb', side) } catch {}

  let last = Date.now()
  climbTimer = setInterval(() => {
    if (!win || win.isDestroyed() || climbSide !== side) {
      if (climbTimer) clearInterval(climbTimer)
      climbTimer = null
      return
    }
    const now = Date.now()
    const dt = Math.min(120, now - last)
    last = now
    const bounds = win.getBounds()
    const area = workAreaFor(bounds)
    const y = Math.max(area.y, bounds.y - CLIMB_SPEED * dt / 1000)
    const nextX = side === 'left' ? area.x - wallInsetLeft : area.x + area.width - wallInsetRight
    const nextY = Math.round(y)
    if (bounds.x !== Math.round(nextX) || bounds.y !== nextY || bounds.width !== width || bounds.height !== height) {
      win.setBounds({ x: Math.round(nextX), y: nextY, width, height }, false)
    }
    // Reached the top: keep the climbing loop, but stop moving up.
    if (nextY <= area.y) {
      if (climbTimer) clearInterval(climbTimer)
      climbTimer = null
    }
  }, 33)
}

function updateClimbSide(bounds) {
  if (!win || win.isDestroyed()) return
  const next = edgeSideFor(bounds)
  if (next === climbSide) return
  if (climbSide) stopClimb()
  if (next) startClimb(next)
}

ipcMain.on('whale:axis', (_event, x) => {
  if (!win || win.isDestroyed()) return
  const b = win.getBounds()
  const n = Number(x)
  if (Number.isFinite(n)) avatarAxisX = Math.max(0, Math.min(b.width, n))
})

ipcMain.on('whale:wall-inset', (_event, data) => {
  if (!win || win.isDestroyed()) return
  const b = win.getBounds()
  const left = Number(data?.left)
  const right = Number(data?.right)
  if (Number.isFinite(left)) wallInsetLeft = Math.max(0, Math.min(b.width, left))
  if (Number.isFinite(right)) wallInsetRight = Math.max(0, Math.min(b.width, right))
})

ipcMain.on('whale:drag-start', () => {
  if (!win || win.isDestroyed()) return
  stopClimb()
  stopDragTimer()
  dragState = { cursor: screen.getCursorScreenPoint(), bounds: win.getBounds() }
  dragTimer = setInterval(() => {
    if (!win || win.isDestroyed() || !dragState) { stopDragTimer(); return }
    const cursor = screen.getCursorScreenPoint()
    const nextX = Math.round(dragState.bounds.x + cursor.x - dragState.cursor.x)
    const nextY = Math.round(dragState.bounds.y + cursor.y - dragState.cursor.y)
    const b = win.getBounds()
    if (b.width !== dragState.bounds.width || b.height !== dragState.bounds.height) {
      win.setBounds({ x: nextX, y: nextY, width: dragState.bounds.width, height: dragState.bounds.height }, false)
    } else if (nextX !== b.x || nextY !== b.y) {
      // setPosition does not fire a resize/ResizeObserver, so the sprite canvas
      // is not rebuilt on every frame. The size guard above still corrects any
      // DPI rounding drift.
      win.setPosition(nextX, nextY, false)
    }
    updateClimbSide(win.getBounds())
  }, 16)
})
ipcMain.on('whale:drag-move', () => { /* main polls the cursor while dragging */ })
ipcMain.on('whale:drag-end', () => {
  if (win && !win.isDestroyed() && dragState) {
    const b = win.getBounds()
    win.setBounds({ x: b.x, y: b.y, width: dragState.bounds.width, height: dragState.bounds.height }, false)
    updateClimbSide(win.getBounds())
  }
  stopDragTimer()
})

ipcMain.handle('whale:set-position', (_event, pos) => {
  if (!win || win.isDestroyed()) return null
  const b = win.getBounds()
  const x = Math.round(Number(pos?.x))
  const y = Math.round(Number(pos?.y))
  if (Number.isFinite(x) && Number.isFinite(y)) win.setPosition(x, y, false)
  return win.getBounds()
})

ipcMain.on('whale:close', () => {
  closing = true
  if (win && !win.isDestroyed()) win.close()
  app.quit()
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
app.on('before-quit', () => { closing = true })
