import { describe, expect, it } from 'vitest';

import { requestLogKeys } from '@/features/request-logs/request-logs.query-keys';

describe('requestLogKeys', () => {
  it('builds stable list and detail keys', () => {
    expect(requestLogKeys.list({ page: 2, requestId: 'req-1' })).toEqual([
      'request-logs',
      'list',
      { page: 2, requestId: 'req-1' },
    ]);
    expect(requestLogKeys.detail('log-1')).toEqual(['request-logs', 'detail', 'log-1']);
    expect(requestLogKeys.byRequestId('req-1')).toEqual(['request-logs', 'by-request-id', 'req-1']);
  });
});
