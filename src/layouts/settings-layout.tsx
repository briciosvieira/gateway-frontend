import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { env } from '@/config/env';

/** `VITE_API_URL` includes the `/api/v1` prefix — Swagger is served from the API's origin, not under that prefix. */
const SWAGGER_URL = `${new URL(env.VITE_API_URL).origin}/docs`;

/**
 * Shell for the whole Configurações area: outer title/description, a
 * secondary in-page Sidebar (see `SettingsSidebar`) and the selected
 * setting's content via `<Outlet />`. Renders inside `AdminLayout`'s
 * `<main>` — the app's only vertical scroll container everywhere else in
 * the app — but Settings is a deliberate, documented exception (see
 * `.ai/UI_RULES.md` / `.ai/FRONTEND_ARCHITECTURE.md`): it works as an
 * internal workspace, so the header/description/divider and the secondary
 * Sidebar stay fixed while only the selected subsection's content scrolls.
 * `h-full` fills `<main>`'s already-bounded height (never `h-screen`/
 * `h-dvh`) so `<main>` itself never needs to scroll while Settings is open
 * — there is still only ever one active vertical scrollbar at a time.
 */
export function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
            <p className="text-sm text-muted">{t('settings.description')}</p>
          </div>
          <a
            href={SWAGGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {t('settings.swaggerLink')}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        </div>
        <div role="separator" aria-hidden="true" className="h-px bg-border/70" />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-6">
        <div className="shrink-0 md:border-r md:border-border/60 md:pr-5">
          <SettingsSidebar />
        </div>
        <div className="hide-scrollbar min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
