const { app, BrowserWindow, dialog, ipcMain, shell, session } = require('electron');
const path = require('path');
const LicenseValidator = require('./licenseValidator');

let mainWindow;
let licenseValidator;

const PRODUCT_ID = 'EA_4oSdhfZvSBmSUXHzs0g=='; // ULTIMATE Product ID
licenseValidator = new LicenseValidator(PRODUCT_ID);

const PROTOCOL = 'evidenra';
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

function handleAuthCallback(url) {
  if (!url || !mainWindow) return;
  try {
    const urlObj = new URL(url);
    let accessToken = urlObj.searchParams.get('access_token');
    let refreshToken = urlObj.searchParams.get('refresh_token');
    if (!accessToken || !refreshToken) {
      const hash = urlObj.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
    }
    if (accessToken && refreshToken) {
      console.log('Auth callback received');
      mainWindow.webContents.send('auth-callback', { access_token: accessToken, refresh_token: refreshToken });
      mainWindow.focus();
    }
  } catch (error) {
    console.error('Error parsing auth callback URL:', error);
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    const url = commandLine.find(arg => arg.startsWith(PROTOCOL + '://'));
    if (url) handleAuthCallback(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-gpu-cache');
app.commandLine.appendSwitch('--disable-http-cache');
app.commandLine.appendSwitch('--disk-cache-size', '0');
app.commandLine.appendSwitch('--media-cache-size', '0');
app.commandLine.appendSwitch('--disable-application-cache');
app.commandLine.appendSwitch('--disable-offline-load-stale-cache');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--force-device-scale-factor', '1');

function createWindow() {
  console.log('Creating EVIDENRA Ultimate window...');
  const iconPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, '../../Logo.ico')
    : path.join(process.resourcesPath, 'Logo.ico');

  mainWindow = new BrowserWindow({
    width: 1400, height: 900, icon: iconPath,
    backgroundColor: '#0f172a', // Dark slate background - matches app theme
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, webSecurity: false,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    title: 'EVIDENRA Ultimate - v3.0 Quantum Enhanced',
    autoHideMenuBar: true, show: false
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audio'];
    callback(allowed.includes(permission));
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.session.clearCache().catch(() => {});
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    const possiblePaths = [
      path.join(__dirname, '../../dist/index.html'),
      path.join(__dirname, '../../public/index.html'),
      path.join(__dirname, '../../src/renderer/index.html')
    ];
    let loaded = false;
    const fs = require('fs');
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        mainWindow.loadFile(filePath);
        loaded = true;
        break;
      }
    }
    if (!loaded) {
      const tempHtml = path.join(__dirname, 'temp.html');
      fs.writeFileSync(tempHtml, '<!DOCTYPE html><html><body><h1>Loading...</h1></body></html>');
      mainWindow.loadFile(tempHtml);
    }
  }
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.on('crashed', () => { if (mainWindow) mainWindow.reload(); });
}

app.whenReady().then(async () => {
  app.on('open-url', (event, url) => { event.preventDefault(); handleAuthCallback(url); });

  // V1.0: Always create window immediately - authentication via beautiful UI in React
  // No more ugly system dialogs - the app handles login/trial internally with beautiful UI
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); });
process.on('unhandledRejection', (reason) => { console.error('Unhandled Rejection:', reason); });

ipcMain.handle('validate-license', async (event, licenseKey) => {
  return await licenseValidator.validateLicenseProduction(licenseKey);
});
ipcMain.handle('exit-app', () => app.quit());
ipcMain.handle('start-app', () => {
  createWindow();
  BrowserWindow.getAllWindows().forEach(w => { if (w.getTitle() === 'Enter License Key') w.close(); });
});
ipcMain.handle('clear-license', async () => { await licenseValidator.clearLicenseData(); return { success: true }; });
ipcMain.handle('get-license-info', async () => {
  const data = await licenseValidator.loadLicenseData();
  if (data) return { valid: true, validatedAt: data.validatedAt, uses: data.uses, customerEmail: (data.purchase && data.purchase.email) || 'Unknown' };
  return { valid: false };
});
ipcMain.handle('check-trial-status', async () => await licenseValidator.checkTrialStatus());
ipcMain.handle('toggle-devtools', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) { mainWindow.webContents.closeDevTools(); return { isOpen: false }; }
    else { mainWindow.webContents.openDevTools(); return { isOpen: true }; }
  }
  return { isOpen: false };
});
ipcMain.handle('open-external', async (event, url) => { await shell.openExternal(url); return { success: true }; });

// License Dialog Functions
async function showLicenseDialog() {
  const result = await dialog.showMessageBox(null, {
    type: 'info',
    title: 'EVIDENRA ULTIMATE - License Required',
    message: 'Please enter your license key to continue.',
    detail: 'You need a valid license key to use EVIDENRA ULTIMATE. You can start a 30-day free trial.',
    buttons: ['Enter License Key', 'Start 30-Day Trial', 'Exit'],
    defaultId: 0,
    cancelId: 2
  });

  if (result.response === 0) {
    await showLicenseInputDialog();
  } else if (result.response === 1) {
    const trialStatus = await licenseValidator.initializeTrial();
    if (trialStatus.isValid) {
      console.log(`🔓 Trial started: ${trialStatus.daysLeft} days`);
      createWindow();
    } else {
      await dialog.showMessageBox(null, {
        type: 'error',
        title: 'Trial Error',
        message: trialStatus.reason || 'Could not start trial'
      });
      app.quit();
    }
  } else {
    app.quit();
  }
}

async function showLicenseInputDialog() {
  const licenseWindow = new BrowserWindow({
    width: 500, height: 350,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, '../preload/licensePreload.js')
    },
    title: 'Enter License Key',
    autoHideMenuBar: true, modal: true, resizable: false
  });

  const licenseHtml = `<!DOCTYPE html>
<html><head><title>License Key</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 30px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white;
    display: flex; flex-direction: column; justify-content: center; min-height: 100vh; }
  .container { text-align: center; max-width: 400px; margin: 0 auto; padding: 20px;
    background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.1); }
  h1 { margin-bottom: 20px; font-size: 22px; color: #fbbf24; }
  input { width: 100%; padding: 12px; font-size: 14px; border: 2px solid rgba(251,191,36,0.3);
    border-radius: 8px; margin-bottom: 20px; text-align: center; background: rgba(255,255,255,0.9); color: #333; }
  button { padding: 12px 24px; font-size: 14px; border: none; border-radius: 8px; margin: 5px;
    cursor: pointer; background: #fbbf24; color: #0f172a; font-weight: 600; }
  button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(251,191,36,0.3); }
  .error { color: #fca5a5; margin-top: 15px; min-height: 20px; }
  #loading { color: #86efac; margin-top: 10px; }
</style></head>
<body><div class="container">
  <h1>👑 EVIDENRA ULTIMATE License</h1>
  <input type="text" id="licenseKey" placeholder="Enter your license key..." />
  <br><button onclick="validateLicense()">Validate License</button>
  <button onclick="exitApp()">Exit</button>
  <div id="error" class="error"></div>
  <div id="loading" style="display: none;">Validating...</div>
</div>
<script>
  async function validateLicense() {
    const key = document.getElementById('licenseKey').value.trim();
    if (!key) { document.getElementById('error').textContent = 'Please enter a license key'; return; }
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').textContent = '';
    try {
      const result = await window.electronAPI.validateLicense(key);
      document.getElementById('loading').style.display = 'none';
      if (result.valid) {
        document.getElementById('error').style.color = '#86efac';
        document.getElementById('error').textContent = 'License valid! Starting...';
        setTimeout(() => window.electronAPI.startApp(), 1500);
      } else {
        document.getElementById('error').textContent = result.error || 'Invalid license';
      }
    } catch (e) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').textContent = 'Error: ' + e.message;
    }
  }
  function exitApp() { window.electronAPI.exitApp(); }
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('licenseKey').focus();
    document.getElementById('licenseKey').addEventListener('keypress', e => { if (e.key === 'Enter') validateLicense(); });
  });
</script></body></html>`;

  const fs = require('fs');
  const tempFile = path.join(__dirname, 'license.html');
  fs.writeFileSync(tempFile, licenseHtml);
  licenseWindow.loadFile(tempFile);
}

console.log('EVIDENRA Ultimate main process loaded');
