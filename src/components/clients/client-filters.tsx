import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { CLIENT_SORT_OPTIONS, DEFAULT_CLIENTS_FILTERS } from '@/features/clients/clients.constants';
import type { ClientsFilterState } from '@/features/clients/clients.types';

interface ClientFiltersProps {
  value: ClientsFilterState;
  onChange: (patch: Partial<ClientsFilterState>) => void;
  onClear: () => void;
}

export function ClientFilters({ value, onChange, onClear }: ClientFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.status !== 'all' ||
    value.sortBy !== DEFAULT_CLIENTS_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_CLIENTS_FILTERS.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
      <SearchInput
        id="clients-filter-search"
        label={t('clients.search')}
        placeholder={t('clients.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      <FilterSelect
        id="clients-filter-status"
        label={t('clients.filters.status')}
        value={value.status}
        onChange={(status) => onChange({ status: status as ClientsFilterState['status'], page: 1 })}
        options={[
          { value: 'all', label: t('clients.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="clients-filter-sort-by"
        label={t('clients.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) => onChange({ sortBy: sortBy as ClientsFilterState['sortBy'], page: 1 })}
        options={CLIENT_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`clients.filters.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="clients-filter-sort-order"
        label={t('clients.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as ClientsFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('clients.filters.ascending') },
          { value: 'desc', label: t('clients.filters.descending') },
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
          {t('clients.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
