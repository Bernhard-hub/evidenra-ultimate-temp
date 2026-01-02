const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  showMessage: (message) => ipcRenderer.invoke('dialog:showMessage', message),
  // License management
  validateLicense: (licenseKey) => ipcRenderer.invoke('validate-license', licenseKey),
  clearLicense: () => ipcRenderer.invoke('clear-license'),
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),
  // Trial management (Portable + Persistent)
  checkTrialStatus: () => ipcRenderer.invoke('check-trial-status'),
  // Console toggle
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'),
  // Open external URL (for Magic Link)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // PDF Processing via Main Process (pdf-parse)
  processPDF: (arrayBuffer) => ipcRenderer.invoke('process-pdf', arrayBuffer)
});

// Expose Electron APIs for auth
contextBridge.exposeInMainWorld('electron', {
  shell: {
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
  },
  onAuthCallback: (callback) => {
    ipcRenderer.on('auth-callback', (event, tokens) => {
      callback(tokens);
    });
  }
});
