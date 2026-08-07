import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';

import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import i18next from '@/lib/i18n';

function renderAt(path: string) {
  // Mirrors the real mount point: `SettingsSidebar` is rendered by the `/settings`
  // route itself (like `SettingsLayout` does), with `certificates` as a sibling
  // child route — NOT a `/settings/*` splat, which would make relative `NavLink`
  // resolution use the full matched pathname (including the splat text) as its
  // base and double up the "certificates" segment.
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings" element={<SettingsSidebar />}>
          <Route path="certificates" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsSidebar', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders the Certificates entry with a translated label', () => {
    renderAt('/settings/certificates');
    expect(screen.getByRole('link', { name: 'Certificates' })).toBeInTheDocument();
  });

  it('highlights Certificates as the active item when on that route', () => {
    renderAt('/settings/certificates');
    const link = screen.getByRole('link', { name: 'Certificates' });
    expect(link.className).toMatch(/bg-primary\/15/);
  });

  it('never adds its own vertical scroll container', () => {
    renderAt('/settings/certificates');
    const nav = screen.getByRole('navigation');
    expect(nav.className).not.toMatch(/overflow-y-auto/);
    expect(nav.className).not.toMatch(/h-screen|h-dvh/);
  });
});
