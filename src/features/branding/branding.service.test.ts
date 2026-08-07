import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as brandingService from '@/features/branding/branding.service';
import { apiClient } from '@/lib/api/api-client';

vi.mock('@/lib/api/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function envelope<T>(data: T) {
  return {
    data: {
      success: true,
      message: 'Request completed successfully.',
      data,
      requestId: 'req-123',
      timestamp: '2026-08-06T12:00:00.000Z',
    },
  };
}

const rawBranding = {
  applicationName: 'Gateway Hub LF',
  logoUrl: '/api/v1/branding/assets/logo?v=abc123',
  faviconUrl: '/api/v1/branding/assets/favicon?v=abc123',
  brandImageUrl: '/api/v1/branding/assets/brand-image?v=abc123',
  updatedAt: '2026-08-07T12:00:00.000Z',
};

describe('branding.service', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('getPublicBranding calls GET /branding and resolves asset URLs against the API origin, not the raw relative path', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(envelope(rawBranding));

    const result = await brandingService.getPublicBranding();

    expect(apiClient.get).toHaveBeenCalledWith('/branding', { signal: undefined });
    expect(result.applicationName).toBe('Gateway Hub LF');
    expect(result.logoUrl).toBe('http://localhost:3110/api/v1/branding/assets/logo?v=abc123');
    expect(result.faviconUrl).toBe('http://localhost:3110/api/v1/branding/assets/favicon?v=abc123');
    expect(result.brandImageUrl).toBe(
      'http://localhost:3110/api/v1/branding/assets/brand-image?v=abc123',
    );
  });

  it("getPublicBranding keeps null asset URLs as null (never fabricates a fallback here — that is resolveBranding's job)", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      envelope({ ...rawBranding, logoUrl: null, faviconUrl: null, brandImageUrl: null }),
    );

    const result = await brandingService.getPublicBranding();

    expect(result.logoUrl).toBeNull();
    expect(result.faviconUrl).toBeNull();
    expect(result.brandImageUrl).toBeNull();
  });

  it('updateBrandingName calls PATCH /branding with the exact real field name', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      envelope({ ...rawBranding, applicationName: 'Partner Gateway' }),
    );

    const result = await brandingService.updateBrandingName({
      applicationName: 'Partner Gateway',
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/branding', {
      applicationName: 'Partner Gateway',
    });
    expect(result.applicationName).toBe('Partner Gateway');
  });

  it('uploadBrandingAsset posts a multipart FormData with exactly the real field name (file), never base64', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(rawBranding));

    const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' });
    await brandingService.uploadBrandingAsset('logo', file);

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0];
    expect(url).toBe('/branding/logo');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect(typeof (body as FormData).get('file')).not.toBe('string');
    expect(config).toEqual({ adapter: 'fetch' });
  });

  it('uploadBrandingAsset posts to the real per-asset path for favicon and brand image', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(envelope(rawBranding));
    const file = new File(['bytes'], 'asset.png', { type: 'image/png' });

    await brandingService.uploadBrandingAsset('favicon', file);
    expect(vi.mocked(apiClient.post).mock.calls[0][0]).toBe('/branding/favicon');

    await brandingService.uploadBrandingAsset('brandImage', file);
    expect(vi.mocked(apiClient.post).mock.calls[1][0]).toBe('/branding/brand-image');
  });

  it('deleteBrandingAsset calls DELETE on the real per-asset path', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(envelope({ ...rawBranding, logoUrl: null }));

    await brandingService.deleteBrandingAsset('logo');
    expect(apiClient.delete).toHaveBeenCalledWith('/branding/logo');

    await brandingService.deleteBrandingAsset('favicon');
    expect(apiClient.delete).toHaveBeenCalledWith('/branding/favicon');

    await brandingService.deleteBrandingAsset('brandImage');
    expect(apiClient.delete).toHaveBeenCalledWith('/branding/brand-image');
  });
});
