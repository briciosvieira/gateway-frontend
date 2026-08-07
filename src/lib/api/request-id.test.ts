import { describe, expect, it } from 'vitest';

import { createRequestId } from '@/lib/api/request-id';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createRequestId', () => {
  it('returns a valid UUID v4 string', () => {
    expect(createRequestId()).toMatch(UUID_V4_PATTERN);
  });

  it('returns a different value on each call', () => {
    const first = createRequestId();
    const second = createRequestId();

    expect(first).not.toBe(second);
  });
});
