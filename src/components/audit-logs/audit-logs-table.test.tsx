import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table';
import type { AuditLogListItem } from '@/features/audit-logs/audit-logs.types';
import i18next from '@/lib/i18n';

const rows: AuditLogListItem[] = [
  {
    id: 'log-1',
    action: 'CREATE',
    entity: 'USER',
    entityId: 'user-1',
    previousValue: null,
    newValue: { name: 'Ada' },
    sourceIp: '127.0.0.1',
    requestId: 'req-1',
    description: 'User was created.',
    createdAt: '2026-08-07T12:00:00.000Z',
    user: null,
  },
];

describe('AuditLogsTable', () => {
  beforeAll(async () => {
    await i18next.changeLanguage('en');
  });

  it('renders records without Request ID in the table, handles removed users and exposes only the View action', () => {
    const onView = vi.fn();
    render(<AuditLogsTable rows={rows} onView={onView} />);

    expect(screen.getByText('Removed user')).toBeInTheDocument();
    expect(screen.getByText('User was created.')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getAllByText('User').length).toBeGreaterThan(0);
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.queryByText('Request ID')).not.toBeInTheDocument();
    expect(screen.queryByText('req-1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith(rows[0]);
  });
});
