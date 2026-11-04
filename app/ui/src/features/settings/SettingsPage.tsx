import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FolderOpen, Moon, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useLanguage, useT } from '@/lib/i18n';
import {
  selectSavesFolder,
  setDarkMode,
  updateSettings,
  useIsDark,
  useSettings,
  type SettingsState,
} from '@/lib/legacy';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ru', label: 'Русский язык' },
];

type BooleanKey = {
  [K in keyof SettingsState]: SettingsState[K] extends boolean ? K : never;
}[keyof SettingsState];
type NumberKey = {
  [K in keyof SettingsState]: SettingsState[K] extends number ? K : never;
}[keyof SettingsState];

/**
 * The legacy strings (also the i18n keys) put the hint in parentheses, e.g.
 * "Maximum RAM capacity GB - Restart after changing (Recommended: 6)".
 * Show the part before it as the title and the rest as a muted hint.
 */
function splitHint(text: string, separator: 'paren' | 'colon' = 'paren'): [string, string | null] {
  const match =
    separator === 'colon' ? text.match(/^(.*?)[:：]\s*(.+)$/s) : text.match(/^(.*?)\s*[(（](.+)[)）]\s*$/s);
  return match ? [match[1].trim(), match[2].trim()] : [text, null];
}

export function SettingsPage() {
  const t = useT();
  const settings = useSettings();

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5 px-6 pt-6 pb-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('Settings')}</h1>
        <p className="text-sm text-muted-foreground">
          Changes are saved automatically to <span className="font-mono text-[12px]">settings.ini</span> in your saves
          folder.
        </p>
      </div>

      {!settings ? <SettingsLoading /> : <SettingsForm settings={settings} />}
    </div>
  );
}

function SettingsForm({ settings }: { settings: SettingsState }) {
  const t = useT();
  const set = (partial: Partial<SettingsState>) => updateSettings(partial);

  const toggle = (key: BooleanKey, text: string, split: 'paren' | 'colon' = 'paren') => {
    const [title, hint] = splitHint(t(text), split);
    return (
      <SettingRow title={title} hint={hint} key={key}>
        {(id) => <Switch id={id} checked={settings[key]} onCheckedChange={(checked) => set({ [key]: checked })} />}
      </SettingRow>
    );
  };

  const number = (key: NumberKey, text: string, opts: { min: number; max: number; suffix?: string; split?: 'paren' | 'colon' }) => {
    const [title, hint] = splitHint(t(text), opts.split);
    return (
      <SettingRow title={title} hint={hint} key={key}>
        {(id) => (
          <NumberField
            id={id}
            value={settings[key]}
            min={opts.min}
            max={opts.max}
            suffix={opts.suffix}
            onCommit={(value) => set({ [key]: value })}
          />
        )}
      </SettingRow>
    );
  };

  return (
    <>
      <AppearanceCard settings={settings} />

      <Card>
        <CardHeader>
          <CardTitle>Optimization</CardTitle>
          <CardDescription>How the optimizer searches and scores builds.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {toggle('settingGpu', 'GPU accelerated optimization (Disable this option if you notice errors or decreased performance)')}
          {number('settingMaxResults', 'Maximum optimization results (Recommended: 5,000,000, Min 10k, Max 100m)', {
            min: 10_000,
            max: 100_000_000,
          })}
          {number('settingMaxRamGb', 'Maximum RAM capacity GB - Restart after changing (Recommended: 6)', {
            min: 1,
            max: 256,
            suffix: 'GB',
          })}
          {toggle('settingRageSet', 'Use rage set bonus for damage optimization')}
          {toggle('settingPenSet', 'Use penetration set bonus for damage optimization')}
          {number('settingPenDefense', "Target's defense for penetration set (Recommended: 1,500, Min 0, Max 10k)", {
            min: 0,
            max: 10_000,
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gear &amp; files</CardTitle>
          <CardDescription>Equipment handling and where your data is stored.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {toggle('settingUnlockOnUnequip', 'Automatically unlock equipment after unequipping')}
          {number(
            'settingLocatorWidth',
            'Locator width setting: # of columns per row on the Manage Equipment page for equipping heroes. Rescan items to update locator',
            { min: 1, max: 20, split: 'colon' },
          )}
          <SettingRow title={t('Change saves folder')} hint={settings.settingDefaultPath} hintClassName="font-mono text-[12px] break-all">
            {() => (
              <Button variant="secondary" size="sm" onClick={() => selectSavesFolder()}>
                <FolderOpen />
                {t('Change saves folder')}
              </Button>
            )}
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Default settings for newly added heroes')}</CardTitle>
          <CardDescription>Applied to the optimizer options when a hero is added.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {(
            [
              ['settingDefaultUseReforgedStats', 'Use reforged stats'],
              ['settingDefaultUseHeroPriority', 'Use hero priority'],
              ['settingDefaultUseSubstatMods', 'Use substat mods'],
              ['settingDefaultLockedItems', 'Locked items'],
              ['settingDefaultEquippedItems', 'Equipped items'],
              ['settingDefaultKeepCurrent', 'Keep current'],
            ] as [BooleanKey, string][]
          ).map(([key, text]) => (
            <CompactToggle key={key} label={t(text)} checked={settings[key]} onChange={(checked) => set({ [key]: checked })} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

function AppearanceCard({ settings }: { settings: SettingsState }) {
  const t = useT();
  const dark = useIsDark();
  const language = useLanguage();
  const currentLanguage = LANGUAGES.find((l) => language === l.code)?.code ?? (language?.split('-')[0] || 'en');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Theme, language and custom colors.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <SettingRow title="Theme">
          {() => (
            <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-md border border-border bg-surface-2 p-0.5">
              {[
                { value: false, label: 'Light', icon: Sun },
                { value: true, label: 'Dark', icon: Moon },
              ].map((option) => (
                <button
                  key={option.label}
                  role="radio"
                  aria-checked={dark === option.value}
                  onClick={() => setDarkMode(option.value)}
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium transition-colors [&_svg]:size-3.5',
                    dark === option.value
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <option.icon />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </SettingRow>

        <SettingRow title={t('Languages')} hint="Reloads the app.">
          {(id) => (
            <Select
              value={currentLanguage}
              onValueChange={(code) => {
                if (code !== currentLanguage) location.href = `app.html?lng=${encodeURIComponent(code)}`;
              }}
            >
              <SelectTrigger id={id} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </SettingRow>

        <div className="py-4">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <div>
              <div className="text-sm font-medium">{t('Custom Dark Mode Colors')}</div>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {dark ? 'Applied while dark mode is on.' : 'Switch to dark mode to preview these colors.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            <ColorGroup title={t('General')}>
              <ColorSetting settingKey="settingBackgroundColor" label={t('Background color')} cssVar="--background" settings={settings} />
              <ColorSetting settingKey="settingTextColorPicker" label={t('Text color')} cssVar="--foreground" settings={settings} />
              <ColorSetting settingKey="settingAccentColorPicker" label={t('Accent color')} cssVar="--primary" settings={settings} />
              <ColorSetting settingKey="settingInputColorPicker" label={t('Textbox/Button color')} cssVar="--field" settings={settings} />
            </ColorGroup>
            <ColorGroup title={t('Grid')}>
              <ColorSetting settingKey="settingGridTextColorPicker" label={t('Text color')} cssVar="--grid-foreground" settings={settings} />
              <ColorSetting settingKey="settingRedColorPicker" label={t('Red color')} settings={settings} />
              <ColorSetting settingKey="settingNeutralColorPicker" label={t('Neutral color')} settings={settings} />
              <ColorSetting settingKey="settingGreenColorPicker" label={t('Green color')} settings={settings} />
            </ColorGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function SettingRow({
  title,
  hint,
  hintClassName,
  children,
}: {
  title: ReactNode;
  hint?: ReactNode;
  hintClassName?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 first:pt-1 last:pb-1">
      <div className="min-w-0">
        <Label htmlFor={id} className="block">
          {title}
        </Label>
        {hint && <p className={cn('mt-0.5 text-[13px] text-muted-foreground', hintClassName)}>{hint}</p>}
      </div>
      <div className="shrink-0">{children(id)}</div>
    </div>
  );
}

function CompactToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toLocaleString('en-US') : '');

function NumberField({
  id,
  value,
  min,
  max,
  suffix,
  onCommit,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(formatNumber(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(formatNumber(value));
  }, [value, focused]);

  const parsed = parseInt(draft.replace(/[^\d]/g, ''), 10);
  const invalid = draft !== '' && (!Number.isFinite(parsed) || parsed < min || parsed > max);

  const commit = () => {
    setFocused(false);
    if (!Number.isFinite(parsed)) {
      setDraft(formatNumber(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(formatNumber(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="numeric"
        value={draft}
        aria-invalid={invalid || undefined}
        title={`${formatNumber(min)} – ${formatNumber(max)}`}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '');
          setDraft(digits === '' ? '' : formatNumber(parseInt(digits, 10)));
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setDraft(formatNumber(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn('w-36 text-right tabular-nums', suffix && 'pr-10')}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-subtle-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

function ColorGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="pb-1 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">{title}</div>
      {children}
    </div>
  );
}

// Built-in dark theme values (css/tokens.css), shown when a color is not customized.
const THEME_DEFAULTS: Record<string, string> = {
  '--background': '#0f1117',
  '--foreground': '#e6e8ee',
  '--primary': '#f2b544',
  '--field': '#1b1f29',
  '--grid-foreground': '#e6e8ee',
};

function ColorSetting({
  settingKey,
  label,
  cssVar,
  settings,
}: {
  settingKey: keyof SettingsState;
  label: string;
  cssVar?: string;
  settings: SettingsState;
}) {
  const t = useT();
  const id = useId();
  const stored = settings[settingKey] as string | null;
  const defaults = window.Settings?.getDefaultSettings();
  const defaultValue = cssVar ? THEME_DEFAULTS[cssVar] : (defaults?.[settingKey] as string);
  const value = stored ?? defaultValue;
  const customized = cssVar ? stored !== null : stored?.toLowerCase() !== defaultValue?.toLowerCase();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const commit = () => updateSettings({ [settingKey]: input.value });
    input.addEventListener('change', commit);
    return () => input.removeEventListener('change', commit);
  }, [settingKey]);

  return (
    <div className="group flex h-10 items-center gap-3">
      <label
        htmlFor={id}
        className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border-strong shadow-sm"
        style={{ background: value }}
      >
        <input
          id={id}
          type="color"
          value={value}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          ref={inputRef}
          // React's onChange fires on every native `input` event (while dragging),
          // so it only previews; the native `change` listener below persists.
          onChange={(e) => updateSettings({ [settingKey]: e.target.value }, { persist: false })}
        />
      </label>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-sm">
        {label}
      </label>
      <span className="font-mono text-[12px] text-subtle-foreground uppercase">{value}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${label} ${t('(reset)')}`}
        title={t('(reset)')}
        disabled={!customized}
        className="size-7 disabled:opacity-0"
        onClick={() => updateSettings({ [settingKey]: cssVar ? null : defaultValue })}
      >
        <RotateCcw className="size-3.5" />
      </Button>
    </div>
  );
}

/** Settings load after the Java backend starts; explain a long wait. */
function SettingsLoading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 15_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      {slow && (
        <div role="status" className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-[13px] text-muted-foreground">
          Still waiting for the optimizer backend to start. Settings load once it is running — if this does not finish,
          check that 64-bit Java is installed and restart the app.
        </div>
      )}
      <SettingsSkeleton />
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading settings">
      {[3, 5, 3].map((rows, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-5 h-4 w-40 animate-pulse rounded bg-surface-2" />
          {Array.from({ length: rows }).map((_, j) => (
            <div key={j}>
              {j > 0 && <Separator className="my-3.5" />}
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-72 animate-pulse rounded bg-surface-2" />
                <div className="h-5 w-9 animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
