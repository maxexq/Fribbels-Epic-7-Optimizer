import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  Download,
  Filter,
  Hammer,
  ListOrdered,
  MessagesSquare,
  Moon,
  RefreshCcw,
  Search,
  Sparkles,
  Sun,
  Upload,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import guide from 'virtual:guide';

const LINKS = {
  releases: 'https://github.com/fribbels/Fribbels-Epic-7-Optimizer/releases/latest',
  discord: 'https://discord.gg/rDmB4Un7qg',
  source: 'https://github.com/maxexq/Fribbels-Epic-7-Optimizer',
  video: 'https://www.youtube.com/watch?v=bDjP5eiOfK0',
};

export function App() {
  return (
    <>
      <a
        href="#guide"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to the guide
      </a>
      <Header />
      <main>
        <Hero />
        <Screens />
        <Features />
        <Guide />
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('e7-site-theme', dark ? 'dark' : 'light');
    } catch {
      /* private mode */
    }
  }, [dark]);
  return [dark, setDark] as const;
}

function Brand() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="Fribbels E7 Gear Optimizer, back to top">
      <span className="grid size-8 place-items-center rounded-[7px] bg-gradient-to-br from-[#f6c766] to-[#c98a1c] font-display text-[14px] font-bold text-[#1c1406]">
        E7
      </span>
      <span className="font-display text-[17px] leading-none font-semibold tracking-[0.01em]">Gear Optimizer</span>
    </a>
  );
}

function Header() {
  const [dark, setDark] = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
        <Brand />
        <nav aria-label="Site" className="ml-auto flex items-center gap-1 text-[14px] text-muted-foreground">
          <a href="#guide" className="hidden rounded-md px-3 py-2 hover:text-foreground sm:block">
            Guide
          </a>
          <a href={LINKS.discord} className="hidden rounded-md px-3 py-2 hover:text-foreground sm:block">
            Discord
          </a>
          <a
            href={LINKS.source}
            className="grid size-9 place-items-center rounded-md hover:bg-surface-hover hover:text-foreground"
            aria-label="Source code on GitHub"
          >
            <GithubIcon className="size-[18px]" />
          </a>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="grid size-9 place-items-center rounded-md hover:bg-surface-hover hover:text-foreground"
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <a
            href={LINKS.releases}
            className="ml-2 hidden h-9 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground hover:bg-primary-hover md:flex"
          >
            <Download className="size-4" />
            Download
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 pt-16 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:pt-24 lg:pb-28">
        <div>
          <h1 className="font-display text-[44px] leading-[1.02] font-bold tracking-[-0.005em] text-balance sm:text-[58px]">
            Find the best gear for every hero.
          </h1>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-muted-foreground">
            Import your Epic Seven inventory, set the stats a hero needs, and the optimizer searches every combination
            of your gear for the builds that hit them. Free, for Windows and macOS.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={LINKS.releases}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-medium text-primary-foreground shadow-sm hover:bg-primary-hover"
            >
              <Download className="size-[18px]" />
              Download the latest release
            </a>
            <a
              href="#getting-started"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border-strong px-5 font-medium hover:bg-surface-hover"
            >
              <BookOpen className="size-[18px]" />
              Setup guide
            </a>
          </div>
          <p className="mt-6 text-[13px] text-subtle-foreground">
            Needs 64-bit Java 8 or later. Windows 10+ or macOS 12+.{' '}
            <a href={LINKS.video} className="underline underline-offset-2 hover:text-foreground">
              Watch the install video
            </a>
            .
          </p>
        </div>

        <div className="relative">
          <figure className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-lg)]">
            <img
              src="/screenshots/optimizer-dark.jpg"
              alt="The optimizer tab with stat filters, substat priorities and the results table"
              width={1440}
              height={873}
              className="block w-full"
            />
          </figure>
          <GearItem className="relative z-10 mx-auto -mt-14 w-[280px] sm:absolute sm:-bottom-10 sm:-left-8 sm:mx-0 sm:mt-0 sm:w-[300px]" />
        </div>
      </div>
    </section>
  );
}

const SUBSTATS = [
  { name: 'Crit Chance', value: '14%', rolls: 3 },
  { name: 'Crit Damage', value: '21%', rolls: 3 },
  { name: 'Attack', value: '13%', rolls: 2 },
  { name: 'Effect Resistance', value: '5%', rolls: 1 },
];

/** The signature element: an Epic Seven gear item, the thing the app is all about. */
function GearItem({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-white/10 bg-[#141821] text-[#e9ecf2] shadow-[0_24px_60px_rgb(0_0_0/0.45)] ${className}`}
      role="img"
      aria-label="Example gear: Epic speed boots plus 15, crit chance 14%, crit damage 21%, attack 13%, effect resistance 5%, gear score 64"
    >
      <div className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-r from-rarity-epic/25 to-transparent px-4 py-3">
        <div className="grid size-11 place-items-center rounded-md border border-rarity-epic/70 bg-[#1d1215]">
          <BootIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[15px] leading-tight font-semibold">Epic Boots</div>
          <div className="text-[12px] text-[#a9b0bf]">Speed Set</div>
        </div>
        <div className="font-display text-[22px] font-bold text-[#f2b544]">+15</div>
      </div>
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-[#a9b0bf]">Speed</span>
          <span className="font-display text-[26px] leading-none font-bold">45</span>
        </div>
      </div>
      <ul className="px-4 pt-2 pb-3">
        {SUBSTATS.map((s) => (
          <li key={s.name} className="flex items-center gap-2 py-[5px] text-[13.5px]">
            <span className="flex-1">{s.name}</span>
            <span className="flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={`h-[5px] w-[9px] rounded-full ${i < s.rolls ? 'bg-[#f2b544]' : 'bg-white/12'}`} />
              ))}
            </span>
            <span className="w-11 text-right font-display text-[15px] font-semibold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-white/8 bg-white/[0.03] px-4 py-2.5">
        <span className="text-[12.5px] text-[#a9b0bf]">Gear score</span>
        <span className="font-display text-[19px] font-bold text-[#f2b544] tabular-nums">64</span>
      </div>
    </div>
  );
}

/** GitHub mark (lucide no longer ships brand icons). */
function GithubIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function BootIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="#f0d9a8" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M7 3h6v8l5 2.5c1.6.8 2.5 2 2.5 3.5V19H4v-3l3-2z" />
      <path d="M4 19v2h16.5v-2M9.5 6.5h3M9.5 9h3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const SCREENS = [
  { id: 'optimizer', label: 'Optimizer', src: '/screenshots/optimizer-light.jpg', alt: 'Optimizer tab, light theme' },
  { id: 'heroes', label: 'Heroes', src: '/screenshots/heroes-dark.jpg', alt: 'Heroes tab with hero stats, dark theme' },
  { id: 'gear', label: 'Gear', src: '/screenshots/gear-light.jpg', alt: 'Gear tab with filters, light theme' },
  { id: 'settings', label: 'Settings', src: '/screenshots/settings-dark.jpg', alt: 'Settings, dark theme' },
];

function Screens() {
  const [active, setActive] = useState(SCREENS[0].id);
  const screen = SCREENS.find((s) => s.id === active)!;
  return (
    <section aria-labelledby="screens-title" className="border-b border-border bg-surface/60">
      <div className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="screens-title" className="font-display text-[32px] leading-tight font-bold">
              Everything for gearing, in one place
            </h2>
            <p className="mt-2 max-w-[38rem] text-muted-foreground">
              Manage your gear and heroes, compare builds, and switch between light and dark themes.
            </p>
          </div>
          <div role="tablist" aria-label="Screenshots" className="flex rounded-lg border border-border bg-surface p-1">
            {SCREENS.map((s) => (
              <button
                key={s.id}
                role="tab"
                id={`screen-tab-${s.id}`}
                aria-selected={s.id === active}
                aria-controls="screen-panel"
                onClick={() => setActive(s.id)}
                className={`h-9 rounded-md px-4 text-[14px] font-medium transition-colors ${
                  s.id === active ? 'bg-primary-soft text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div
          id="screen-panel"
          role="tabpanel"
          aria-labelledby={`screen-tab-${screen.id}`}
          className="mt-8 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-lg)]"
        >
          <img key={screen.src} src={screen.src} alt={screen.alt} width={1440} height={873} loading="lazy" className="block w-full" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Upload, title: 'Import from the game', text: 'Pull your gear and heroes in automatically instead of typing them in.' },
  { icon: Filter, title: 'Filter what goes in', text: 'Limit the search by main stats, substats, sets, enhance level and more.' },
  { icon: Wand2, title: 'Build to exact targets', text: 'Set minimum and maximum stats and get only the builds that hit them.' },
  { icon: ListOrdered, title: 'Sort and compare results', text: 'Color-coded results make it easy to see which build is strongest where.' },
  { icon: Sparkles, title: 'Bonus stats included', text: 'Imprints, artifacts and exclusive equipment count toward every build.' },
  { icon: BarChart3, title: 'Gear score for every piece', text: 'See how efficient each item’s substats are before you enhance or sell it.' },
  { icon: Hammer, title: 'Reforge prediction', text: 'Preview level 85 gear at 90 and edit reforged stats.' },
  { icon: RefreshCcw, title: 'Substat modification', text: 'Let the optimizer try modification gems on the substats that matter.' },
];

function Features() {
  return (
    <section aria-labelledby="features-title" className="border-b border-border">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <h2 id="features-title" className="font-display text-[32px] leading-tight font-bold">
            What it does
          </h2>
          <p className="mt-3 max-w-[22rem] text-muted-foreground">
            Gearing a unit by hand means checking hundreds of items. The optimizer does the searching so you can decide.
          </p>
        </div>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex gap-4 border-t border-border py-5">
              <f.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-1 text-[14.5px] leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Guide() {
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headings = guide.headings.filter((h) => h.depth <= 3);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return headings;
    return headings.filter((h) => h.text.toLowerCase().includes(q));
  }, [query, headings]);

  // Highlight the section being read.
  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  // The guide is rendered by React, so a deep link (e.g. /#getting-started)
  // arrives before its target exists: scroll to it once mounted.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);

  // "/" focuses the section filter, like most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !/input|textarea/i.test(target.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toc = (
    <ul className="space-y-0.5 text-[14px]">
      {filtered.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            aria-current={current === h.id ? 'location' : undefined}
            className={`block rounded-md py-1.5 pr-2 leading-snug transition-colors ${h.depth === 3 ? 'pl-6' : 'pl-3 font-medium'} ${
              current === h.id
                ? 'bg-primary-soft text-foreground'
                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {h.text}
          </a>
        </li>
      ))}
      {filtered.length === 0 && <li className="px-3 py-2 text-subtle-foreground">No sections match “{query}”.</li>}
    </ul>
  );

  return (
    <section id="guide" aria-labelledby="guide-title" className="mx-auto max-w-[1200px] px-5 py-20">
      <h2 id="guide-title" className="font-display text-[32px] leading-tight font-bold">
        User guide
      </h2>
      <p className="mt-2 max-w-[40rem] text-muted-foreground">
        Installing, importing your gear, and how every filter works. New here? Start with{' '}
        <a href="#getting-started" className="text-link underline underline-offset-2">
          Getting Started
        </a>
        .
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-6">
          <label className="relative block">
            <span className="sr-only">Filter sections</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter sections"
              className="h-10 w-full rounded-md border border-border-strong bg-surface pr-9 pl-9 text-[14px] outline-none placeholder:text-subtle-foreground focus:border-primary focus:ring-[3px] focus:ring-ring"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border px-1.5 text-[11px] text-subtle-foreground">
              /
            </kbd>
          </label>
          <details className="mt-3 lg:hidden" open={!!query}>
            <summary className="cursor-pointer rounded-md px-3 py-2 text-[14px] font-medium hover:bg-surface-hover">
              On this page
            </summary>
            <nav aria-label="Guide sections" className="mt-1">
              {toc}
            </nav>
          </details>
          <nav aria-label="Guide sections" className="mt-4 hidden lg:block">
            {toc}
          </nav>
        </aside>

        <article className="guide min-w-0" dangerouslySetInnerHTML={{ __html: guide.html }} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 text-[14px] text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="max-w-[36rem]">
          <Brand />
          <p className="mt-3">
            A free, open-source fan project by Fribbels and contributors. Not affiliated with Smilegate or Super
            Creative.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a href={LINKS.releases} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <ArrowDownToLine className="size-4" /> Releases
            </a>
          </li>
          <li>
            <a href={LINKS.discord} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <MessagesSquare className="size-4" /> Discord
            </a>
          </li>
          <li>
            <a href={LINKS.source} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <GithubIcon className="size-4" /> Source
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
