import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeSessionExpiredFlag,
  emitSessionExpired,
  subscribeToSessionExpired,
} from '@/features/auth/auth-session-events';

describe('auth-session-events', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('notifies subscribers when the session expires', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToSessionExpired(callback);

    emitSessionExpired();

    expect(callback).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('stops notifying after unsubscribing', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToSessionExpired(callback);
    unsubscribe();

    emitSessionExpired();

    expect(callback).not.toHaveBeenCalled();
  });

  it('sets a sessionStorage flag that consumeSessionExpiredFlag reads once and clears', () => {
    emitSessionExpired();

    expect(consumeSessionExpiredFlag()).toBe(true);
    expect(consumeSessionExpiredFlag()).toBe(false);
  });

  it('returns false when the session never expired', () => {
    expect(consumeSessionExpiredFlag()).toBe(false);
  });
});
