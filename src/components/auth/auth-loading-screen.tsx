import { useTranslation } from 'react-i18next';

import { useBranding } from '@/features/branding/branding.hooks';

export function AuthLoadingScreen() {
  const { t } = useTranslation();
  const { branding } = useBranding();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <img src={branding.faviconUrl} alt="" className="size-12" aria-hidden="true" />
      <p className="text-sm font-semibold">{branding.applicationName}</p>
      <div
        className="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label={t('auth.loadingSession')}
      />
      <p className="text-sm text-muted">{t('auth.loadingSession')}</p>
    </div>
  );
}
