import { describe, expect, it } from 'vitest';

import { env } from '@/config/env';

describe('env', () => {
  it('parses VITE_APP_NAME as a non-empty string', () => {
    expect(typeof env.VITE_APP_NAME).toBe('string');
    expect(env.VITE_APP_NAME.length).toBeGreaterThan(0);
  });

  it('parses VITE_API_URL as a valid URL', () => {
    expect(() => new URL(env.VITE_API_URL)).not.toThrow();
  });

  it('coerces VITE_REQUEST_TIMEOUT into a positive integer', () => {
    expect(typeof env.VITE_REQUEST_TIMEOUT).toBe('number');
    expect(Number.isInteger(env.VITE_REQUEST_TIMEOUT)).toBe(true);
    expect(env.VITE_REQUEST_TIMEOUT).toBeGreaterThan(0);
  });

  it('parses VITE_PUBLIC_GATEWAY_URL as a valid URL when set, without being required', () => {
    if (env.VITE_PUBLIC_GATEWAY_URL !== undefined) {
      expect(() => new URL(env.VITE_PUBLIC_GATEWAY_URL as string)).not.toThrow();
    }
  });
});
