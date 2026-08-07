import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_TRUSTED_CAS_FILTERS,
  TRUSTED_CA_SORT_OPTIONS,
} from '@/features/trusted-cas/trusted-cas.constants';
import type { TrustedCasFilterState } from '@/features/trusted-cas/trusted-cas.types';

interface TrustedCaFiltersProps {
  value: TrustedCasFilterState;
  onChange: (patch: Partial<TrustedCasFilterState>) => void;
  onClear: () => void;
}

export function TrustedCaFilters({ value, onChange, onClear }: TrustedCaFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.status !== 'all' ||
    value.validity !== 'all' ||
    value.sortBy !== DEFAULT_TRUSTED_CAS_FILTERS.sortBy ||
    value.sortOrder !== DEFAULT_TRUSTED_CAS_FILTERS.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-3">
      <SearchInput
        id="trusted-cas-filter-search"
        label={t('settings.certificates.search')}
        placeholder={t('settings.certificates.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      <FilterSelect
        id="trusted-cas-filter-status"
        label={t('settings.certificates.filters.status')}
        value={value.status}
        onChange={(status) =>
          onChange({ status: status as TrustedCasFilterState['status'], page: 1 })
        }
        options={[
          { value: 'all', label: t('settings.certificates.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="trusted-cas-filter-validity"
        label={t('settings.certificates.filters.validity')}
        value={value.validity}
        onChange={(validity) =>
          onChange({ validity: validity as TrustedCasFilterState['validity'], page: 1 })
        }
        options={[
          { value: 'all', label: t('settings.certificates.filters.allValidity') },
          { value: 'valid', label: t('settings.certificates.filters.validityOptions.valid') },
          { value: 'expired', label: t('settings.certificates.filters.validityOptions.expired') },
        ]}
      />

      <FilterSelect
        id="trusted-cas-filter-sort-by"
        label={t('settings.certificates.filters.sortBy')}
        value={value.sortBy}
        onChange={(sortBy) =>
          onChange({ sortBy: sortBy as TrustedCasFilterState['sortBy'], page: 1 })
        }
        options={TRUSTED_CA_SORT_OPTIONS.map((option) => ({
          value: option,
          label: t(`settings.certificates.filters.sortOptions.${option}`),
        }))}
      />

      <FilterSelect
        id="trusted-cas-filter-sort-order"
        label={t('settings.certificates.filters.sortOrder')}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({ sortOrder: sortOrder as TrustedCasFilterState['sortOrder'], page: 1 })
        }
        options={[
          { value: 'asc', label: t('settings.certificates.filters.ascending') },
          { value: 'desc', label: t('settings.certificates.filters.descending') },
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
          {t('settings.certificates.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
