import { Navigate } from 'react-router-dom';

import { usePermissions } from '@/features/auth/use-permissions';
import { SETTINGS_NAV_ITEMS } from '@/routes/settings-nav-items';

/**
 * `/settings` (bare index) redirects to the first subsection the current
 * role can actually reach — Certificados is ADMIN-only, so an OPERATOR
 * landing on `/settings` must not be sent there just to bounce off a 403.
 * Falls back to `/403` in the (currently impossible) case where a role has
 * `settings.read` but no accessible subsection at all.
 */
export function SettingsIndexRedirect() {
  const { hasPermission } = usePermissions();

  const firstAccessibleItem = SETTINGS_NAV_ITEMS.find(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return <Navigate to={firstAccessibleItem ? firstAccessibleItem.path : '/403'} replace />;
}
