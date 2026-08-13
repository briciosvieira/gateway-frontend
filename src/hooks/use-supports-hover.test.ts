import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSupportsHover } from '@/hooks/use-supports-hover';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('useSupportsHover', () => {
  it('returns true when the browser reports a fine pointer with hover support', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useSupportsHover());

    expect(result.current).toBe(true);
  });

  it('returns false for touch/coarse-pointer devices', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useSupportsHover());

    expect(result.current).toBe(false);
  });
});
