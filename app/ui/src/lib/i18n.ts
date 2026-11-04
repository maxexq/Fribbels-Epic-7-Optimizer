/**
 * Translations come from the app's existing i18next instance (js/lib/i18n),
 * whose keys are the English strings. Missing keys fall back to the English text.
 */
import { useCallback, useSyncExternalStore } from 'react';

const EVENTS = ['initialized', 'languageChanged', 'loaded'];

function subscribe(cb: () => void) {
  const i18n = window.i18next;
  if (!i18n) return () => {};
  EVENTS.forEach((e) => i18n.on(e, cb));
  return () => EVENTS.forEach((e) => i18n.off(e, cb));
}

function snapshot() {
  const i18n = window.i18next;
  return i18n?.isInitialized ? i18n.language : '';
}

export function useT() {
  const language = useSyncExternalStore(subscribe, snapshot);
  return useCallback(
    (key: string) => {
      const i18n = window.i18next;
      // Like the legacy translator, English is the source text (no lookup, so
      // i18next's saveMissing does not record UI strings as missing for "en").
      if (!i18n?.isInitialized || !language || language.startsWith('en')) return key;
      const value = i18n.t(key);
      return value || key;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );
}

export function useLanguage() {
  return useSyncExternalStore(subscribe, snapshot);
}
