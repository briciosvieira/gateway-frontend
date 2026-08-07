import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiHealth } from '@/features/api-status/use-api-health';
import { getApiErrorMessage } from '@/lib/api/api-response';
import { cn } from '@/lib/utils';

function formatUptime(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function ApiStatusCard() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useApiHealth();

  return (
    <Card className="border-dashed">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t('api.status.title')}</CardTitle>
        <span
          className={cn(
            'size-2 rounded-full',
            isLoading ? 'bg-muted' : isError ? 'bg-destructive' : 'bg-primary',
          )}
          aria-hidden="true"
        />
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {isLoading && <p className="text-muted">{t('api.status.checking')}</p>}

        {isError && (
          <div className="space-y-3">
            <p className="font-medium text-destructive">{t('api.status.disconnected')}</p>
            <p className="text-muted">{getApiErrorMessage(error, t('api.errors.unknown'))}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw aria-hidden="true" />
              {t('api.status.retry')}
            </Button>
          </div>
        )}

        {data && (
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t('api.status.connected')}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
              <dt>{t('api.status.application')}</dt>
              <dd className="text-foreground">{data.application}</dd>
              <dt>{t('api.status.uptime')}</dt>
              <dd className="text-foreground">{formatUptime(data.uptime)}</dd>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
