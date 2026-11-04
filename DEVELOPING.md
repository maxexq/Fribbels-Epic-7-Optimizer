# Developing

The app is an Electron shell around two renderer layers that share one page:

- **Legacy UI** — `app/app.html`, `app/js/**`, `app/css/**`. jQuery + ag-grid, loaded
  directly from disk with Node integration. Most tabs still live here.
- **New UI** — `app/ui/` — React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
  (Radix). Built by Vite and mounted into `app.html` by `app/ui-loader.js`.
  It currently renders the app shell (top bar, navigation, theme toggle) and
  the **Settings** tab.

Tabs are migrated one at a time from the legacy UI to `app/ui`.

The optimizer itself runs in the Java backend (`data/jar/backend.jar`, source in
`backend/`), which the renderer starts on port 8130.

## Requirements

- Node.js 22+ and Yarn 1 (classic)
- Java 8+ (64-bit) to run the backend

## Scripts

```sh
yarn install          # root toolchain; also installs app/ deps for Electron
yarn dev              # Vite dev server (HMR) + Electron
yarn build            # app/main.prod.js + app/ui-dist/
yarn start            # build, then run Electron
yarn typecheck        # tsc for app/main and app/ui
yarn package-win      # / package-mac / package-linux: installers in release/
```

In `yarn dev`, React code hot-reloads in place. Legacy files (`app/js`, `app/css`,
`app.html`) are read from disk: press Ctrl/Cmd+R to reload the window after
editing them. Editing `app/main/main.ts` restarts Electron.

## Layout

```
app/
  main/            Electron main process (TypeScript, built by Vite → app/main.prod.js)
  ui/              React UI layer
    src/shell/       app shell (top bar + navigation)
    src/features/    migrated tabs (settings/)
    src/components/ui/  shadcn/ui components
    src/lib/legacy.ts   the only place that touches legacy globals
  ui-loader.js     loads app/ui from the dev server or app/ui-dist
  app.html         the page; legacy tab markup + React mount points
  css/
    tokens.css       design tokens (colors, radii, fonts) for light + dark
    app.css          stylesheet entry: vendor + legacy CSS in cascade layers
    legacy-theme.css theme for the legacy tabs, built on the tokens
    overrides.css    unlayered overrides for CSS injected at runtime (sweetalert2)
  js/lib/          legacy modules (registered as globals in inputHandler.js)
```

## Theming

All colors come from `app/css/tokens.css` (`:root` = light, `html.dark` = dark).
The legacy CSS reads them through its old variable names (`--bg-color`, …) and
Tailwind maps them in `app/ui/src/styles/app.css` (`bg-surface`,
`text-muted-foreground`, `bg-primary`, …), so both layers always match.

Dark mode is the `dark` class on `<html>`, set by `DarkMode.setDark()`. The
"Custom dark mode colors" settings override tokens through `--user-*` properties.

CSS precedence is explicit: `vendor < legacy < Tailwind`. Tailwind's preflight is
not used (it would reset the legacy tabs); React mount points and portals carry
the `ui-scope` class, which gets a scoped reset instead.

## Migrating a tab to React

1. Create `app/ui/src/features/<tab>/` and mount it in `app/ui/src/main.tsx`
   into a container inside the tab's `.tab-panel` in `app.html`.
2. Read and write shared state through the legacy modules, wrapped in
   `src/lib/legacy.ts` (see `useSettings()` / `updateSettings()`). Move state
   out of the DOM into the module first if other code reads it from inputs —
   `js/lib/settings.js` is the example.
3. Use i18n keys that already exist in `data/locales/*/translation.json` (the
   English text) via `useT()` so translations keep working.
4. Remove the legacy markup and any JS that only served it.
