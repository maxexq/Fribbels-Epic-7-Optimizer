import { useEffect } from 'react';
import {
  BookOpen,
  Coffee,
  ExternalLink,
  FolderInput,
  Hammer,
  Info,
  Layers,
  MessagesSquare,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n';
import { openExternal, selectLegacyTab, setDarkMode, useActiveLegacyTab, useIsDark } from '@/lib/legacy';
import { cn } from '@/lib/utils';

interface NavItem {
  tab: string;
  label: string;
  icon: LucideIcon;
}

// `tab` is the legacy radio id in app.html; labels double as i18n keys.
const PRIMARY_NAV: NavItem[] = [
  { tab: 'tab1', label: 'Optimizer', icon: Sparkles },
  { tab: 'tab2', label: 'Multi-Optimizer', icon: Layers },
  { tab: 'tab3', label: 'Gear', icon: Swords },
  { tab: 'tab4', label: 'Heroes', icon: Users },
  { tab: 'tab5', label: 'Enhancing', icon: Hammer },
  { tab: 'tab6', label: 'Importer', icon: FolderInput },
];

const SECONDARY_NAV: NavItem[] = [
  { tab: 'tab7', label: 'Settings', icon: Settings },
  { tab: 'tab8', label: 'Information', icon: Info },
];

const LINKS = [
  { label: 'Hero Library', url: 'https://fribbels.github.io/e7/hero-library.html', icon: BookOpen },
  { label: 'GW Meta', url: 'https://fribbels.github.io/e7/gw-meta.html', icon: Trophy },
  { label: 'Discord', url: 'https://discord.gg/rDmB4Un7qg', icon: MessagesSquare },
  { label: 'Donate', url: 'https://www.buymeacoffee.com/fribbels', icon: Coffee },
];

const ALL_TABS = [...PRIMARY_NAV, ...SECONDARY_NAV];

function useTabShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < ALL_TABS.length) {
        e.preventDefault();
        selectLegacyTab(ALL_TABS[index].tab);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

function shortcutLabel(tab: string) {
  const index = ALL_TABS.findIndex((item) => item.tab === tab);
  const mod = navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl+';
  return `${mod}${index + 1}`;
}

export function AppShell() {
  const t = useT();
  const active = useActiveLegacyTab();
  const dark = useIsDark();
  useTabShortcuts();

  return (
    <header className="ui-scope app-topbar flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
      <div className="flex items-center gap-2.5 pr-2 pl-1">
        <div className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-primary to-primary-hover text-[11px] font-bold tracking-tight text-primary-foreground shadow-sm">
          E7
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight">Gear Optimizer</span>
          <span className="mt-0.5 text-[11px] text-subtle-foreground">Fribbels</span>
        </div>
      </div>

      <Separator orientation="vertical" className="!h-6" />

      <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavButton key={item.tab} item={item} active={active === item.tab} label={t(item.label)} />
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-0.5">
        {SECONDARY_NAV.map((item) => (
          <Tooltip key={item.tab}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t(item.label)}
                aria-current={active === item.tab ? 'page' : undefined}
                onClick={() => selectLegacyTab(item.tab)}
                className={cn(active === item.tab && 'bg-primary-soft text-foreground hover:bg-primary-soft [&_svg]:text-primary')}
              >
                <item.icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t(item.label)} <span className="ml-1 opacity-60">{shortcutLabel(item.tab)}</span>
            </TooltipContent>
          </Tooltip>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ExternalLink />
              Links
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opens in your browser</DropdownMenuLabel>
            {LINKS.map((link) => (
              <DropdownMenuItem key={link.url} onSelect={() => openExternal(link.url)}>
                <link.icon />
                {t(link.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 !h-6" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setDarkMode(!dark)}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

function NavButton({ item, active, label }: { item: NavItem; active: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={() => selectLegacyTab(item.tab)}
      aria-current={active ? 'page' : undefined}
      title={shortcutLabel(item.tab)}
      className={cn(
        'relative flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring [&_svg]:size-4',
        active
          ? 'bg-primary-soft text-foreground [&_svg]:text-primary'
          : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      <item.icon />
      {label}
    </button>
  );
}
