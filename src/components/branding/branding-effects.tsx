import { useEffect } from 'react';

import { useBranding } from '@/features/branding/branding.hooks';

/**
 * Keeps `document.title` and the `<link rel="icon">` favicon in sync with
 * the configured branding — mounted once, at the top of the app (inside
 * `AppProviders`, alongside `AuthProvider`, not inside it), so it applies
 * regardless of route or authentication state. Renders nothing.
 */
export function BrandingEffects() {
  const { branding } = useBranding();

  useEffect(() => {
    document.title = branding.applicationName;
  }, [branding.applicationName]);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }, [branding.faviconUrl]);

  return null;
}
