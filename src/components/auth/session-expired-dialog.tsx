import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SessionExpiredDialog() {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      <span>
        {t('auth.session.expired')} {t('auth.session.signInAgain')}
      </span>
    </div>
  );
}
