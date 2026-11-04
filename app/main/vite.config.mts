import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import appPkg from '../package.json' with { type: 'json' };

const here = path.dirname(fileURLToPath(import.meta.url));

// Everything the app ships in app/node_modules is resolved at runtime, so it
// stays out of the bundle (along with electron and node builtins).
const external = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
  ...Object.keys(appPkg.dependencies ?? {}),
].map((dep) => new RegExp(`^${dep.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(/.*)?$`));

export default defineConfig({
  // Repo root (outDir app/ must not be the root or one of its parents).
  root: path.resolve(here, '../..'),
  build: {
    target: 'node22',
    outDir: path.resolve(here, '..'),
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    // SSR build = Node target: no browser polyfills, node builtins allowed.
    ssr: path.resolve(here, 'main.ts'),
    rollupOptions: {
      external,
      output: {
        format: 'cjs',
        entryFileNames: 'main.prod.js',
      },
    },
  },
});
