/**
 * Electron main process.
 *
 * Built by Vite (see app/main/vite.config.mts) into ./app/main.prod.js.
 * Runtime dependencies are resolved from app/node_modules (electron-builder's
 * two package.json structure), so they are kept external to the bundle.
 */
import path from 'node:path';
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log/main';
import * as remoteMain from '@electron/remote/main';

const isMac = process.platform === 'darwin';
let closed = false;
let mainWindow: BrowserWindow | null = null;

// Match build.appId
app.setAppUserModelId('fribbelse7optimizer');
app.setAsDefaultProtocolClient('fribbelse7optimizer');

remoteMain.initialize();
log.initialize();

const template: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
  },
  {
    label: 'View',
    submenu: [
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'reload' },
      { role: 'forceReload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    role: 'window',
    submenu: [{ role: 'minimize' }, { role: 'close' }],
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: () => shell.openExternal('https://github.com/fribbels/Fribbels-Epic-7-Optimizer'),
      },
    ],
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));

function setupAutoUpdater() {
  log.transports.file.level = 'info';
  autoUpdater.logger = log;
  autoUpdater.allowDowngrade = true;
  autoUpdater.checkForUpdatesAndNotify().catch((e) => log.warn('Update check failed', e));
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '../resources');

async function createWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 700,
    icon: path.join(RESOURCES_PATH, 'icon.png'),
    // Matches the app background so there is no white flash on start.
    backgroundColor: '#0f1117',
    webPreferences: {
      // The legacy renderer relies on Node integration (require, fs, child_process).
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  remoteMain.enable(mainWindow.webContents);

  await mainWindow.loadFile(path.join(__dirname, 'app.html'));

  if (process.env.START_MINIMIZED) {
    mainWindow.minimize();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }

  if (process.env.UI_DEV_SERVER) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', () => mainWindow?.webContents.send('resize'));
  mainWindow.on('resized', () => mainWindow?.webContents.send('resized'));

  // Let the renderer autosave before the window actually closes.
  mainWindow.on('close', (e) => {
    if (!closed) {
      e.preventDefault();
      mainWindow?.webContents.send('app-close');
    }
  });

  if (app.isPackaged) {
    setupAutoUpdater();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('update-electron-app')({
      repo: 'fribbels/Fribbels-Epic-7-Optimizer',
      updateInterval: '5 minutes',
    });
  }
}

ipcMain.on('closed', () => {
  closed = true;
  if (!isMac) {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Respect the macOS convention of keeping the app alive with no windows.
  if (!isMac) {
    app.quit();
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

ipcMain.on('app_version', (event) => {
  event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('test', async (event) => {
  const updates = await autoUpdater.checkForUpdates();
  event.sender.send('test', JSON.stringify(updates));
});

ipcMain.on('check', async (event) => {
  const updates = await autoUpdater.checkForUpdatesAndNotify();
  event.sender.send('check', updates);
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update_available');
});
autoUpdater.on('update-downloaded', (data) => {
  mainWindow?.webContents.send('update_downloaded', data);
});
autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('update_not_available');
});
