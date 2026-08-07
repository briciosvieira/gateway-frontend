import { describe, expect, it } from 'vitest';

import { DEFAULT_BRANDING } from '@/features/branding/branding.constants';
import { resolveBranding } from '@/features/branding/branding.utils';

describe('resolveBranding', () => {
  it('falls back to DEFAULT_BRANDING entirely when branding is undefined (loading or failed request)', () => {
    const resolved = resolveBranding(undefined);

    expect(resolved).toEqual({
      applicationName: DEFAULT_BRANDING.applicationName,
      logoUrl: DEFAULT_BRANDING.logoUrl,
      faviconUrl: DEFAULT_BRANDING.faviconUrl,
      brandImageUrl: DEFAULT_BRANDING.brandImageUrl,
      isCustomLogo: false,
      isCustomFavicon: false,
      isCustomBrandImage: false,
    });
  });

  it('falls back per-asset when the backend has only customized some assets', () => {
    const resolved = resolveBranding({
      applicationName: 'Partner Gateway',
      logoUrl: 'https://cdn.example.com/logo.png',
      faviconUrl: null,
      brandImageUrl: null,
      updatedAt: '2026-08-07T12:00:00.000Z',
    });

    expect(resolved.applicationName).toBe('Partner Gateway');
    expect(resolved.logoUrl).toBe('https://cdn.example.com/logo.png');
    expect(resolved.isCustomLogo).toBe(true);
    expect(resolved.faviconUrl).toBe(DEFAULT_BRANDING.faviconUrl);
    expect(resolved.isCustomFavicon).toBe(false);
    expect(resolved.brandImageUrl).toBe(DEFAULT_BRANDING.brandImageUrl);
    expect(resolved.isCustomBrandImage).toBe(false);
  });

  it('falls back to the default name if the backend ever returns an empty string', () => {
    const resolved = resolveBranding({
      applicationName: '',
      logoUrl: null,
      faviconUrl: null,
      brandImageUrl: null,
      updatedAt: null,
    });

    expect(resolved.applicationName).toBe(DEFAULT_BRANDING.applicationName);
  });

  it('reports every asset as fully customized when the backend has configured all three', () => {
    const resolved = resolveBranding({
      applicationName: 'Partner Gateway',
      logoUrl: 'https://cdn.example.com/logo.png',
      faviconUrl: 'https://cdn.example.com/favicon.png',
      brandImageUrl: 'https://cdn.example.com/brand.png',
      updatedAt: '2026-08-07T12:00:00.000Z',
    });

    expect(resolved.isCustomLogo).toBe(true);
    expect(resolved.isCustomFavicon).toBe(true);
    expect(resolved.isCustomBrandImage).toBe(true);
  });
});
