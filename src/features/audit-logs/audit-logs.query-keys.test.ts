import { describe, expect, it } from 'vitest';

import { auditLogKeys } from '@/features/audit-logs/audit-logs.query-keys';

describe('auditLogKeys', () => {
  it('builds stable list and detail keys', () => {
    expect(auditLogKeys.list({ page: 1, action: 'CREATE' })).toEqual([
      'audit-logs',
      'list',
      { page: 1, action: 'CREATE' },
    ]);
    expect(auditLogKeys.detail('log-1')).toEqual(['audit-logs', 'detail', 'log-1']);
  });
});
