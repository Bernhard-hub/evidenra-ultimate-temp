const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  validateLicense: (licenseKey) => ipcRenderer.invoke('validate-license', licenseKey),
  exitApp: () => ipcRenderer.invoke('exit-app'),
  startApp: () => ipcRenderer.invoke('start-app'),
  onLicenseResult: (callback) => {
    ipcRenderer.on('license-result', (event, result) => callback(result));
    // Also handle the response from the invoke
    return new Promise((resolve) => {
      const handleResult = async (licenseKey) => {
        const result = await ipcRenderer.invoke('validate-license', licenseKey);
        callback(result);
        resolve(result);
      };
      // Store the handler for later use
      window._licenseHandler = handleResult;
    });
  }
});

// Override the validateLicense function to handle the result properly
window.addEventListener('DOMContentLoaded', () => {
  const originalValidateLicense = window.validateLicense;
  window.validateLicense = async function() {
    const licenseKey = document.getElementById('licenseKey').value.trim();
    if (!licenseKey) {
      document.getElementById('error').textContent = 'Please enter a license key';
      return;
    }
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').textContent = '';
    
    try {
      const result = await window.electronAPI.validateLicense(licenseKey);
      document.getElementById('loading').style.display = 'none';
      
      if (result.valid) {
        document.getElementById('error').style.color = '#90EE90';
        document.getElementById('error').textContent = 'License valid! Starting application...';
        setTimeout(() => {
          window.electronAPI.startApp();
        }, 2000);
      } else {
        document.getElementById('error').textContent = 'Invalid license key: ' + (result.error || 'Unknown error');
      }
    } catch (error) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').textContent = 'Error validating license: ' + error.message;
    }
  };
});