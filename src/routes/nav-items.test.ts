import { Settings } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { NAV_ITEMS } from '@/routes/nav-items';

describe('NAV_ITEMS', () => {
  it('has Configurações as the last item, gated behind settings.read', () => {
    const lastItem = NAV_ITEMS[NAV_ITEMS.length - 1];

    expect(lastItem).toEqual({
      key: 'settings',
      labelKey: 'nav.settings',
      path: '/settings',
      icon: Settings,
      permission: 'settings.read',
    });
  });

  it('does not grant settings.read to any item other than the Configurações entry itself', () => {
    const settingsPermissionCount = NAV_ITEMS.filter(
      (item) => item.permission === 'settings.read',
    ).length;

    expect(settingsPermissionCount).toBe(1);
  });
});
