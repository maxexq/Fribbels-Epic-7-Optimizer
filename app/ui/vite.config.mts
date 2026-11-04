import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEV_PORT = 5173;

/*
 * The React UI layer is not a standalone page: it is loaded into the legacy
 * app.html by app/ui-loader.js. In dev, the page (file://) imports modules from
 * this server; in production it loads the single ES module bundle + CSS file
 * emitted to app/ui-dist.
 */
export default defineConfig({
  root: here,
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(here, 'src') },
  },
  server: {
    port: DEV_PORT,
    strictPort: true,
    // The page is loaded from file:// (origin "null"), so allow any origin.
    cors: true,
    origin: `http://localhost:${DEV_PORT}`,
  },
  build: {
    outDir: path.resolve(here, '../ui-dist'),
    emptyOutDir: true,
    target: 'es2023',
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(here, 'src/main.tsx'),
      output: {
        format: 'es',
        entryFileNames: 'ui.js',
        assetFileNames: (asset) =>
          asset.names?.some((n) => n.endsWith('.css')) ? 'ui.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
