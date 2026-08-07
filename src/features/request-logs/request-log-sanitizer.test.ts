import { describe, expect, it } from 'vitest';

import { sanitizeRequestLogJson } from '@/features/request-logs/request-log-sanitizer';

describe('request-log-sanitizer', () => {
  it('masks sensitive keys defensively without mutating the original payload', () => {
    const payload = {
      authorization: 'Bearer secret-token',
      'x-api-key': 'plain-api-key',
      nested: {
        password: 'super-secret',
        token: 'abc',
        valueEncrypted: 'cipher',
        certificatePem: 'pem',
        privateKey: 'pk',
      },
      safe: 'visible',
    };

    const sanitized = sanitizeRequestLogJson(payload);

    expect(sanitized).toEqual({
      authorization: '********',
      'x-api-key': '********',
      nested: {
        password: '********',
        token: '********',
        valueEncrypted: '********',
        certificatePem: '********',
        privateKey: '********',
      },
      safe: 'visible',
    });
    expect(payload.authorization).toBe('Bearer secret-token');
    expect(payload.nested.password).toBe('super-secret');
  });
});
