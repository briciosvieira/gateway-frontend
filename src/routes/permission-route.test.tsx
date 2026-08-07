import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { PermissionRoute } from '@/routes/permission-route';

const { hasPermissionMock } = vi.hoisted(() => ({ hasPermissionMock: vi.fn() }));

vi.mock('@/features/auth/use-permissions', () => ({
  usePermissions: () => ({ hasPermission: hasPermissionMock }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PermissionRoute permission="requestLogs.read" />}>
          <Route path="/request-logs" element={<div>Request Logs page</div>} />
        </Route>
        <Route path="/403" element={<div>Forbidden page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PermissionRoute', () => {
  it('renders the route when the permission is granted', () => {
    hasPermissionMock.mockReturnValue(true);
    renderAt('/request-logs');
    expect(screen.getByText('Request Logs page')).toBeInTheDocument();
  });

  it('redirects to /403 when the permission is denied', () => {
    hasPermissionMock.mockReturnValue(false);
    renderAt('/request-logs');
    expect(screen.getByText('Forbidden page')).toBeInTheDocument();
    expect(screen.queryByText('Request Logs page')).not.toBeInTheDocument();
  });
});
