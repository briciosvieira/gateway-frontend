import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_GATEWAY_ROUTES_FILTERS,
  GATEWAY_ROUTE_METHODS,
  GATEWAY_ROUTE_SORT_OPTIONS,
} from '@/features/gateway-routes/gateway-routes.constants';
import { useGatewayRouteClientOptions } from '@/features/gateway-routes/gateway-routes.hooks';
import type { GatewayRoutesFilterState } from '@/features/gateway-routes/gateway-routes.types';

interface GatewayRouteFiltersProps {
  value: GatewayRoutesFilterState;
  onChange: (patch: Partial<GatewayRoutesFilterState>) => void;
  onClear: () => void;
  /** Hidden when the client is already fixed by the surrounding context (e.g. inside a client's resource drawer). Defaults to `true`. */
  showClientFilter?: boolean;
}

export function GatewayRouteFilters({
  value,
  onChange,
  onClear,
  showClientFilter = true,
}: GatewayRouteFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.client !== null ||
    value.method !== 'all' ||
    value.status !== 'all' ||
    value.sortBy !== DEFAULT_GATEWAY_ROUTES_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_GATEWAY_ROUTES_FILTERS.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
      <SearchInput
        id="gateway-routes-filter-search"
        label={t('gatewayRoutes.search')}
        placeholder={t('gatewayRoutes.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      {showClientFilter && (
        <Combobox
          label={t('gatewayRoutes.filters.client')}
          placeholder={t('gatewayRoutes.filters.clientPlaceholder')}
          emptyMessage={t('gatewayRoutes.filters.clientEmpty')}
          value={value.client}
          onChange={(client) => onChange({ client, page: 1 })}
          useOptions={useGatewayRouteClientOptions}
          getOptionLabel={(option) => `${option.name} (${option.code})`}
          getOptionId={(option) => option.id}
        />
      )}

      <FilterSelect
        id="gateway-routes-filter-method"
        label={t('gatewayRoutes.filters.method')}
        value={value.method}
        onChange={(method) =>
          onChange({ method: method as GatewayRoutesFilterState['method'], page: 1 })
        }
        options={[
          { value: 'all', label: t('gatewayRoutes.filters.allMethods') },
          ...GATEWAY_ROUTE_METHODS.map((method) => ({ value: method, label: method })),
        ]}
      />

      <FilterSelect
        id="gateway-routes-filter-status"
        label={t('gatewayRoutes.filters.status')}
        value={value.status}
        onChange={(status) =>
          onChange({ status: status as GatewayRoutesFilterState['status'], page: 1 })
        }
        options={[
          { value: 'all', label: t('gatewayRoutes.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="gateway-routes-filter-sort-by"
        label={t('gatewayRoutes.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) =>
          onChange({ sortBy: sortBy as GatewayRoutesFilterState['sortBy'], page: 1 })
        }
        options={GATEWAY_ROUTE_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`gatewayRoutes.filters.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="gateway-routes-filter-sort-order"
        label={t('gatewayRoutes.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as GatewayRoutesFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('gatewayRoutes.filters.ascending') },
          { value: 'desc', label: t('gatewayRoutes.filters.descending') },
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
          {t('gatewayRoutes.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
