import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as auditLogsService from '@/features/audit-logs/audit-logs.service';
import { apiClient } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

function envelope<T>(data: T) {
  return {
    data: {
      success: true,
      message: 'Request completed successfully.',
      data,
      requestId: 'req-123',
      timestamp: '2026-08-07T12:00:00.000Z',
    },
  };
}

const sampleAuditLog = {
  id: 'log-1',
  action: 'CREATE' as const,
  entity: 'USER' as const,
  entityId: 'user-1',
  previousValue: null,
  newValue: { name: 'Ada' },
  sourceIp: '127.0.0.1',
  requestId: 'req-1',
  description: 'User was created.',
  createdAt: '2026-08-07T12:00:00.000Z',
  user: {
    id: 'user-1',
    name: 'Administrator',
    username: 'admin',
    role: { code: 'ADMIN' as const, name: 'Administrator' },
  },
};

describe('audit-logs.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it('findAuditLogs calls GET /audit-logs with the given query params and signal', async () => {
    const signal = new AbortController().signal;
    const paginated = {
      items: [sampleAuditLog],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(apiClient.get).mockResolvedValue(envelope(paginated));

    const params = { page: 1, limit: 20, action: 'CREATE' as const };
    const result = await auditLogsService.findAuditLogs(params, signal);

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', { params, signal });
    expect(result).toEqual(paginated);
  });

  it('findAuditLogById calls GET /audit-logs/:id with the AbortSignal', async () => {
    const signal = new AbortController().signal;
    vi.mocked(apiClient.get).mockResolvedValue(envelope(sampleAuditLog));

    const result = await auditLogsService.findAuditLogById('log-1', signal);

    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs/log-1', { signal });
    expect(result).toEqual(sampleAuditLog);
  });
});
