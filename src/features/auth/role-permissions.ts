import type { RoleCode } from '@/features/auth/auth.types';

/**
 * GET /auth/permissions does not exist on the backend (confirmed: 404, and
 * absent from the auth controller's source). Permissions are therefore
 * derived client-side from the user's role code as a placeholder — this is
 * NOT a security boundary, only a convenience to decide what to show in the
 * UI. The backend's own guards (JwtAuthGuard, RolesGuard) remain the sole
 * authority; every protected endpoint enforces its own role checks
 * server-side regardless of what this map allows. Replace this with a real
 * GET /auth/permissions integration if the backend ever adds one.
 *
 * `users.*` mirrors `UsersController`'s class-level
 * `@Roles(ADMIN, OPERATOR)` (confirmed against backend source) — VIEWER and
 * AUDITOR get a 403 on every `/users` endpoint, including list, so they
 * deliberately have no `users.*` entries here. OPERATOR's per-target
 * restrictions (cannot manage ADMIN users, cannot self-demote/deactivate,
 * cannot leave zero active admins) are enforced by the backend and are too
 * fine-grained for this role-level map — see
 * `src/features/users/users.permissions.ts` for the row-level UI hints and
 * the "not a security boundary" note above.
 *
 * `clients.*` mirrors `ClientsController` (confirmed against backend
 * source): the class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)`
 * covers `GET /clients` and `GET /clients/:id` — all four roles can read.
 * `POST /clients`, `PATCH /clients/:id` and `PATCH /clients/:id/status`
 * each carry a method-level `@Roles(ADMIN, OPERATOR)` override, so only
 * those two roles get `clients.create`/`clients.update`/`clients.status`.
 *
 * `apiKeys.*` mirrors `ApiKeysController` the same way as `clients.*`:
 * class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)` covers `GET
 * /api-keys` and `GET /api-keys/:id` (all four roles read); `POST
 * /api-keys`, `PATCH /api-keys/:id`, `PATCH /api-keys/:id/status`, `POST
 * /api-keys/:id/revoke` and `POST /api-keys/:id/regenerate` each carry a
 * method-level `@Roles(ADMIN, OPERATOR)` override.
 *
 * `allowedIps.*` mirrors `AllowedIpsController` the same way as
 * `clients.*`/`apiKeys.*`: class-level `@Roles(ADMIN, OPERATOR, VIEWER,
 * AUDITOR)` covers `GET /allowed-ips` and `GET /allowed-ips/:id` (all four
 * roles read); `POST /allowed-ips`, `PATCH /allowed-ips/:id` and `PATCH
 * /allowed-ips/:id/status` each carry a method-level `@Roles(ADMIN,
 * OPERATOR)` override.
 *
 * `{module}.delete` (users/clients/apiKeys/allowedIps) intentionally has NO
 * entry in OPERATOR's array: every `DELETE /:id` on these controllers
 * carries a method-level `@Roles(ADMIN)` override (confirmed against
 * backend source), unlike every other write operation above which is
 * ADMIN+OPERATOR. ADMIN gets it implicitly via the `'*'` wildcard; do not
 * add `*.delete` to OPERATOR.
 *
 * `gatewayRoutes.*` mirrors `GatewayRoutesController` (confirmed against
 * backend source): class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)`
 * covers `GET /gateway-routes` and `GET /gateway-routes/:id` — **all four
 * roles read**, including AUDITOR. `POST /gateway-routes`, `PATCH
 * /gateway-routes/:id` and `PATCH /gateway-routes/:id/status` carry a
 * method-level `@Roles(ADMIN, OPERATOR)` override. `DELETE
 * /gateway-routes/:id` is `@Roles(ADMIN)` only, same as every other
 * `*.delete` above — not added to OPERATOR.
 *
 * `routeHeaders.*` mirrors `RouteHeadersController` the same way as
 * `gatewayRoutes.*`: class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)`
 * covers `GET /route-headers` and `GET /route-headers/:id` (all four roles
 * read); `POST /route-headers`, `PATCH /route-headers/:id` and `PATCH
 * /route-headers/:id/status` are ADMIN+OPERATOR only; `DELETE
 * /route-headers/:id` is ADMIN only.
 *
 * `auditLogs.read` mirrors `AuditLogsController` (confirmed against backend
 * source): class-level `@Roles(ADMIN, AUDITOR, OPERATOR)` covers both
 * `GET /audit-logs` and `GET /audit-logs/:id`. VIEWER is intentionally
 * excluded and gets a 403 on the whole module.
 *
 * `requestLogs.read` mirrors `RequestLogsController` the same way:
 * class-level `@Roles(ADMIN, AUDITOR, OPERATOR)` covers `GET
 * /request-logs`, `GET /request-logs/:id` and `GET
 * /request-logs/by-request-id/:requestId`. VIEWER is intentionally
 * excluded and gets a 403 on the whole module.
 *
 * `settings.read` / `trustedCas.*` — the Configurações area (Trusted CAs)
 * mirrors `TrustedCasController`'s class-level `@Roles(ADMIN)` — **ADMIN
 * only, no exceptions**: unlike every other module above, OPERATOR/VIEWER/
 * AUDITOR get a 403 on every single trusted-cas endpoint including `GET`.
 * `settings.read` gates the whole `/settings/*` area (nav item + route);
 * `trustedCas.create`/`trustedCas.status`/`trustedCas.delete` gate the
 * per-action UI within it. All are granted to ADMIN only via the `'*'`
 * wildcard — deliberately absent from every other role's array.
 *
 * `branding.update` — the Personalização page (`/settings/personalization`,
 * added alongside Certificados) mirrors `BrandingAdminController`'s
 * `@ApiBearerAuth` write endpoints (name/logo/favicon/brand-image
 * upload+remove) — **ADMIN only, no exceptions**, same pattern as
 * `trustedCas.*` above. The page itself is already gated by `settings.read`
 * (ADMIN-only wildcard), so `branding.update` only needs to gate the
 * write-action UI (form submit, upload/remove buttons) within it; there is
 * no `branding.read` — the underlying `GET /branding` is a public,
 * unauthenticated endpoint by design (Sidebar/Home/Login need it before
 * login), so read access is never permission-gated on the frontend.
 */
export const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  ADMIN: ['*'],
  OPERATOR: [
    'dashboard.read',
    'clients.read',
    'clients.create',
    'clients.update',
    'clients.status',
    'apiKeys.read',
    'apiKeys.create',
    'apiKeys.update',
    'apiKeys.status',
    'apiKeys.revoke',
    'apiKeys.regenerate',
    'allowedIps.read',
    'allowedIps.create',
    'allowedIps.update',
    'allowedIps.status',
    'gatewayRoutes.read',
    'gatewayRoutes.create',
    'gatewayRoutes.update',
    'gatewayRoutes.status',
    'routeHeaders.read',
    'routeHeaders.create',
    'routeHeaders.update',
    'routeHeaders.status',
    'auditLogs.read',
    'requestLogs.read',
    'users.read',
    'users.create',
    'users.update',
    'users.status',
    'users.role',
    'users.resetPassword',
    'users.passwordRequirement',
  ],
  VIEWER: [
    'dashboard.read',
    'clients.read',
    'apiKeys.read',
    'allowedIps.read',
    'gatewayRoutes.read',
    'routeHeaders.read',
  ],
  AUDITOR: [
    'dashboard.read',
    'clients.read',
    'apiKeys.read',
    'allowedIps.read',
    'gatewayRoutes.read',
    'routeHeaders.read',
    'auditLogs.read',
    'requestLogs.read',
  ],
};

export function getPermissionsForRole(role: RoleCode): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: RoleCode, permission: string): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes('*') || permissions.includes(permission);
}
