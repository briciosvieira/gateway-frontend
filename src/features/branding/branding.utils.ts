import { DEFAULT_BRANDING } from '@/features/branding/branding.constants';
import type { Branding, ResolvedBranding } from '@/features/branding/branding.types';

/**
 * The single fallback authority for branding data — `branding` is
 * `undefined` while `useBranding()` is loading or failed (public branding
 * must never block the app or show a blank identity). Every asset field
 * falls back to `DEFAULT_BRANDING` independently, so a client who only
 * customized the logo still gets the default favicon/brand image.
 */
export function resolveBranding(branding: Branding | undefined): ResolvedBranding {
  return {
    applicationName: branding?.applicationName || DEFAULT_BRANDING.applicationName,
    logoUrl: branding?.logoUrl ?? DEFAULT_BRANDING.logoUrl,
    faviconUrl: branding?.faviconUrl ?? DEFAULT_BRANDING.faviconUrl,
    brandImageUrl: branding?.brandImageUrl ?? DEFAULT_BRANDING.brandImageUrl,
    isCustomLogo: Boolean(branding?.logoUrl),
    isCustomFavicon: Boolean(branding?.faviconUrl),
    isCustomBrandImage: Boolean(branding?.brandImageUrl),
  };
}
