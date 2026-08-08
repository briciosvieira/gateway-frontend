import { useTranslation } from 'react-i18next';

import { formatUptime } from '@/features/api-status/api-status.utils';
import { useApiHealth } from '@/features/api-status/use-api-health';
import { cn } from '@/lib/utils';

interface ApiStatusInlineProps {
  className?: string;
}

/**
 * Compact one-line replacement for the full `ApiStatusCard` on the Home
 * page — same `useApiHealth()` data/health-check logic, just a smaller
 * presentation. Rendered as its own line below the Monitoring card, not
 * inside it — the card itself only ever shows the title/description that
 * every other Home card also shows.
 */
export function ApiStatusInline({ className }: ApiStatusInlineProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useApiHealth();

  const stateLabel = isLoading
    ? t('api.status.compactChecking')
    : isError
      ? t('api.status.compactDisconnected')
      : t('api.status.compactConnected');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-xs', className)}>
      <span className="font-medium text-foreground">{t('api.status.title')}</span>
      <span className="inline-flex items-center gap-1.5 text-muted">
        <span
          className={cn(
            'size-1.5 rounded-full',
            isLoading ? 'bg-muted-foreground' : isError ? 'bg-destructive' : 'bg-primary',
          )}
          aria-hidden="true"
        />
        {stateLabel}
      </span>
      {data && (
        <span className="text-muted">
          {t('api.status.uptime')} {formatUptime(data.uptime)}
        </span>
      )}
    </div>
  );
}
