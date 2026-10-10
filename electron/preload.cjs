const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lioma', {
  keyStatus: () => ipcRenderer.invoke('lioma:key-status'),
  saveKey: (key) => ipcRenderer.invoke('lioma:save-key', key),
  chat: (payload) => ipcRenderer.invoke('lioma:chat', payload),
  openExternal: (url) => ipcRenderer.invoke('lioma:open-external', url)
});