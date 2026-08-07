import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/shared/combobox';
import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import {
  API_KEY_SORT_OPTIONS,
  DEFAULT_API_KEYS_FILTERS,
} from '@/features/api-keys/api-keys.constants';
import { useApiKeyClientOptions } from '@/features/api-keys/api-keys.hooks';
import type { ApiKeysFilterState } from '@/features/api-keys/api-keys.types';

interface ApiKeyFiltersProps {
  value: ApiKeysFilterState;
  onChange: (patch: Partial<ApiKeysFilterState>) => void;
  onClear: () => void;
  /** Hidden when the client is already fixed by the surrounding context (e.g. inside a client's resource drawer). Defaults to `true`. */
  showClientFilter?: boolean;
}

export function ApiKeyFilters({
  value,
  onChange,
  onClear,
  showClientFilter = true,
}: ApiKeyFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.client !== null ||
    value.status !== 'all' ||
    value.onlyExpired ||
    value.sortBy !== DEFAULT_API_KEYS_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_API_KEYS_FILTERS.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
      <SearchInput
        id="api-keys-filter-search"
        label={t('apiKeys.search')}
        placeholder={t('apiKeys.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      {showClientFilter && (
        <Combobox
          label={t('apiKeys.filters.client')}
          placeholder={t('apiKeys.filters.clientPlaceholder')}
          emptyMessage={t('apiKeys.filters.clientEmpty')}
          value={value.client}
          onChange={(client) => onChange({ client, page: 1 })}
          useOptions={useApiKeyClientOptions}
          getOptionLabel={(option) => `${option.name} (${option.code})`}
          getOptionId={(option) => option.id}
        />
      )}

      <FilterSelect
        id="api-keys-filter-status"
        label={t('apiKeys.filters.status')}
        value={value.status}
        onChange={(status) => onChange({ status: status as ApiKeysFilterState['status'], page: 1 })}
        options={[
          { value: 'all', label: t('apiKeys.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="api-keys-filter-expired"
        label={t('apiKeys.filters.expiration')}
        value={value.onlyExpired ? 'expired' : 'all'}
        onChange={(next) => onChange({ onlyExpired: next === 'expired', page: 1 })}
        options={[
          { value: 'all', label: t('apiKeys.filters.allExpirations') },
          { value: 'expired', label: t('apiKeys.filters.onlyExpired') },
        ]}
      />

      <FilterSelect
        id="api-keys-filter-sort-by"
        label={t('apiKeys.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) => onChange({ sortBy: sortBy as ApiKeysFilterState['sortBy'], page: 1 })}
        options={API_KEY_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`apiKeys.filters.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="api-keys-filter-sort-order"
        label={t('apiKeys.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as ApiKeysFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('apiKeys.filters.ascending') },
          { value: 'desc', label: t('apiKeys.filters.descending') },
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
          {t('apiKeys.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
