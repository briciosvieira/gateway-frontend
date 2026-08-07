import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';

import { SettingsLayout } from '@/layouts/settings-layout';
import i18next from '@/lib/i18n';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="/settings/certificates" replace />} />
          <Route path="certificates" element={<div>Certificates page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('SettingsLayout', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('redirects the bare /settings index route to /settings/certificates', () => {
    renderAt('/settings');
    expect(screen.getByText('Certificates page content')).toBeInTheDocument();
  });

  it('renders the outer Configurações title alongside the secondary sidebar and the selected page content', () => {
    renderAt('/settings/certificates');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Certificates' })).toBeInTheDocument();
    expect(screen.getByText('Certificates page content')).toBeInTheDocument();
  });

  it('never adds its own vertical scroll container around the sidebar+content region', () => {
    const { container } = renderAt('/settings/certificates');
    expect(container.innerHTML).not.toMatch(/overflow-y-auto/);
    expect(container.innerHTML).not.toMatch(/h-screen|h-dvh/);
  });
});
