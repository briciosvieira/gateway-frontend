import type { RoleCode } from '@/features/auth/auth.types';
import { DEFAULT_USERS_FILTERS, ROLE_CODES } from '@/features/users/users.constants';
import type {
  UserFirstLoginFilter,
  UserListItem,
  UserSortBy,
  UserStatusFilter,
  UsersViewFilters,
} from '@/features/users/users.types';

const SORT_BY_VALUES: UserSortBy[] = ['name', 'username', 'email', 'createdAt', 'lastLoginAt'];
const STATUS_VALUES: UserStatusFilter[] = ['all', 'active', 'inactive'];
const FIRST_LOGIN_VALUES: UserFirstLoginFilter[] = ['all', 'pending', 'completed'];

/**
 * `GET /users` has no query params (see users.types.ts) — filters/sort/page
 * are pure client-side view state, kept in the URL only for shareable/
 * bookmarkable links, never sent to the backend.
 */
export function parseUsersFiltersFromSearchParams(params: URLSearchParams): UsersViewFilters {
  const role = params.get('role');
  const status = params.get('status');
  const firstLogin = params.get('firstLogin');
  const sortBy = params.get('sortBy');
  const sortOrder = params.get('sortOrder');
  const page = Number(params.get('page'));

  return {
    search: params.get('search') ?? DEFAULT_USERS_FILTERS.search,
    role: role && ROLE_CODES.includes(role as RoleCode) ? (role as RoleCode) : 'all',
    status: STATUS_VALUES.includes(status as UserStatusFilter)
      ? (status as UserStatusFilter)
      : 'all',
    firstLogin: FIRST_LOGIN_VALUES.includes(firstLogin as UserFirstLoginFilter)
      ? (firstLogin as UserFirstLoginFilter)
      : 'all',
    sortBy: SORT_BY_VALUES.includes(sortBy as UserSortBy)
      ? (sortBy as UserSortBy)
      : DEFAULT_USERS_FILTERS.sortBy,
    sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function usersFiltersToSearchParams(filters: UsersViewFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.role !== 'all') params.set('role', filters.role);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.firstLogin !== 'all') params.set('firstLogin', filters.firstLogin);
  if (filters.sortBy !== DEFAULT_USERS_FILTERS.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder !== DEFAULT_USERS_FILTERS.sortOrder) {
    params.set('sortOrder', filters.sortOrder);
  }
  if (filters.page > 1) params.set('page', String(filters.page));

  return params;
}

function sortableValue(user: UserListItem, sortBy: UserSortBy): string {
  if (sortBy === 'lastLoginAt') return user.lastLoginAt ?? '';
  return String(user[sortBy]).toLowerCase();
}

export function applyUsersFilters(
  users: UserListItem[],
  filters: UsersViewFilters,
): UserListItem[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = users.filter((user) => {
    if (search) {
      const haystack = `${user.name} ${user.username} ${user.email}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.role !== 'all' && user.role.code !== filters.role) return false;
    if (filters.status === 'active' && !user.active) return false;
    if (filters.status === 'inactive' && user.active) return false;
    if (filters.firstLogin === 'pending' && !user.firstLogin) return false;
    if (filters.firstLogin === 'completed' && user.firstLogin) return false;
    return true;
  });

  const direction = filters.sortOrder === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    const aValue = sortableValue(a, filters.sortBy);
    const bValue = sortableValue(b, filters.sortBy);
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    return 0;
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
