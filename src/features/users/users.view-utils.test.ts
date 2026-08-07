import { describe, expect, it } from 'vitest';

import { DEFAULT_USERS_FILTERS } from '@/features/users/users.constants';
import type { UserListItem } from '@/features/users/users.types';
import {
  applyUsersFilters,
  paginateItems,
  parseUsersFiltersFromSearchParams,
  usersFiltersToSearchParams,
} from '@/features/users/users.view-utils';

function makeUser(overrides: Partial<UserListItem>): UserListItem {
  return {
    id: 'id',
    name: 'Name',
    username: 'username',
    email: 'email@example.com',
    active: true,
    firstLogin: false,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    role: { id: 'role-1', code: 'VIEWER', name: 'Viewer', level: 10 },
    ...overrides,
  };
}

const users: UserListItem[] = [
  makeUser({
    id: '1',
    name: 'Ada Lovelace',
    username: 'ada',
    email: 'ada@example.com',
    role: { id: 'r1', code: 'ADMIN', name: 'Administrator', level: 100 },
    active: true,
    firstLogin: false,
  }),
  makeUser({
    id: '2',
    name: 'Bob Smith',
    username: 'bob',
    email: 'bob@example.com',
    role: { id: 'r2', code: 'OPERATOR', name: 'Operator', level: 50 },
    active: false,
    firstLogin: true,
  }),
  makeUser({
    id: '3',
    name: 'Cara Diaz',
    username: 'cara',
    email: 'cara@example.com',
    role: { id: 'r3', code: 'VIEWER', name: 'Viewer', level: 10 },
    active: true,
    firstLogin: true,
  }),
];

describe('parseUsersFiltersFromSearchParams', () => {
  it('falls back to defaults for an empty query string', () => {
    expect(parseUsersFiltersFromSearchParams(new URLSearchParams(''))).toEqual(
      DEFAULT_USERS_FILTERS,
    );
  });

  it('parses valid values from the query string', () => {
    const params = new URLSearchParams(
      'search=ada&role=ADMIN&status=active&firstLogin=pending&page=2',
    );
    expect(parseUsersFiltersFromSearchParams(params)).toEqual({
      search: 'ada',
      role: 'ADMIN',
      status: 'active',
      firstLogin: 'pending',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 2,
    });
  });

  it('ignores invalid enum values and falls back to defaults', () => {
    const params = new URLSearchParams('role=NOT_A_ROLE&status=whatever&page=-3');
    const result = parseUsersFiltersFromSearchParams(params);
    expect(result.role).toBe('all');
    expect(result.status).toBe('all');
    expect(result.page).toBe(1);
  });
});

describe('usersFiltersToSearchParams', () => {
  it('omits keys that match the default filters', () => {
    const params = usersFiltersToSearchParams(DEFAULT_USERS_FILTERS);
    expect(params.toString()).toBe('');
  });

  it('serializes only the fields that differ from the default', () => {
    const params = usersFiltersToSearchParams({
      ...DEFAULT_USERS_FILTERS,
      search: 'ada',
      role: 'ADMIN',
      page: 2,
    });
    expect(params.get('search')).toBe('ada');
    expect(params.get('role')).toBe('ADMIN');
    expect(params.get('page')).toBe('2');
    expect(params.has('status')).toBe(false);
  });
});

describe('applyUsersFilters', () => {
  it('filters by search across name, username and email', () => {
    expect(applyUsersFilters(users, { ...DEFAULT_USERS_FILTERS, search: 'bob' })).toHaveLength(1);
    expect(
      applyUsersFilters(users, { ...DEFAULT_USERS_FILTERS, search: 'example.com' }),
    ).toHaveLength(3);
  });

  it('filters by role', () => {
    const result = applyUsersFilters(users, { ...DEFAULT_USERS_FILTERS, role: 'OPERATOR' });
    expect(result.map((user) => user.id)).toEqual(['2']);
  });

  it('filters by active status', () => {
    expect(
      applyUsersFilters(users, { ...DEFAULT_USERS_FILTERS, status: 'inactive' }).map((u) => u.id),
    ).toEqual(['2']);
    expect(
      applyUsersFilters(users, { ...DEFAULT_USERS_FILTERS, status: 'active' }).map((u) => u.id),
    ).toEqual(['1', '3']);
  });

  it('filters by first-login state', () => {
    expect(
      applyUsersFilters(users, { ...DEFAULT_USERS_FILTERS, firstLogin: 'pending' }).map(
        (u) => u.id,
      ),
    ).toEqual(['2', '3']);
  });

  it('sorts by name ascending', () => {
    const result = applyUsersFilters(users, {
      ...DEFAULT_USERS_FILTERS,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(result.map((user) => user.name)).toEqual(['Ada Lovelace', 'Bob Smith', 'Cara Diaz']);
  });
});

describe('paginateItems', () => {
  it('slices the given page', () => {
    const items = [1, 2, 3, 4, 5];
    expect(paginateItems(items, 1, 2)).toEqual([1, 2]);
    expect(paginateItems(items, 2, 2)).toEqual([3, 4]);
    expect(paginateItems(items, 3, 2)).toEqual([5]);
  });
});
