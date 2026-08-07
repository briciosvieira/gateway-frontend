import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';

export interface ClientResourceSummaryFilterValue<TSortBy extends string> {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: TSortBy;
  sortOrder: 'asc' | 'desc';
  page: number;
}

interface SortOption<TSortBy extends string> {
  value: TSortBy;
  label: string;
}

interface ClientResourceSummaryFiltersLabels {
  searchPlaceholder: string;
  status: string;
  allStatuses: string;
  active: string;
  inactive: string;
  sortBy: string;
  sortOrder: string;
  ascending: string;
  descending: string;
  clear: string;
}

interface ClientResourceSummaryFiltersProps<TSortBy extends string> {
  value: ClientResourceSummaryFilterValue<TSortBy>;
  onChange: (patch: Partial<ClientResourceSummaryFilterValue<TSortBy>>) => void;
  onClear: () => void;
  defaultValue: ClientResourceSummaryFilterValue<TSortBy>;
  sortOptions: SortOption<TSortBy>[];
  labels: ClientResourceSummaryFiltersLabels;
}

/**
 * Shared filter bar for the API Keys / Allowed IPs / Gateway Routes main
 * (clients-summary) views. Wraps the real summary query params
 * (`search`/`status`/`sortBy`/`sortOrder`) — `sortBy`'s options differ per
 * feature (API Keys adds `revoked`), so they're passed in rather than
 * hardcoded here. All strings are pre-translated by the caller so this
 * component stays feature-agnostic.
 */
export function ClientResourceSummaryFilters<TSortBy extends string>({
  value,
  onChange,
  onClear,
  defaultValue,
  sortOptions,
  labels,
}: ClientResourceSummaryFiltersProps<TSortBy>) {
  const hasActiveFilters =
    value.search !== defaultValue.search ||
    value.status !== defaultValue.status ||
    value.sortBy !== defaultValue.sortBy ||
    value.sortOrder !== defaultValue.sortOrder;

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
      <SearchInput
        id="client-resource-summary-search"
        label={labels.searchPlaceholder}
        placeholder={labels.searchPlaceholder}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      <FilterSelect
        id="client-resource-summary-status"
        label={labels.status}
        value={value.status}
        onChange={(status) =>
          onChange({
            status: status as ClientResourceSummaryFilterValue<TSortBy>['status'],
            page: 1,
          })
        }
        options={[
          { value: 'all', label: labels.allStatuses },
          { value: 'active', label: labels.active },
          { value: 'inactive', label: labels.inactive },
        ]}
      />

      <FilterSelect
        id="client-resource-summary-sort-by"
        label={labels.sortBy}
        value={value.sortBy}
        onChange={(sortBy) => onChange({ sortBy: sortBy as TSortBy, page: 1 })}
        options={sortOptions}
      />

      <FilterSelect
        id="client-resource-summary-sort-order"
        label={labels.sortOrder}
        value={value.sortOrder}
        onChange={(sortOrder) =>
          onChange({
            sortOrder: sortOrder as ClientResourceSummaryFilterValue<TSortBy>['sortOrder'],
            page: 1,
          })
        }
        options={[
          { value: 'asc', label: labels.ascending },
          { value: 'desc', label: labels.descending },
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
          {labels.clear}
        </Button>
      </div>
    </div>
  );
}
