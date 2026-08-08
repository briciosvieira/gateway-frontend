import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { SettingsLayout } from '@/layouts/settings-layout';
import i18next from '@/lib/i18n';

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ hasPermission: () => true }),
}));

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

  it('shows a Swagger link, opposite the title/description, opening the real API docs in a new tab', () => {
    renderAt('/settings/certificates');
    const link = screen.getByRole('link', { name: /Swagger/ });
    expect(link).toHaveAttribute('href', 'http://localhost:3110/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('never uses h-screen/h-dvh — its fixed height comes from filling the parent <main>, not the viewport', () => {
    const { container } = renderAt('/settings/certificates');
    expect(container.innerHTML).not.toMatch(/h-screen|h-dvh/);
  });

  it('scopes the vertical scroll container to only the inner content pane — the title, divider and secondary sidebar stay outside it', () => {
    renderAt('/settings/certificates');

    const content = screen.getByText('Certificates page content');
    expect(content.closest('.overflow-y-auto')).not.toBeNull();

    const heading = screen.getByRole('heading', { name: 'Settings' });
    expect(heading.closest('.overflow-y-auto')).toBeNull();

    const certificatesLink = screen.getByRole('link', { name: 'Certificates' });
    expect(certificatesLink.closest('.overflow-y-auto')).toBeNull();
  });
});
