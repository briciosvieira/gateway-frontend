import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { usePermissions } from '@/features/auth/use-permissions';
import { cn } from '@/lib/utils';
import { SETTINGS_NAV_ITEMS } from '@/routes/settings-nav-items';

/**
 * Secondary, in-page navigation for Configurações — NOT the application's
 * main Sidebar. Vertical column on desktop (`md:` and up), horizontal
 * scrollable strip on narrow screens so it never squeezes the content into
 * a tiny column. Never independently scrollable vertically — Main Content
 * remains the app's sole vertical scroll container (see `.ai/UI_RULES.md`).
 * Filters by permission the same way the main Sidebar filters `NAV_ITEMS`
 * — Certificados requires `trustedCas.read` (ADMIN only), so an OPERATOR
 * inside Configurações never sees that entry.
 */
export function SettingsSidebar() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const visibleItems = SETTINGS_NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <nav
      aria-label={t('settings.nav.label')}
      className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-border bg-card p-2 md:w-56 md:flex-col md:overflow-visible md:p-3"
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-surface hover:text-foreground',
                isActive && 'bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary',
              )
            }
          >
            <Icon className="size-4.5 shrink-0" aria-hidden="true" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
