/**
 * Typed bridge to the legacy (jQuery) renderer modules.
 *
 * The legacy code registers its modules as globals in js/lib/inputHandler.js
 * and runs with Node integration, so everything is reachable from window.
 * Keep all access to legacy globals in this file so the surface stays small
 * and easy to remove as tabs are migrated.
 */
import { useEffect, useState, useSyncExternalStore } from 'react';

export interface SettingsState {
  settingGpu: boolean;
  settingUnlockOnUnequip: boolean;
  settingRageSet: boolean;
  settingPenSet: boolean;
  settingMaxResults: number;
  settingMaxRamGb: number;
  settingPenDefense: number;
  settingLocatorWidth: number;
  settingDefaultPath: string;
  settingDarkMode: boolean;
  settingDefaultUseReforgedStats: boolean;
  settingDefaultUseHeroPriority: boolean;
  settingDefaultUseSubstatMods: boolean;
  settingDefaultLockedItems: boolean;
  settingDefaultEquippedItems: boolean;
  settingDefaultKeepCurrent: boolean;
  /** null = built-in theme color */
  settingBackgroundColor: string | null;
  settingTextColorPicker: string | null;
  settingAccentColorPicker: string | null;
  settingInputColorPicker: string | null;
  settingGridTextColorPicker: string | null;
  settingRedColorPicker: string;
  settingNeutralColorPicker: string;
  settingGreenColorPicker: string;
}

interface LegacySettings {
  isLoaded(): boolean;
  getState(): SettingsState;
  subscribe(listener: (state: SettingsState) => void): () => void;
  update(partial: Partial<SettingsState>, options?: { persist?: boolean }): void;
  selectSavesFolder(): Promise<string | undefined>;
  getDefaultSettings(): SettingsState;
}

interface LegacyDarkMode {
  isDark(): boolean;
  setDark(dark: boolean): void;
}

interface I18next {
  isInitialized: boolean;
  language: string;
  t(key: string): string;
  on(events: string, cb: () => void): void;
  off(events: string, cb: () => void): void;
}

declare global {
  interface Window {
    Settings?: LegacySettings;
    DarkMode?: LegacyDarkMode;
    E7_READY?: boolean;
    i18next?: I18next;
    require?: NodeRequire;
  }
  // eslint-disable-next-line no-var
  var require: NodeRequire | undefined;
}

type NodeRequire = (id: string) => any;

const nodeRequire: NodeRequire | undefined =
  typeof window !== 'undefined' ? (window.require ?? globalThis.require) : undefined;

/** Open a URL in the user's browser (not inside the app window). */
export function openExternal(url: string) {
  try {
    nodeRequire?.('electron').shell.openExternal(url);
  } catch {
    window.open(url, '_blank');
  }
}

export function getAppVersion(): string | undefined {
  try {
    return nodeRequire?.('@electron/remote').app.getVersion();
  } catch {
    return undefined;
  }
}

/** True once inputHandler.js has initialized every legacy module. */
export function useLegacyReady() {
  const [ready, setReady] = useState(() => !!window.E7_READY);
  useEffect(() => {
    if (ready) return;
    const onReady = () => setReady(true);
    window.addEventListener('e7:ready', onReady);
    if (window.E7_READY) setReady(true);
    return () => window.removeEventListener('e7:ready', onReady);
  }, [ready]);
  return ready;
}

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

function subscribeTheme(cb: () => void) {
  window.addEventListener('e7:theme', cb);
  return () => window.removeEventListener('e7:theme', cb);
}

export function useIsDark() {
  return useSyncExternalStore(subscribeTheme, () => document.documentElement.classList.contains('dark'));
}

export function setDarkMode(dark: boolean) {
  const settings = window.Settings;
  if (settings?.isLoaded()) {
    settings.update({ settingDarkMode: dark });
  } else {
    window.DarkMode?.setDark(dark);
  }
}

/* ------------------------------------------------------------------ */
/* Settings store                                                      */
/* ------------------------------------------------------------------ */

function subscribeSettings(cb: () => void) {
  // `e7:settings` fires once settings.ini is loaded; after that the store
  // notifies on every change. window.Settings may not exist yet when React
  // mounts, so look it up lazily.
  let unsubscribeStore: (() => void) | undefined;
  const attach = () => {
    if (!unsubscribeStore && window.Settings) unsubscribeStore = window.Settings.subscribe(cb);
  };
  const onLoaded = () => {
    attach();
    cb();
  };
  attach();
  window.addEventListener('e7:settings', onLoaded);
  return () => {
    window.removeEventListener('e7:settings', onLoaded);
    unsubscribeStore?.();
  };
}

function getSettingsSnapshot() {
  const settings = window.Settings;
  return settings?.isLoaded() ? settings.getState() : null;
}

export function useSettings(): SettingsState | null {
  return useSyncExternalStore(subscribeSettings, getSettingsSnapshot);
}

export function updateSettings(partial: Partial<SettingsState>, options?: { persist?: boolean }) {
  window.Settings?.update(partial, options);
}

export function selectSavesFolder() {
  return window.Settings?.selectSavesFolder();
}

/* ------------------------------------------------------------------ */
/* Legacy tabs                                                         */
/* ------------------------------------------------------------------ */

/**
 * Activate a legacy tab. Clicks its <label> because several legacy modules
 * listen for label clicks to refresh their grids.
 */
export function selectLegacyTab(tabId: string) {
  const label = document.querySelector<HTMLLabelElement>(`label[for="${tabId}"]`);
  if (label) label.click();
  else document.getElementById(tabId)?.click();
}

function subscribeTabs(cb: () => void) {
  // Radio "change" covers user clicks and legacy code calling $('#tabN').click().
  document.addEventListener('change', cb, true);
  document.addEventListener('click', cb, true);
  return () => {
    document.removeEventListener('change', cb, true);
    document.removeEventListener('click', cb, true);
  };
}

function getActiveTab() {
  return document.querySelector<HTMLInputElement>('.tabset > input[name="tabset"]:checked')?.id ?? 'tab1';
}

export function useActiveLegacyTab() {
  return useSyncExternalStore(subscribeTabs, getActiveTab);
}
