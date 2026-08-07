import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_ROUTE_HEADERS_FILTERS,
  ROUTE_HEADER_SORT_OPTIONS,
} from '@/features/route-headers/route-headers.constants';
import { useRouteHeaderGatewayRouteOptions } from '@/features/route-headers/route-headers.hooks';
import type { RouteHeadersFilterState } from '@/features/route-headers/route-headers.types';

interface RouteHeaderFiltersProps {
  value: RouteHeadersFilterState;
  onChange: (patch: Partial<RouteHeadersFilterState>) => void;
  onClear: () => void;
}

export function RouteHeaderFilters({ value, onChange, onClear }: RouteHeaderFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.gatewayRoute !== null ||
    value.sensitive !== 'all' ||
    value.status !== 'all' ||
    value.sortBy !== DEFAULT_ROUTE_HEADERS_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_ROUTE_HEADERS_FILTERS.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
      <SearchInput
        id="route-headers-filter-search"
        label={t('routeHeaders.search')}
        placeholder={t('routeHeaders.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      <Combobox
        label={t('routeHeaders.filters.gatewayRoute')}
        placeholder={t('routeHeaders.filters.gatewayRoutePlaceholder')}
        emptyMessage={t('routeHeaders.filters.gatewayRouteEmpty')}
        value={value.gatewayRoute}
        onChange={(gatewayRoute) => onChange({ gatewayRoute, page: 1 })}
        useOptions={useRouteHeaderGatewayRouteOptions}
        getOptionLabel={(option) => `${option.client.name} - ${option.name} (${option.method})`}
        getOptionId={(option) => option.id}
      />

      <FilterSelect
        id="route-headers-filter-sensitive"
        label={t('routeHeaders.filters.sensitive')}
        value={value.sensitive}
        onChange={(sensitive) =>
          onChange({ sensitive: sensitive as RouteHeadersFilterState['sensitive'], page: 1 })
        }
        options={[
          { value: 'all', label: t('routeHeaders.filters.allSensitivity') },
          { value: 'sensitive', label: t('routeHeaders.sensitive.yes') },
          { value: 'notSensitive', label: t('routeHeaders.sensitive.no') },
        ]}
      />

      <FilterSelect
        id="route-headers-filter-status"
        label={t('routeHeaders.filters.status')}
        value={value.status}
        onChange={(status) =>
          onChange({ status: status as RouteHeadersFilterState['status'], page: 1 })
        }
        options={[
          { value: 'all', label: t('routeHeaders.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="route-headers-filter-sort-by"
        label={t('routeHeaders.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) =>
          onChange({ sortBy: sortBy as RouteHeadersFilterState['sortBy'], page: 1 })
        }
        options={ROUTE_HEADER_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`routeHeaders.filters.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="route-headers-filter-sort-order"
        label={t('routeHeaders.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as RouteHeadersFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('routeHeaders.filters.ascending') },
          { value: 'desc', label: t('routeHeaders.filters.descending') },
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
          {t('routeHeaders.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
