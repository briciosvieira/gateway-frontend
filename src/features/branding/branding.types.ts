/**
 * Mirrors the real backend response exactly (confirmed against the live
 * OpenAPI spec, `BrandingPublicController`/`BrandingAdminController` — no
 * contract was documented in `.ai/BACKEND_CONTRACTS.md` prior to this task,
 * so the live `/docs-json` schema was used as the source of truth). Every
 * branding endpoint (public GET, name PATCH, each asset POST/DELETE)
 * returns this exact same shape. `logoUrl`/`faviconUrl`/`brandImageUrl` are
 * server-relative paths (e.g. `/api/v1/branding/assets/logo?v=abc123`,
 * already cache-busted by the backend) or `null` when not configured.
 */
export interface Branding {
  applicationName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  brandImageUrl: string | null;
  updatedAt: string | null;
}

/** `PATCH /branding` body — mirrors `UpdateBrandingDto` (`applicationName`, 2–100 chars). */
export interface UpdateBrandingNamePayload {
  applicationName: string;
}

/**
 * Branding resolved for direct rendering: every field is a ready-to-use,
 * non-null value (falling back to `DEFAULT_BRANDING` — see
 * `branding.constants.ts` — for whatever the backend hasn't configured, or
 * for the whole object while loading/on error). This is the ONLY place
 * fallback logic exists; every consumer (Sidebar, Home, Login, document
 * title/favicon, the Personalização page itself) reads from here instead of
 * repeating `?? '/favicon.svg'`-style checks locally.
 */
export interface ResolvedBranding {
  applicationName: string;
  logoUrl: string;
  faviconUrl: string;
  brandImageUrl: string;
  isCustomLogo: boolean;
  isCustomFavicon: boolean;
  isCustomBrandImage: boolean;
}

export type BrandingAssetKind = 'logo' | 'favicon' | 'brandImage';
