import { FileKey, Palette, Users } from 'lucide-react';

import type { NavItem } from '@/types/navigation';

/**
 * Secondary navigation for the Configurações area, rendered by
 * `SettingsSidebar` inside `SettingsLayout`. `path` is relative to
 * `/settings` (used as-is with `NavLink`). Add future sections here
 * (Segurança, Gateway, Retenção, Sistema, ...) — no other wiring is needed
 * since `SettingsLayout` already renders whatever child route matches.
 *
 * Unlike the main `NAV_ITEMS`, subsections here don't all share the same
 * access level — `permission` (checked the same way as `NAV_ITEMS`, via
 * `SettingsSidebar`/`SettingsIndexRedirect`) is what keeps Certificados
 * ADMIN-only while Personalização/Usuários are visible to OPERATOR too.
 * Items with no `permission` are visible to anyone who reached
 * `/settings/*` at all (gated once, at the outer `settings.read` level).
 */
export const SETTINGS_NAV_ITEMS: NavItem[] = [
  {
    key: 'certificates',
    labelKey: 'settings.nav.certificates',
    path: 'certificates',
    icon: FileKey,
    permission: 'trustedCas.read',
  },
  {
    key: 'personalization',
    labelKey: 'settings.nav.personalization',
    path: 'personalization',
    icon: Palette,
  },
  {
    key: 'users',
    labelKey: 'settings.nav.users',
    path: 'users',
    icon: Users,
    permission: 'users.read',
  },
];
