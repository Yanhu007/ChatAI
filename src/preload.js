const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is running');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (...args) => {
      console.log('IPC invoke called with args:', args);
      return ipcRenderer.invoke(...args);
    }
  }
});

console.log('Electron APIs exposed'); 