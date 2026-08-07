import { FileKey } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { SETTINGS_NAV_ITEMS } from '@/routes/settings-nav-items';

describe('SETTINGS_NAV_ITEMS', () => {
  it('contains only Certificados for now — no placeholder entries for future sections', () => {
    expect(SETTINGS_NAV_ITEMS).toEqual([
      {
        key: 'certificates',
        labelKey: 'settings.nav.certificates',
        path: 'certificates',
        icon: FileKey,
      },
    ]);
  });
});
