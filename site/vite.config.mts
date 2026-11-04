import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { Marked } from 'marked';
import GithubSlugger from 'github-slugger';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const README = path.join(repoRoot, 'README.md');

// Where relative links in the README point to (files that aren't on the site).
const REPO_BLOB = 'https://github.com/maxexq/Fribbels-Epic-7-Optimizer/blob/main/';

export interface GuideHeading {
  id: string;
  text: string;
  depth: number;
}

/**
 * Turns README.md into the site's guide at build time:
 * `import guide from 'virtual:guide'` -> { html, headings }.
 * Heading ids use GitHub's slug rules, so README anchors keep working.
 * The intro (title, feature list, screenshots, manual TOC) is dropped —
 * the landing page covers it — and the guide starts at "## Requirements".
 */
function readmeGuide(): Plugin {
  const id = 'virtual:guide';
  const resolved = '\0' + id;

  function render() {
    const source = readFileSync(README, 'utf8');
    const start = source.indexOf('\n## Requirements');
    const body = start >= 0 ? source.slice(start) : source;

    const slugger = new GithubSlugger();
    const headings: GuideHeading[] = [];
    const marked = new Marked({ gfm: true });

    marked.use({
      renderer: {
        heading({ tokens, depth, text }) {
          const plain = text.replace(/<[^>]+>/g, '').replace(/\*\*/g, '').trim();
          const slug = slugger.slug(plain);
          headings.push({ id: slug, text: plain.replace(/\s+/g, ' '), depth });
          const inner = this.parser.parseInline(tokens);
          return `<h${depth} id="${slug}"><a class="anchor" href="#${slug}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${depth}>\n`;
        },
        link({ href, title, tokens }) {
          const inner = this.parser.parseInline(tokens);
          let url = href ?? '';
          const external = /^https?:\/\//.test(url);
          if (!external && !url.startsWith('#')) url = REPO_BLOB + url.replace(/^\.\//, '');
          const attrs = url.startsWith('#') ? '' : ' target="_blank" rel="noopener noreferrer"';
          return `<a href="${url}"${title ? ` title="${title}"` : ''}${attrs}>${inner}</a>`;
        },
        image({ href, title, text }) {
          let src = href ?? '';
          if (src.startsWith('docs/')) src = '/' + src.slice('docs/'.length);
          return `<img src="${src}" alt="${text ?? ''}"${title ? ` title="${title}"` : ''} loading="lazy" decoding="async">`;
        },
      },
    });

    // Bare URLs in the README are mostly long; let marked autolink them (gfm).
    const html = marked.parse(body) as string;
    return { html, headings };
  }

  return {
    name: 'readme-guide',
    resolveId(source) {
      return source === id ? resolved : undefined;
    },
    load(loadId) {
      if (loadId !== resolved) return;
      this.addWatchFile(README);
      return `export default ${JSON.stringify(render())};`;
    },
    handleHotUpdate(ctx) {
      if (ctx.file === README) {
        const mod = ctx.server.moduleGraph.getModuleById(resolved);
        if (mod) ctx.server.moduleGraph.invalidateModule(mod);
        ctx.server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  root: here,
  // docs/ (screenshots) is served at the site root: /screenshots/*.jpg
  publicDir: path.join(repoRoot, 'docs'),
  plugins: [react(), tailwindcss(), readmeGuide()],
  resolve: { alias: { '@': path.join(here, 'src') } },
  server: { port: 5174 },
  build: { outDir: path.join(here, 'dist'), emptyOutDir: true, target: 'es2022' },
});
