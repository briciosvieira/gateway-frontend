import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { SettingsSidebar } from '@/components/settings/settings-sidebar';

/**
 * Shell for the whole Configurações area: outer title/description, a
 * secondary in-page Sidebar (see `SettingsSidebar`) and the selected
 * setting's content via `<Outlet />`. Renders inside `AdminLayout`'s
 * `<main>` — the app's only vertical scroll container — so this layout
 * must never add its own `h-screen`/`h-dvh`/`overflow-y-auto`.
 */
export function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-sm text-muted">{t('settings.description')}</p>
        <div role="separator" aria-hidden="true" className="h-px bg-border/70" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="shrink-0 md:border-r md:border-border/60 md:pr-5">
          <SettingsSidebar />
        </div>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
