import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface TableErrorStateProps {
  message: string;
  requestId?: string;
  onRetry?: () => void;
}

export function TableErrorState({ message, requestId, onRetry }: TableErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <p role="alert" className="text-sm text-destructive">
        {message}
      </p>
      {requestId && (
        <p className="text-xs text-muted">{t('shared.error.requestId', { requestId })}</p>
      )}
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t('shared.error.retry')}
        </Button>
      )}
    </div>
  );
}
