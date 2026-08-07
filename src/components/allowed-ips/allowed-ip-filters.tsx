import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import {
  ALLOWED_IP_SORT_OPTIONS,
  ALLOWED_IP_TYPES,
  DEFAULT_ALLOWED_IPS_FILTERS,
} from '@/features/allowed-ips/allowed-ips.constants';
import { useAllowedIpClientOptions } from '@/features/allowed-ips/allowed-ips.hooks';
import type { AllowedIpsFilterState } from '@/features/allowed-ips/allowed-ips.types';

interface AllowedIpFiltersProps {
  value: AllowedIpsFilterState;
  onChange: (patch: Partial<AllowedIpsFilterState>) => void;
  onClear: () => void;
  /** Hidden when the client is already fixed by the surrounding context (e.g. inside a client's resource drawer). Defaults to `true`. */
  showClientFilter?: boolean;
}

export function AllowedIpFilters({
  value,
  onChange,
  onClear,
  showClientFilter = true,
}: AllowedIpFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.client !== null ||
    value.type !== 'all' ||
    value.status !== 'all' ||
    value.sortBy !== DEFAULT_ALLOWED_IPS_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_ALLOWED_IPS_FILTERS.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
      <SearchInput
        id="allowed-ips-filter-search"
        label={t('allowedIps.search')}
        placeholder={t('allowedIps.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      {showClientFilter && (
        <Combobox
          label={t('allowedIps.filters.client')}
          placeholder={t('allowedIps.filters.clientPlaceholder')}
          emptyMessage={t('allowedIps.filters.clientEmpty')}
          value={value.client}
          onChange={(client) => onChange({ client, page: 1 })}
          useOptions={useAllowedIpClientOptions}
          getOptionLabel={(option) => `${option.name} (${option.code})`}
          getOptionId={(option) => option.id}
        />
      )}

      <FilterSelect
        id="allowed-ips-filter-type"
        label={t('allowedIps.filters.type')}
        value={value.type}
        onChange={(type) => onChange({ type: type as AllowedIpsFilterState['type'], page: 1 })}
        options={[
          { value: 'all', label: t('allowedIps.filters.allTypes') },
          ...ALLOWED_IP_TYPES.map((type) => ({
            value: type,
            label: t(`allowedIps.types.${type}`),
          })),
        ]}
      />

      <FilterSelect
        id="allowed-ips-filter-status"
        label={t('allowedIps.filters.status')}
        value={value.status}
        onChange={(status) =>
          onChange({ status: status as AllowedIpsFilterState['status'], page: 1 })
        }
        options={[
          { value: 'all', label: t('allowedIps.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="allowed-ips-filter-sort-by"
        label={t('allowedIps.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) =>
          onChange({ sortBy: sortBy as AllowedIpsFilterState['sortBy'], page: 1 })
        }
        options={ALLOWED_IP_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`allowedIps.filters.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="allowed-ips-filter-sort-order"
        label={t('allowedIps.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as AllowedIpsFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('allowedIps.filters.ascending') },
          { value: 'desc', label: t('allowedIps.filters.descending') },
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
          {t('allowedIps.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
