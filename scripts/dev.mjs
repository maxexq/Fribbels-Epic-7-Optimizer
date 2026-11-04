/**
 * Development runner:
 *   1. starts the Vite dev server for the React UI layer (HMR),
 *   2. builds the Electron main process and rebuilds it on change,
 *   3. launches Electron with UI_DEV_SERVER so app/ui-loader.js loads the
 *      UI from the dev server. Legacy files (js/, css/, app.html) are read
 *      from disk: reload the window (Ctrl/Cmd+R) after editing them.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';
import electronPath from 'electron';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'app');

const ui = await createServer({ configFile: path.join(appDir, 'ui/vite.config.mts') });
await ui.listen();
const uiUrl = ui.resolvedUrls?.local[0] ?? 'http://localhost:5173/';
ui.printUrls();

let electron = null;
let restarting = false;

function startElectron() {
  electron = spawn(electronPath, [appDir, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, UI_DEV_SERVER: uiUrl, NODE_ENV: 'development' },
  });
  electron.on('exit', (code) => {
    if (restarting) return;
    ui.close();
    process.exit(code ?? 0);
  });
}

// Build main once, then watch: restart Electron whenever it is rebuilt.
const watcher = await build({
  configFile: path.join(appDir, 'main/vite.config.mts'),
  mode: 'development',
  build: { watch: {} },
  logLevel: 'warn',
});

watcher.on('event', (event) => {
  if (event.code !== 'END') return;
  if (!electron) {
    startElectron();
    return;
  }
  console.log('[dev] main process rebuilt, restarting Electron…');
  restarting = true;
  electron.once('exit', () => {
    restarting = false;
    startElectron();
  });
  electron.kill();
});
