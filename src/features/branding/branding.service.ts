import { env } from '@/config/env';
import type {
  Branding,
  BrandingAssetKind,
  UpdateBrandingNamePayload,
} from '@/features/branding/branding.types';
import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/types/api';

const ASSET_UPLOAD_PATH: Record<BrandingAssetKind, string> = {
  logo: '/branding/logo',
  favicon: '/branding/favicon',
  brandImage: '/branding/brand-image',
};

/**
 * The backend returns asset URLs as paths relative to its own origin (e.g.
 * `/api/v1/branding/assets/logo?v=abc123`, already cache-busted) — not
 * relative to `apiClient`'s `/api/v1` baseURL, since these are consumed
 * directly as `<img src>`/`<link href>`, never through `apiClient`. This
 * resolves them against the API's origin (derived from `VITE_API_URL`,
 * never `VITE_PUBLIC_GATEWAY_URL` — that's the customer-facing gateway
 * proxy, a different host in production).
 */
function toAbsoluteAssetUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${new URL(env.VITE_API_URL).origin}${path}`;
}

function mapBrandingResponse(raw: Branding): Branding {
  return {
    ...raw,
    logoUrl: toAbsoluteAssetUrl(raw.logoUrl),
    faviconUrl: toAbsoluteAssetUrl(raw.faviconUrl),
    brandImageUrl: toAbsoluteAssetUrl(raw.brandImageUrl),
  };
}

/** `GET /branding` — public, no auth required. Used everywhere branding is displayed. */
export async function getPublicBranding(signal?: AbortSignal): Promise<Branding> {
  const response = await apiClient.get<ApiSuccessResponse<Branding>>('/branding', { signal });
  return mapBrandingResponse(response.data.data);
}

/** `PATCH /branding` — ADMIN only. */
export async function updateBrandingName(payload: UpdateBrandingNamePayload): Promise<Branding> {
  const response = await apiClient.patch<ApiSuccessResponse<Branding>>('/branding', payload);
  return mapBrandingResponse(response.data.data);
}

/**
 * `POST /branding/{logo|favicon|brand-image}` — multipart/form-data, ADMIN
 * only. Field name is exactly `file` (confirmed against the live OpenAPI
 * request schema). Never converted to base64/JSON.
 */
export async function uploadBrandingAsset(kind: BrandingAssetKind, file: File): Promise<Branding> {
  const formData = new FormData();
  formData.append('file', file);

  // The default XHR adapter has unreliable `FormData` handling in some
  // environments; the fetch adapter is the well-supported path for
  // multipart bodies in every modern browser this app targets (same
  // pattern as Trusted CAs' upload).
  const response = await apiClient.post<ApiSuccessResponse<Branding>>(
    ASSET_UPLOAD_PATH[kind],
    formData,
    { adapter: 'fetch' },
  );

  return mapBrandingResponse(response.data.data);
}

/** `DELETE /branding/{logo|favicon|brand-image}` — ADMIN only. Resets that asset to the default fallback. */
export async function deleteBrandingAsset(kind: BrandingAssetKind): Promise<Branding> {
  const response = await apiClient.delete<ApiSuccessResponse<Branding>>(ASSET_UPLOAD_PATH[kind]);
  return mapBrandingResponse(response.data.data);
}
