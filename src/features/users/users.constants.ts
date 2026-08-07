import type { RoleCode } from '@/features/auth/auth.types';
import type { UsersViewFilters } from '@/features/users/users.types';

export const ROLE_CODES: RoleCode[] = ['ADMIN', 'OPERATOR', 'VIEWER', 'AUDITOR'];

export const USERS_PAGE_SIZE = 10;

export const DEFAULT_USERS_FILTERS: UsersViewFilters = {
  search: '',
  role: 'all',
  status: 'all',
  firstLogin: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
};
