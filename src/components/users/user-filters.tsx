import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/shared/filter-select';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { ROLE_CODES } from '@/features/users/users.constants';
import type { UsersViewFilters } from '@/features/users/users.types';

interface UserFiltersProps {
  value: UsersViewFilters;
  onChange: (patch: Partial<UsersViewFilters>) => void;
  onClear: () => void;
}

export function UserFilters({ value, onChange, onClear }: UserFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    value.search !== '' ||
    value.role !== 'all' ||
    value.status !== 'all' ||
    value.firstLogin !== 'all';

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
      <SearchInput
        id="users-filter-search"
        label={t('users.search')}
        placeholder={t('users.search')}
        value={value.search}
        onChange={(search) => onChange({ search, page: 1 })}
      />

      <FilterSelect
        id="users-filter-role"
        label={t('users.filters.role')}
        value={value.role}
        onChange={(role) => onChange({ role: role as UsersViewFilters['role'], page: 1 })}
        options={[
          { value: 'all', label: t('users.filters.allRoles') },
          ...ROLE_CODES.map((code) => ({ value: code, label: t(`auth.roles.${code}`) })),
        ]}
      />

      <FilterSelect
        id="users-filter-status"
        label={t('users.filters.status')}
        value={value.status}
        onChange={(status) => onChange({ status: status as UsersViewFilters['status'], page: 1 })}
        options={[
          { value: 'all', label: t('users.filters.allStatuses') },
          { value: 'active', label: t('shared.status.active') },
          { value: 'inactive', label: t('shared.status.inactive') },
        ]}
      />

      <FilterSelect
        id="users-filter-first-login"
        label={t('users.filters.firstLogin')}
        value={value.firstLogin}
        onChange={(firstLogin) =>
          onChange({ firstLogin: firstLogin as UsersViewFilters['firstLogin'], page: 1 })
        }
        options={[
          { value: 'all', label: t('users.filters.allFirstLogin') },
          { value: 'pending', label: t('users.table.pending') },
          { value: 'completed', label: t('users.table.completed') },
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
          {t('users.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
