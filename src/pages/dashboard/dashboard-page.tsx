import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Gauge,
  KeyRound,
  Route,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { DashboardChart } from '@/components/dashboard/dashboard-chart';
import { DashboardEmptyState } from '@/components/dashboard/dashboard-empty-state';
import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { DashboardTable, type DashboardTableColumn } from '@/components/dashboard/dashboard-table';
import { Card } from '@/components/ui/card';
import {
  useDashboardCards,
  useDashboardCharts,
  useRecentRequests,
  useTopClients,
  useTopRoutes,
  type DashboardCardViewModel,
} from '@/features/dashboard/dashboard.hooks';
import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardFilterState,
  type DashboardPeriodQuery,
  type DashboardRecentRequest,
  type DashboardTopClient,
  type DashboardTopRoute,
} from '@/features/dashboard/dashboard.types';
import { getApiErrorMessage } from '@/lib/api/api-response';
import { cn } from '@/lib/utils';

const CARD_KEYS: DashboardCardViewModel['key'][] = [
  'clients',
  'apiKeys',
  'routes',
  'requests',
  'errors',
  'successRate',
];

const CARD_CONFIG: Record<DashboardCardViewModel['key'], { icon: LucideIcon; labelKey: string }> = {
  clients: { icon: Building2, labelKey: 'dashboard.cards.clients' },
  apiKeys: { icon: KeyRound, labelKey: 'dashboard.cards.apiKeys' },
  routes: { icon: Route, labelKey: 'dashboard.cards.routes' },
  requests: { icon: Activity, labelKey: 'dashboard.cards.requests' },
  errors: { icon: AlertTriangle, labelKey: 'dashboard.cards.errors' },
  successRate: { icon: CheckCircle2, labelKey: 'dashboard.cards.successRate' },
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatCardValue(card: DashboardCardViewModel): string {
  return card.unit === 'percent' ? `${card.value.toFixed(1)}%` : formatNumber(card.value);
}

function formatMs(value: number): string {
  return `${formatNumber(Math.round(value))} ms`;
}

function StatusCodeBadge({ statusCode }: { statusCode: number }) {
  const isSuccess = statusCode < 400;

  return (
    <span
      className={cn(
        'font-mono text-xs font-medium',
        isSuccess ? 'text-primary' : 'text-destructive',
      )}
    >
      {statusCode}
    </span>
  );
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();

  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_DASHBOARD_FILTERS);

  const periodQuery = useMemo<DashboardPeriodQuery>(
    () => ({
      period: filters.period,
      startDate: filters.period === 'custom' ? filters.startDate : undefined,
      endDate: filters.period === 'custom' ? filters.endDate : undefined,
    }),
    [filters.period, filters.startDate, filters.endDate],
  );

  const {
    data: overview,
    cards,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardCards(periodQuery);
  const { requestsOverTime, statusDistribution } = useDashboardCharts(periodQuery);
  const topClients = useTopClients(10, periodQuery);
  const topRoutes = useTopRoutes(10, periodQuery);
  const recentRequests = useRecentRequests(periodQuery);

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const topClientColumns: DashboardTableColumn<DashboardTopClient>[] = [
    { key: 'name', header: t('dashboard.topClients.columns.client'), render: (row) => row.name },
    {
      key: 'requests',
      header: t('dashboard.topClients.columns.requests'),
      align: 'right',
      render: (row) => formatNumber(row.requests),
    },
    {
      key: 'errors',
      header: t('dashboard.topClients.columns.errors'),
      align: 'right',
      render: (row) => formatNumber(row.errors),
    },
    {
      key: 'averageResponseTime',
      header: t('dashboard.topClients.columns.averageResponseTime'),
      align: 'right',
      render: (row) => formatMs(row.averageResponseTime),
    },
  ];

  const topRouteColumns: DashboardTableColumn<DashboardTopRoute>[] = [
    { key: 'name', header: t('dashboard.topRoutes.columns.route'), render: (row) => row.name },
    {
      key: 'method',
      header: t('dashboard.topRoutes.columns.method'),
      render: (row) => <span className="font-mono text-xs">{row.method}</span>,
    },
    {
      key: 'requests',
      header: t('dashboard.topRoutes.columns.requests'),
      align: 'right',
      render: (row) => formatNumber(row.requests),
    },
    {
      key: 'errors',
      header: t('dashboard.topRoutes.columns.errors'),
      align: 'right',
      render: (row) => formatNumber(row.errors),
    },
    {
      key: 'averageResponseTime',
      header: t('dashboard.topRoutes.columns.averageResponseTime'),
      align: 'right',
      render: (row) => formatMs(row.averageResponseTime),
    },
  ];

  const recentRequestColumns: DashboardTableColumn<DashboardRecentRequest>[] = [
    {
      key: 'requestId',
      header: t('dashboard.recentRequests.columns.requestId'),
      render: (row) => <span className="font-mono text-xs">{row.requestId.slice(0, 8)}</span>,
    },
    {
      key: 'client',
      header: t('dashboard.recentRequests.columns.client'),
      render: (row) => row.client?.name ?? t('dashboard.notAvailable'),
    },
    {
      key: 'route',
      header: t('dashboard.recentRequests.columns.route'),
      render: (row) => row.route?.name ?? t('dashboard.notAvailable'),
    },
    {
      key: 'status',
      header: t('dashboard.recentRequests.columns.status'),
      align: 'right',
      render: (row) => <StatusCodeBadge statusCode={row.statusCode} />,
    },
    {
      key: 'duration',
      header: t('dashboard.recentRequests.columns.duration'),
      align: 'right',
      render: (row) => formatMs(row.durationMs),
    },
    {
      key: 'date',
      header: t('dashboard.recentRequests.columns.date'),
      render: (row) => dateFormatter.format(new Date(row.createdAt)),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted">{t('dashboard.subtitle')}</p>
      </div>

      <DashboardFilters value={filters} onChange={setFilters} />

      <DashboardSection title={t('dashboard.cards.title')}>
        {isError ? (
          <DashboardErrorState
            message={getApiErrorMessage(error, t('dashboard.states.loadError'))}
            onRetry={refetch}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {CARD_KEYS.map((key) => {
              const config = CARD_CONFIG[key];
              const card = cards?.find((item) => item.key === key);

              return (
                <DashboardCard
                  key={key}
                  icon={config.icon}
                  label={t(config.labelKey)}
                  value={card ? formatCardValue(card) : ''}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title={t('dashboard.indicators.title')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardCard
            icon={Clock}
            label={t('dashboard.indicators.averageResponseTime')}
            value={overview ? formatMs(overview.averageResponseTime) : ''}
            isLoading={isLoading}
          />
          <DashboardCard
            icon={Gauge}
            label={t('dashboard.indicators.maxResponseTime')}
            value={overview ? formatMs(overview.maxResponseTime) : ''}
            isLoading={isLoading}
          />
        </div>
      </DashboardSection>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSection title={t('dashboard.charts.requestsOverTime.title')} className="min-w-0">
          <Card className="min-w-0 overflow-hidden p-4">
            {requestsOverTime.isError ? (
              <DashboardErrorState
                message={getApiErrorMessage(
                  requestsOverTime.error,
                  t('dashboard.states.loadError'),
                )}
                onRetry={requestsOverTime.refetch}
              />
            ) : requestsOverTime.isLoading ? (
              <DashboardSkeleton className="h-75 w-full" />
            ) : !requestsOverTime.data?.length ? (
              <DashboardEmptyState message={t('dashboard.states.emptyChart')} />
            ) : (
              <DashboardChart
                type="area"
                data={requestsOverTime.data}
                xKey="label"
                description={t('dashboard.charts.requestsOverTime.description')}
                series={[
                  {
                    key: 'success',
                    label: t('dashboard.charts.requestsOverTime.success'),
                    color: 'primary',
                  },
                  {
                    key: 'error',
                    label: t('dashboard.charts.requestsOverTime.error'),
                    color: 'destructive',
                  },
                ]}
              />
            )}
          </Card>
        </DashboardSection>

        <DashboardSection
          title={t('dashboard.charts.statusDistribution.title')}
          className="min-w-0"
        >
          <Card className="min-w-0 overflow-hidden p-4">
            {statusDistribution.isError ? (
              <DashboardErrorState
                message={getApiErrorMessage(
                  statusDistribution.error,
                  t('dashboard.states.loadError'),
                )}
                onRetry={statusDistribution.refetch}
              />
            ) : statusDistribution.isLoading ? (
              <DashboardSkeleton className="h-65 w-full" />
            ) : !statusDistribution.data?.length ? (
              <DashboardEmptyState message={t('dashboard.states.emptyChart')} />
            ) : (
              <DashboardChart
                type="bar"
                data={statusDistribution.data}
                xKey="statusCode"
                description={t('dashboard.charts.statusDistribution.description')}
                series={[
                  {
                    key: 'total',
                    label: t('dashboard.charts.statusDistribution.total'),
                    color: 'primary',
                  },
                ]}
              />
            )}
          </Card>
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSection title={t('dashboard.topClients.title')} className="min-w-0">
          {topClients.isError ? (
            <DashboardErrorState
              message={getApiErrorMessage(topClients.error, t('dashboard.states.loadError'))}
              onRetry={topClients.refetch}
            />
          ) : topClients.isLoading ? (
            <DashboardSkeleton className="h-40 w-full" />
          ) : !topClients.data?.length ? (
            <DashboardEmptyState message={t('dashboard.states.emptyTable')} />
          ) : (
            <DashboardTable
              columns={topClientColumns}
              rows={topClients.data}
              getRowKey={(row) => row.clientId}
              caption={t('dashboard.topClients.title')}
            />
          )}
        </DashboardSection>

        <DashboardSection title={t('dashboard.topRoutes.title')} className="min-w-0">
          {topRoutes.isError ? (
            <DashboardErrorState
              message={getApiErrorMessage(topRoutes.error, t('dashboard.states.loadError'))}
              onRetry={topRoutes.refetch}
            />
          ) : topRoutes.isLoading ? (
            <DashboardSkeleton className="h-40 w-full" />
          ) : !topRoutes.data?.length ? (
            <DashboardEmptyState message={t('dashboard.states.emptyTable')} />
          ) : (
            <DashboardTable
              columns={topRouteColumns}
              rows={topRoutes.data}
              getRowKey={(row) => row.routeId}
              caption={t('dashboard.topRoutes.title')}
            />
          )}
        </DashboardSection>
      </div>

      <DashboardSection title={t('dashboard.recentRequests.title')}>
        {recentRequests.isError ? (
          <DashboardErrorState
            message={getApiErrorMessage(recentRequests.error, t('dashboard.states.loadError'))}
            onRetry={recentRequests.refetch}
          />
        ) : recentRequests.isLoading ? (
          <DashboardSkeleton className="h-40 w-full" />
        ) : !recentRequests.data?.length ? (
          <DashboardEmptyState message={t('dashboard.states.emptyTable')} />
        ) : (
          <DashboardTable
            columns={recentRequestColumns}
            rows={recentRequests.data}
            getRowKey={(row) => row.requestId}
            caption={t('dashboard.recentRequests.title')}
          />
        )}
      </DashboardSection>
    </div>
  );
}
