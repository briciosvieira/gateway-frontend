import { useTranslation } from 'react-i18next';

import { CollapsibleFilterPanel } from '@/components/shared/collapsible-filter-panel';
import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DEFAULT_REQUEST_LOG_FILTERS,
  REQUEST_LOG_METHODS,
  REQUEST_LOG_ORIGINS,
  REQUEST_LOG_RESULTS,
  REQUEST_LOG_SORT_OPTIONS,
} from '@/features/request-logs/request-logs.constants';
import type { RequestLogsFilterState } from '@/features/request-logs/request-logs.types';

interface RequestLogFiltersProps {
  value: RequestLogsFilterState;
  dateRangeError: string | null;
  onChange: (patch: Partial<RequestLogsFilterState>) => void;
  onClear: () => void;
}

export function RequestLogFilters({
  value,
  dateRangeError,
  onChange,
  onClear,
}: RequestLogFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.requestOrigin !== 'all' ||
    value.method !== 'all' ||
    value.statusCode !== '' ||
    value.result !== 'all' ||
    value.startDate !== '' ||
    value.endDate !== '' ||
    value.sortBy !== DEFAULT_REQUEST_LOG_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_REQUEST_LOG_FILTERS.sortOrder;

  return (
    <CollapsibleFilterPanel
      gridClassName="md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      hasActiveFilters={hasActiveFilters}
      defaultExpanded={Boolean(dateRangeError)}
      searchSlot={
        <SearchInput
          id="request-logs-filter-search"
          label={t('requestLogs.filters.search')}
          placeholder={t('requestLogs.filters.searchPlaceholder')}
          value={value.search}
          onChange={(search) => onChange({ search, page: 1 })}
        />
      }
    >
      <FilterSelect
        id="request-logs-filter-origin"
        label={t('requestLogs.filters.origin')}
        value={value.requestOrigin}
        onChange={(requestOrigin) =>
          onChange({
            requestOrigin: requestOrigin as RequestLogsFilterState['requestOrigin'],
            page: 1,
          })
        }
        options={[
          { value: 'all', label: t('requestLogs.filters.allOrigins') },
          ...REQUEST_LOG_ORIGINS.map((origin) => ({
            value: origin,
            label: t(`requestLogs.origins.${origin}`),
          })),
        ]}
      />

      <FilterSelect
        id="request-logs-filter-method"
        label={t('requestLogs.filters.method')}
        value={value.method}
        onChange={(method) =>
          onChange({ method: method as RequestLogsFilterState['method'], page: 1 })
        }
        options={[
          { value: 'all', label: t('requestLogs.filters.allMethods') },
          ...REQUEST_LOG_METHODS.map((method) => ({ value: method, label: method })),
        ]}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="request-logs-filter-status-code" className="text-xs font-medium text-muted">
          {t('requestLogs.filters.statusCode')}
        </label>
        <Input
          id="request-logs-filter-status-code"
          type="number"
          min={100}
          max={599}
          value={value.statusCode}
          onChange={(event) => onChange({ statusCode: event.target.value, page: 1 })}
          placeholder={t('requestLogs.filters.statusCodePlaceholder')}
        />
      </div>

      <FilterSelect
        id="request-logs-filter-result"
        label={t('requestLogs.filters.result')}
        value={value.result}
        onChange={(result) =>
          onChange({ result: result as RequestLogsFilterState['result'], page: 1 })
        }
        options={[
          { value: 'all', label: t('requestLogs.filters.allResults') },
          ...REQUEST_LOG_RESULTS.map((result) => ({
            value: result,
            label: t(`requestLogs.results.${result}`),
          })),
        ]}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="request-logs-filter-start-date" className="text-xs font-medium text-muted">
          {t('requestLogs.filters.startDate')}
        </label>
        <Input
          id="request-logs-filter-start-date"
          type="date"
          value={value.startDate}
          onChange={(event) => onChange({ startDate: event.target.value, page: 1 })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="request-logs-filter-end-date" className="text-xs font-medium text-muted">
          {t('requestLogs.filters.endDate')}
        </label>
        <Input
          id="request-logs-filter-end-date"
          type="date"
          value={value.endDate}
          onChange={(event) => onChange({ endDate: event.target.value, page: 1 })}
        />
      </div>

      <FilterSelect
        id="request-logs-filter-sort-by"
        label={t('requestLogs.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) =>
          onChange({ sortBy: sortBy as RequestLogsFilterState['sortBy'], page: 1 })
        }
        options={REQUEST_LOG_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`requestLogs.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="request-logs-filter-sort-order"
        label={t('requestLogs.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as RequestLogsFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('requestLogs.filters.ascending') },
          { value: 'desc', label: t('requestLogs.filters.descending') },
        ]}
      />

      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onClear}
          disabled={!hasActiveFilters}
        >
          {t('requestLogs.filters.clear')}
        </Button>
      </div>

      {dateRangeError && (
        <p className="text-sm text-destructive md:col-span-2 xl:col-span-3 2xl:col-span-4">
          {dateRangeError}
        </p>
      )}
    </CollapsibleFilterPanel>
  );
}
