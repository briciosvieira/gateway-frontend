import { useTranslation } from 'react-i18next';

import { CollapsibleFilterPanel } from '@/components/shared/collapsible-filter-panel';
import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUDIT_LOG_ACTIONS, AUDIT_LOG_ENTITIES } from '@/features/audit-logs/audit-logs.constants';
import type { AuditLogsFilterState } from '@/features/audit-logs/audit-logs.types';

interface AuditLogFiltersProps {
  value: AuditLogsFilterState;
  dateRangeError: string | null;
  onChange: (patch: Partial<AuditLogsFilterState>) => void;
  onClear: () => void;
}

export function AuditLogFilters({
  value,
  dateRangeError,
  onChange,
  onClear,
}: AuditLogFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.action !== 'all' ||
    value.entity !== 'all' ||
    value.startDate !== '' ||
    value.endDate !== '';

  return (
    <CollapsibleFilterPanel
      gridClassName="md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      hasActiveFilters={hasActiveFilters}
      defaultExpanded={Boolean(dateRangeError)}
      searchSlot={
        <SearchInput
          id="audit-logs-filter-search"
          label={t('auditLogs.filters.search')}
          placeholder={t('auditLogs.filters.searchPlaceholder')}
          value={value.search}
          onChange={(search) => onChange({ search, page: 1 })}
        />
      }
    >
      <FilterSelect
        id="audit-logs-filter-action"
        label={t('auditLogs.filters.action')}
        value={value.action}
        onChange={(action) =>
          onChange({
            action: action as AuditLogsFilterState['action'],
            page: 1,
          })
        }
        options={[
          { value: 'all', label: t('auditLogs.filters.allActions') },
          ...AUDIT_LOG_ACTIONS.map((action) => ({
            value: action,
            label: t(`auditLogs.actionsMap.${action}`),
          })),
        ]}
      />

      <FilterSelect
        id="audit-logs-filter-entity"
        label={t('auditLogs.filters.entity')}
        value={value.entity}
        onChange={(entity) =>
          onChange({
            entity: entity as AuditLogsFilterState['entity'],
            page: 1,
          })
        }
        options={[
          { value: 'all', label: t('auditLogs.filters.allEntities') },
          ...AUDIT_LOG_ENTITIES.map((entity) => ({
            value: entity,
            label: t(`auditLogs.entitiesMap.${entity}`),
          })),
        ]}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="audit-logs-filter-start-date" className="text-xs font-medium text-muted">
          {t('auditLogs.filters.startDate')}
        </label>
        <Input
          id="audit-logs-filter-start-date"
          type="date"
          value={value.startDate}
          onChange={(event) => onChange({ startDate: event.target.value, page: 1 })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="audit-logs-filter-end-date" className="text-xs font-medium text-muted">
          {t('auditLogs.filters.endDate')}
        </label>
        <Input
          id="audit-logs-filter-end-date"
          type="date"
          value={value.endDate}
          onChange={(event) => onChange({ endDate: event.target.value, page: 1 })}
        />
      </div>

      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onClear}
          disabled={!hasActiveFilters}
        >
          {t('auditLogs.filters.clear')}
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
