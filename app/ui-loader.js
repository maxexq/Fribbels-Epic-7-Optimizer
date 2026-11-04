/*
 * Loads the React UI layer (app/ui) into the legacy page.
 *
 * - `yarn dev` sets UI_DEV_SERVER (e.g. http://localhost:5173): modules are
 *   served by Vite with React Fast Refresh / HMR.
 * - Otherwise the production bundle from app/ui-dist is used.
 *
 * Runs as a classic script in <head>, so the bundle's CSS lands after the
 * legacy stylesheets. The module may run before parsing finishes, so
 * app/ui/src/main.tsx waits for DOMContentLoaded before mounting.
 */
(function () {
  var devServer = typeof process !== 'undefined' && process.env && process.env.UI_DEV_SERVER;

  function addModule(src, inline) {
    var s = document.createElement('script');
    s.type = 'module';
    if (inline) s.textContent = inline;
    else s.src = src;
    document.head.appendChild(s);
  }

  if (devServer) {
    devServer = devServer.replace(/\/$/, '');
    // One module so the order is guaranteed: the React Refresh preamble must be
    // installed before any component module is evaluated.
    addModule(null,
      "import RefreshRuntime from '" + devServer + "/@react-refresh';\n" +
      'RefreshRuntime.injectIntoGlobalHook(window);\n' +
      'window.$RefreshReg$ = () => {};\n' +
      'window.$RefreshSig$ = () => (type) => type;\n' +
      'window.__vite_plugin_react_preamble_installed__ = true;\n' +
      "await import('" + devServer + "/@vite/client');\n" +
      "await import('" + devServer + "/src/main.tsx');\n");
    return;
  }

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'ui-dist/ui.css';
  document.head.appendChild(css);
  addModule('ui-dist/ui.js');
})();
