const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('whaleShell', {
  isElectron: true,
  setSize: (width, height) => ipcRenderer.invoke('whale:set-size', { width, height }),
  getBounds: () => ipcRenderer.invoke('whale:get-bounds'),
  setPosition: (x, y) => ipcRenderer.invoke('whale:set-position', { x, y }),
  beginDrag: () => ipcRenderer.send('whale:drag-start'),
  dragTo: () => ipcRenderer.send('whale:drag-move'),
  endDrag: () => ipcRenderer.send('whale:drag-end'),
  close: () => ipcRenderer.send('whale:close'),
})
