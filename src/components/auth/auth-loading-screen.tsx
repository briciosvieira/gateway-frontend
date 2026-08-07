import { useTranslation } from 'react-i18next';

export function AuthLoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <img src="/favicon.svg" alt="" className="size-12" aria-hidden="true" />
      <p className="text-sm font-semibold">{t('app.name')}</p>
      <div
        className="size-6 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label={t('auth.loadingSession')}
      />
      <p className="text-sm text-muted">{t('auth.loadingSession')}</p>
    </div>
  );
}
