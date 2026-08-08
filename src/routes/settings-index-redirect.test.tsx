import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SettingsIndexRedirect } from '@/routes/settings-index-redirect';

const { hasPermissionMock } = vi.hoisted(() => ({ hasPermissionMock: vi.fn() }));

vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => ({ hasPermission: hasPermissionMock }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings">
          <Route index element={<SettingsIndexRedirect />} />
          <Route path="certificates" element={<div>Certificates page</div>} />
          <Route path="personalization" element={<div>Personalization page</div>} />
          <Route path="users" element={<div>Users page</div>} />
        </Route>
        <Route path="/403" element={<div>Forbidden page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsIndexRedirect', () => {
  it('redirects an ADMIN (every permission granted) to Certificados, the first item', () => {
    hasPermissionMock.mockReturnValue(true);
    renderAt('/settings');
    expect(screen.getByText('Certificates page')).toBeInTheDocument();
  });

  it('redirects an OPERATOR (no trustedCas.read) to Personalização, the first accessible item', () => {
    hasPermissionMock.mockImplementation((permission: string) => permission !== 'trustedCas.read');
    renderAt('/settings');
    expect(screen.getByText('Personalization page')).toBeInTheDocument();
  });

  it('still redirects to Personalização when every gated permission is denied, since it has no permission gate of its own', () => {
    hasPermissionMock.mockReturnValue(false);
    renderAt('/settings');
    expect(screen.getByText('Personalization page')).toBeInTheDocument();
  });
});
