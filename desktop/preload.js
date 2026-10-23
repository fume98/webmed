const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('agendaDesktop', {
  version: '1.1.0',
  platform: process.platform,
  startLan: () => ipcRenderer.invoke('lan:start'),
  lanInfo: () => ipcRenderer.invoke('lan:info'),
});
