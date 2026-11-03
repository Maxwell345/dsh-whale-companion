const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('whaleShell', {
  isElectron: true,
  setSize: (width, height) => ipcRenderer.invoke('whale:set-size', { width, height }),
  getBounds: () => ipcRenderer.invoke('whale:get-bounds'),
  setPosition: (x, y) => ipcRenderer.invoke('whale:set-position', { x, y }),
  setAxis: (x) => ipcRenderer.send('whale:axis', x),
  setWallInset: (left, right) => ipcRenderer.send('whale:wall-inset', { left, right }),
  beginDrag: () => ipcRenderer.send('whale:drag-start'),
  dragTo: () => ipcRenderer.send('whale:drag-move'),
  endDrag: () => ipcRenderer.send('whale:drag-end'),
  onClimb: (callback) => {
    ipcRenderer.on('whale:climb', (_event, side) => callback(side))
  },
  close: () => ipcRenderer.send('whale:close'),
})
