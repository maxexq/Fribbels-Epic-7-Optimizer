/**
 * React UI layer.
 *
 * Mounted into the legacy app.html next to the jQuery tabs (see app/ui-loader.js).
 * Each migrated area gets its own mount point; un-migrated tabs keep running
 * the legacy code. Shared state goes through the legacy modules (lib/legacy.ts).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/shell/AppShell';
import { SettingsPage } from '@/features/settings/SettingsPage';
import './styles/app.css';

function mount(id: string, node: React.ReactNode) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[ui] mount point #${id} not found`);
    return;
  }
  el.classList.add('ui-scope');
  createRoot(el).render(
    <StrictMode>
      <TooltipProvider>{node}</TooltipProvider>
    </StrictMode>,
  );
}

mount('ui-root', <AppShell />);
mount('settings-root', <SettingsPage />);

document.documentElement.classList.add('has-app-shell');
