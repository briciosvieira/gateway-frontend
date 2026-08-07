/**
 * Single, central fallback for the whole app — used whenever the backend
 * hasn't configured an asset (`null`) or the public branding request
 * hasn't resolved yet / failed. Never duplicate these literals elsewhere;
 * every consumer goes through `resolveBranding()` (`branding.utils.ts`).
 * `applicationName` here is a plain literal, not translated — see
 * `useBranding`'s consumers: `applicationName` is a configured value, never
 * run through `t()`.
 */
export const DEFAULT_BRANDING = {
  applicationName: 'Duda Gateway Hub',
  logoUrl: '/favicon.svg',
  faviconUrl: '/favicon.svg',
  brandImageUrl: '/duda10.png',
} as const;

/** Branding changes rarely — a long staleTime avoids refetching it on every navigation. */
export const BRANDING_STALE_TIME = 5 * 60_000;

/**
 * Accepted formats per asset — mirrors the real backend content-types
 * confirmed via the live OpenAPI response schema (`image/png`,
 * `image/jpeg`, `image/webp`, `image/svg+xml` for logo/brand image; the
 * same four plus `image/x-icon`/`image/vnd.microsoft.icon` for favicon).
 * UI hint only (file picker `accept` + a fast client-side extension check)
 * — the backend remains the sole authority on the actual file content.
 */
export const BRANDING_LOGO_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg';
export const BRANDING_FAVICON_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,.ico';
export const BRANDING_BRAND_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg';

/**
 * Mirrors `BRANDING_UPLOAD_LIMITS` in the backend's `branding.constants.ts`
 * exactly (confirmed against source, 2026-08-07) — lets the UI reject an
 * oversized file instantly instead of waiting on a round trip that would
 * otherwise always end in a 413. The backend remains the sole authority;
 * this is a fast UX check only.
 */
export const BRANDING_LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const BRANDING_FAVICON_MAX_SIZE_BYTES = 512 * 1024;
export const BRANDING_BRAND_IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
