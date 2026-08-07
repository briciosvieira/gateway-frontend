import { FileKey, Palette } from 'lucide-react';

import type { NavItem } from '@/types/navigation';

/**
 * Secondary navigation for the Configurações area, rendered by
 * `SettingsSidebar` inside `SettingsLayout`. `path` is relative to
 * `/settings` (used as-is with `NavLink`). Add future sections here
 * (Segurança, Gateway, Retenção, Sistema, ...) — no other wiring is needed
 * since `SettingsLayout` already renders whatever child route matches.
 */
export const SETTINGS_NAV_ITEMS: NavItem[] = [
  {
    key: 'certificates',
    labelKey: 'settings.nav.certificates',
    path: 'certificates',
    icon: FileKey,
  },
  {
    key: 'personalization',
    labelKey: 'settings.nav.personalization',
    path: 'personalization',
    icon: Palette,
  },
];
