import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center text-foreground">
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-lg font-medium">{t('auth.forbidden.title')}</p>
      <p className="text-muted">{t('auth.forbidden.description')}</p>
      <Link to="/" className="font-medium text-primary hover:underline">
        {t('notFound.backHome')}
      </Link>
    </main>
  );
}
