const { app, BrowserWindow, ipcMain, screen } = require('electron')
const fs = require('fs')
const path = require('path')

app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
app.commandLine.appendSwitch('enable-transparent-visuals')

let win = null
let closing = false
let dragState = null
let dragTimer = null

function createWindow() {
  const url = process.env.WHALE_URL || ''
  if (!url) {
    console.error('[whale-shell] WHALE_URL is required')
    app.quit()
    return
  }
  const width = Number(process.env.WHALE_WIDTH || 380)
  const height = Number(process.env.WHALE_HEIGHT || 600)
  const work = screen.getPrimaryDisplay().workArea
  const x = Number(process.env.WHALE_X || (work.x + work.width - width - 40))
  const y = Number(process.env.WHALE_Y || (work.y + Math.round((work.height - height) / 2)))

  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 320,
    minHeight: 480,
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
    if (dragTimer) clearInterval(dragTimer)
    dragTimer = null
  })
  win.loadURL(url).catch((err) => console.error('[whale-shell] load failed', err))

  win.webContents.on('did-finish-load', () => {
    console.log('[whale-shell] loaded', win.getBounds())
    if (process.env.WHALE_TEST_TOUCH === '1') {
      setTimeout(async () => {
        try {
          const out = await win.webContents.executeJavaScript(`(() => {
            const el = document.querySelector('.hit-head')
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
  const width = Math.max(320, Math.min(1200, Math.round(Number(size?.width) || 380)))
  const height = Math.max(480, Math.min(1000, Math.round(Number(size?.height) || 600)))
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

ipcMain.on('whale:drag-start', () => {
  if (!win || win.isDestroyed()) return
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
  }, 16)
})
ipcMain.on('whale:drag-move', () => { /* main polls the cursor while dragging */ })
ipcMain.on('whale:drag-end', () => {
  if (win && !win.isDestroyed() && dragState) {
    const b = win.getBounds()
    win.setBounds({ x: b.x, y: b.y, width: dragState.bounds.width, height: dragState.bounds.height }, false)
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
