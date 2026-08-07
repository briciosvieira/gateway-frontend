import { describe, expect, it } from 'vitest';

import { getPermissionsForRole, roleHasPermission } from '@/features/auth/role-permissions';

describe('getPermissionsForRole', () => {
  it('grants ADMIN a wildcard permission', () => {
    expect(getPermissionsForRole('ADMIN')).toEqual(['*']);
  });

  it('grants AUDITOR access to audit and request logs', () => {
    const permissions = getPermissionsForRole('AUDITOR');
    expect(permissions).toContain('auditLogs.read');
    expect(permissions).toContain('requestLogs.read');
  });
});

describe('roleHasPermission', () => {
  it('lets ADMIN through any permission via the wildcard', () => {
    expect(roleHasPermission('ADMIN', 'anything.read')).toBe(true);
  });

  it('grants VIEWER a permission it holds', () => {
    expect(roleHasPermission('VIEWER', 'dashboard.read')).toBe(true);
  });

  it('denies VIEWER a permission it does not hold', () => {
    expect(roleHasPermission('VIEWER', 'auditLogs.read')).toBe(false);
  });

  it('grants OPERATOR a permission it holds for Audit Logs reads', () => {
    expect(roleHasPermission('OPERATOR', 'auditLogs.read')).toBe(true);
  });

  it('grants AUDITOR a permission it now holds for Route Headers reads', () => {
    expect(roleHasPermission('AUDITOR', 'routeHeaders.read')).toBe(true);
  });

  it('grants OPERATOR every users.* permission (mirrors UsersController @Roles(ADMIN, OPERATOR))', () => {
    for (const permission of [
      'users.read',
      'users.create',
      'users.update',
      'users.status',
      'users.role',
      'users.resetPassword',
      'users.passwordRequirement',
    ]) {
      expect(roleHasPermission('OPERATOR', permission)).toBe(true);
    }
  });

  it('denies VIEWER and AUDITOR every users.* permission (they get a 403 on the whole module)', () => {
    for (const role of ['VIEWER', 'AUDITOR'] as const) {
      expect(roleHasPermission(role, 'users.read')).toBe(false);
      expect(roleHasPermission(role, 'users.create')).toBe(false);
    }
  });

  it('grants clients.read to all four roles (mirrors ClientsController class-level @Roles)', () => {
    for (const role of ['ADMIN', 'OPERATOR', 'VIEWER', 'AUDITOR'] as const) {
      expect(roleHasPermission(role, 'clients.read')).toBe(true);
    }
  });

  it('grants clients.create/update/status only to ADMIN and OPERATOR (method-level @Roles override)', () => {
    for (const permission of ['clients.create', 'clients.update', 'clients.status']) {
      expect(roleHasPermission('OPERATOR', permission)).toBe(true);
      expect(roleHasPermission('VIEWER', permission)).toBe(false);
      expect(roleHasPermission('AUDITOR', permission)).toBe(false);
    }
  });

  it('grants apiKeys.read to all four roles (mirrors ApiKeysController class-level @Roles)', () => {
    for (const role of ['ADMIN', 'OPERATOR', 'VIEWER', 'AUDITOR'] as const) {
      expect(roleHasPermission(role, 'apiKeys.read')).toBe(true);
    }
  });

  it('grants apiKeys write permissions only to ADMIN and OPERATOR (method-level @Roles override)', () => {
    for (const permission of [
      'apiKeys.create',
      'apiKeys.update',
      'apiKeys.status',
      'apiKeys.revoke',
      'apiKeys.regenerate',
    ]) {
      expect(roleHasPermission('OPERATOR', permission)).toBe(true);
      expect(roleHasPermission('VIEWER', permission)).toBe(false);
      expect(roleHasPermission('AUDITOR', permission)).toBe(false);
    }
  });

  it('grants allowedIps.read to all four roles (mirrors AllowedIpsController class-level @Roles)', () => {
    for (const role of ['ADMIN', 'OPERATOR', 'VIEWER', 'AUDITOR'] as const) {
      expect(roleHasPermission(role, 'allowedIps.read')).toBe(true);
    }
  });

  it('grants allowedIps write permissions only to ADMIN and OPERATOR (method-level @Roles override)', () => {
    for (const permission of ['allowedIps.create', 'allowedIps.update', 'allowedIps.status']) {
      expect(roleHasPermission('OPERATOR', permission)).toBe(true);
      expect(roleHasPermission('VIEWER', permission)).toBe(false);
      expect(roleHasPermission('AUDITOR', permission)).toBe(false);
    }
  });

  it('grants *.delete only to ADMIN — every DELETE endpoint is @Roles(ADMIN) only, unlike other writes', () => {
    for (const permission of [
      'users.delete',
      'clients.delete',
      'apiKeys.delete',
      'allowedIps.delete',
    ]) {
      expect(roleHasPermission('ADMIN', permission)).toBe(true);
      expect(roleHasPermission('OPERATOR', permission)).toBe(false);
      expect(roleHasPermission('VIEWER', permission)).toBe(false);
      expect(roleHasPermission('AUDITOR', permission)).toBe(false);
    }
  });

  it('grants gatewayRoutes.read to all four roles, including AUDITOR (mirrors GatewayRoutesController class-level @Roles)', () => {
    for (const role of ['ADMIN', 'OPERATOR', 'VIEWER', 'AUDITOR'] as const) {
      expect(roleHasPermission(role, 'gatewayRoutes.read')).toBe(true);
    }
  });

  it('grants gatewayRoutes write permissions only to ADMIN and OPERATOR (method-level @Roles override)', () => {
    for (const permission of [
      'gatewayRoutes.create',
      'gatewayRoutes.update',
      'gatewayRoutes.status',
    ]) {
      expect(roleHasPermission('OPERATOR', permission)).toBe(true);
      expect(roleHasPermission('VIEWER', permission)).toBe(false);
      expect(roleHasPermission('AUDITOR', permission)).toBe(false);
    }
  });

  it('grants gatewayRoutes.delete only to ADMIN, same as every other *.delete permission', () => {
    expect(roleHasPermission('ADMIN', 'gatewayRoutes.delete')).toBe(true);
    expect(roleHasPermission('OPERATOR', 'gatewayRoutes.delete')).toBe(false);
    expect(roleHasPermission('VIEWER', 'gatewayRoutes.delete')).toBe(false);
    expect(roleHasPermission('AUDITOR', 'gatewayRoutes.delete')).toBe(false);
  });

  it('grants routeHeaders.read to all four roles (mirrors RouteHeadersController class-level @Roles)', () => {
    for (const role of ['ADMIN', 'OPERATOR', 'VIEWER', 'AUDITOR'] as const) {
      expect(roleHasPermission(role, 'routeHeaders.read')).toBe(true);
    }
  });

  it('grants routeHeaders write permissions only to ADMIN and OPERATOR (method-level @Roles override)', () => {
    for (const permission of [
      'routeHeaders.create',
      'routeHeaders.update',
      'routeHeaders.status',
    ]) {
      expect(roleHasPermission('OPERATOR', permission)).toBe(true);
      expect(roleHasPermission('VIEWER', permission)).toBe(false);
      expect(roleHasPermission('AUDITOR', permission)).toBe(false);
    }
  });

  it('grants routeHeaders.delete only to ADMIN, same as every other *.delete permission', () => {
    expect(roleHasPermission('ADMIN', 'routeHeaders.delete')).toBe(true);
    expect(roleHasPermission('OPERATOR', 'routeHeaders.delete')).toBe(false);
    expect(roleHasPermission('VIEWER', 'routeHeaders.delete')).toBe(false);
    expect(roleHasPermission('AUDITOR', 'routeHeaders.delete')).toBe(false);
  });

  it('grants auditLogs.read only to ADMIN, OPERATOR and AUDITOR (VIEWER is excluded by the real controller)', () => {
    expect(roleHasPermission('ADMIN', 'auditLogs.read')).toBe(true);
    expect(roleHasPermission('OPERATOR', 'auditLogs.read')).toBe(true);
    expect(roleHasPermission('AUDITOR', 'auditLogs.read')).toBe(true);
    expect(roleHasPermission('VIEWER', 'auditLogs.read')).toBe(false);
  });

  it('grants requestLogs.read only to ADMIN, OPERATOR and AUDITOR (VIEWER is excluded by the real controller)', () => {
    expect(roleHasPermission('ADMIN', 'requestLogs.read')).toBe(true);
    expect(roleHasPermission('OPERATOR', 'requestLogs.read')).toBe(true);
    expect(roleHasPermission('AUDITOR', 'requestLogs.read')).toBe(true);
    expect(roleHasPermission('VIEWER', 'requestLogs.read')).toBe(false);
  });

  it('grants branding.update only to ADMIN, same ADMIN-only-no-exceptions pattern as trustedCas.*', () => {
    expect(roleHasPermission('ADMIN', 'branding.update')).toBe(true);
    expect(roleHasPermission('OPERATOR', 'branding.update')).toBe(false);
    expect(roleHasPermission('VIEWER', 'branding.update')).toBe(false);
    expect(roleHasPermission('AUDITOR', 'branding.update')).toBe(false);
  });
});
