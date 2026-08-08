import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import i18next from '@/lib/i18n';

let grantedPermissions: string[] = ['trustedCas.read', 'users.read'];
vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({
    permissions: grantedPermissions,
    hasPermission: (permission: string) => grantedPermissions.includes(permission),
  }),
}));

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
          <Route path="personalization" element={<div />} />
          <Route path="users" element={<div />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsSidebar', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  beforeEach(() => {
    grantedPermissions = ['trustedCas.read', 'users.read'];
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

  it('renders Certificates, Personalization and Users in that order when every permission is granted', () => {
    renderAt('/settings/certificates');
    const links = screen.getAllByRole('link').map((link) => link.textContent);
    expect(links).toEqual(['Certificates', 'Personalization', 'Users']);
  });

  it('highlights Personalization as the active item when on that route', () => {
    renderAt('/settings/personalization');
    const link = screen.getByRole('link', { name: 'Personalization' });
    expect(link.className).toMatch(/bg-primary\/15/);
    expect(screen.getByRole('link', { name: 'Certificates' }).className).not.toMatch(
      /bg-primary\/15/,
    );
  });

  it('never adds its own vertical scroll container', () => {
    renderAt('/settings/certificates');
    const nav = screen.getByRole('navigation');
    expect(nav.className).not.toMatch(/overflow-y-auto/);
    expect(nav.className).not.toMatch(/h-screen|h-dvh/);
  });

  it('hides Certificates but keeps Personalization and Users for an OPERATOR-like permission set (no trustedCas.read)', () => {
    grantedPermissions = ['users.read'];
    renderAt('/settings/personalization');
    const links = screen.getAllByRole('link').map((link) => link.textContent);
    expect(links).toEqual(['Personalization', 'Users']);
  });

  it('always shows Personalization since it has no permission gate', () => {
    grantedPermissions = [];
    renderAt('/settings/personalization');
    expect(screen.getByRole('link', { name: 'Personalization' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Certificates' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });
});
