import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center text-foreground">
      <h1 className="text-4xl font-bold">{t('notFound.title')}</h1>
      <p className="text-muted">{t('notFound.description')}</p>
      <Link to="/" className="font-medium text-primary hover:underline">
        {t('notFound.backHome')}
      </Link>
    </main>
  );
}
