import { describe, expect, it } from 'vitest';

import { formatAuditJson, sanitizeAuditJson } from '@/features/audit-logs/audit-log-sanitizer';

describe('sanitizeAuditJson', () => {
  it('masks sensitive keys defensively without mutating unrelated fields', () => {
    const original = {
      safe: 'visible',
      passwordHash: 'hash',
      nested: {
        authorization: 'Bearer token',
        refreshToken: 'refresh-secret',
      },
      items: [{ valueEncrypted: 'cipher' }],
    };

    const result = sanitizeAuditJson(original);

    expect(result).toEqual({
      safe: 'visible',
      passwordHash: '********',
      nested: {
        authorization: '********',
        refreshToken: '********',
      },
      items: [{ valueEncrypted: '********' }],
    });
    expect(original.passwordHash).toBe('hash');
  });

  it('formats null safely for the drawer viewer', () => {
    expect(formatAuditJson(null)).toBe('null');
  });
});
