import { FileKey, Palette, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { SETTINGS_NAV_ITEMS } from '@/routes/settings-nav-items';

describe('SETTINGS_NAV_ITEMS', () => {
  it('contains Certificados, Personalização and Usuários, in that order — no placeholder entries for future sections', () => {
    expect(SETTINGS_NAV_ITEMS).toEqual([
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
    ]);
  });

  it('gates Certificados behind trustedCas.read and Usuários behind users.read, leaving Personalização ungated', () => {
    const byKey = Object.fromEntries(SETTINGS_NAV_ITEMS.map((item) => [item.key, item]));
    expect(byKey.certificates?.permission).toBe('trustedCas.read');
    expect(byKey.personalization?.permission).toBeUndefined();
    expect(byKey.users?.permission).toBe('users.read');
  });
});
