import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDashboardClientOptions,
  useDashboardRouteOptions,
} from '@/features/dashboard/dashboard.hooks';
import {
  DEFAULT_DASHBOARD_FILTERS,
  type DashboardFilterState,
  type DashboardPeriod,
} from '@/features/dashboard/dashboard.types';

const PERIOD_OPTIONS: DashboardPeriod[] = [
  'today',
  'last7days',
  'last30days',
  'last90days',
  'custom',
];

const STATUS_CODE_OPTIONS = [200, 201, 400, 401, 403, 404, 429, 500, 502, 503];

interface DashboardFiltersProps {
  value: DashboardFilterState;
  onChange: (value: DashboardFilterState) => void;
}

export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.period !== DEFAULT_DASHBOARD_FILTERS.period ||
    Boolean(value.client) ||
    Boolean(value.route) ||
    Boolean(value.statusCode);

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="dashboard-filter-period" className="text-xs font-medium text-muted">
            {t('dashboard.filters.period.label')}
          </label>
          <select
            id="dashboard-filter-period"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={value.period}
            onChange={(event) =>
              onChange({ ...value, period: event.target.value as DashboardPeriod })
            }
          >
            {PERIOD_OPTIONS.map((period) => (
              <option key={period} value={period}>
                {t(`dashboard.filters.period.options.${period}`)}
              </option>
            ))}
          </select>
        </div>

        <Combobox
          label={t('dashboard.filters.client.label')}
          placeholder={t('dashboard.filters.client.placeholder')}
          emptyMessage={t('dashboard.filters.client.empty')}
          value={value.client}
          onChange={(client) => onChange({ ...value, client })}
          useOptions={useDashboardClientOptions}
          getOptionLabel={(option) => `${option.name} (${option.code})`}
          getOptionId={(option) => option.id}
        />

        <Combobox
          label={t('dashboard.filters.route.label')}
          placeholder={t('dashboard.filters.route.placeholder')}
          emptyMessage={t('dashboard.filters.route.empty')}
          value={value.route}
          onChange={(route) => onChange({ ...value, route })}
          useOptions={useDashboardRouteOptions}
          getOptionLabel={(option) => `${option.name} (${option.slug})`}
          getOptionId={(option) => option.id}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="dashboard-filter-status" className="text-xs font-medium text-muted">
            {t('dashboard.filters.status.label')}
          </label>
          <select
            id="dashboard-filter-status"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={value.statusCode}
            onChange={(event) => onChange({ ...value, statusCode: event.target.value })}
          >
            <option value="">{t('dashboard.filters.status.any')}</option>
            {STATUS_CODE_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => onChange(DEFAULT_DASHBOARD_FILTERS)}
            disabled={!hasActiveFilters}
          >
            {t('dashboard.filters.clear')}
          </Button>
        </div>
      </div>

      {value.period === 'custom' && (
        <div className="grid gap-3 pt-1 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="dashboard-filter-start-date" className="text-xs font-medium text-muted">
              {t('dashboard.filters.startDate')}
            </label>
            <Input
              id="dashboard-filter-start-date"
              type="date"
              value={value.startDate ?? ''}
              onChange={(event) => onChange({ ...value, startDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dashboard-filter-end-date" className="text-xs font-medium text-muted">
              {t('dashboard.filters.endDate')}
            </label>
            <Input
              id="dashboard-filter-end-date"
              type="date"
              value={value.endDate ?? ''}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
            />
          </div>
        </div>
      )}

      {(value.client || value.route || value.statusCode) && (
        <p className="flex items-start gap-1.5 pt-1 text-xs text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {t('dashboard.filters.unsupportedNote')}
        </p>
      )}
    </div>
  );
}
