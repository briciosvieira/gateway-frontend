import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

import { AuditLogDetailsDrawer } from '@/components/audit-logs/audit-log-details-drawer';
import type { AuditLog } from '@/features/audit-logs/audit-logs.types';
import i18next from '@/lib/i18n';
import { server } from '@/test/msw/server';

const BASE = 'http://localhost:3110/api/v1';

const AUDIT_LOG: AuditLog = {
  id: 'log-1',
  action: 'UPDATE',
  entity: 'USER',
  entityId: 'user-1',
  previousValue: { passwordHash: 'old-hash', name: 'Ada' },
  newValue: { authorization: 'Bearer token', name: 'Ada Lovelace' },
  sourceIp: '127.0.0.1',
  requestId: 'req-1',
  description: 'User was updated.',
  createdAt: '2026-08-07T12:00:00.000Z',
  user: {
    id: 'user-1',
    name: 'Administrator',
    username: 'admin',
    role: { code: 'ADMIN', name: 'Administrator' },
  },
};

function successBody<T>(data: T) {
  return {
    success: true,
    message: 'Request completed successfully.',
    data,
    requestId: 'req-1',
    timestamp: '2026-08-07T12:00:00.000Z',
  };
}

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('AuditLogDetailsDrawer', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('shows the details and masks sensitive JSON fields defensively', async () => {
    server.use(
      http.get(`${BASE}/audit-logs/log-1`, () => HttpResponse.json(successBody(AUDIT_LOG))),
    );

    render(<AuditLogDetailsDrawer open auditLog={AUDIT_LOG} onOpenChange={() => {}} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByRole('heading', { name: 'Audit log details' })).toBeInTheDocument();
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
    expect(screen.getByText('User was updated.')).toBeInTheDocument();
    expect(screen.queryByText('old-hash')).not.toBeInTheDocument();
    expect(screen.queryByText('Bearer token')).not.toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('"********"') ?? false)
        .length,
    ).toBeGreaterThan(0);
  });
});
