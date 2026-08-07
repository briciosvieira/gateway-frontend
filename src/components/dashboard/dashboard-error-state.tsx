import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface DashboardErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center text-sm">
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <p className="text-destructive">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {t('api.status.retry')}
        </Button>
      )}
    </div>
  );
}
