# Backend Contracts

## Auth (registered 2026-08-07 — was missing despite being built in Etapa 4)

Source files:

- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/guards/first-login.guard.ts`
- `src/modules/auth/decorators/allow-first-login.decorator.ts`
- `src/modules/auth/dto/*`

### Endpoints

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/auth/login` | `@Public()` | Always 200 regardless of `firstLogin` — see below. Throttled 5/min. |
| `POST` | `/auth/refresh` | `@Public()` | Throttled 20/min. Rotates the refresh token (old one revoked). |
| `POST` | `/auth/logout` | `@Public()` | 204, idempotent even with an invalid/expired token. |
| `POST` | `/auth/change-password` | JWT + `@AllowFirstLogin()` | The ONLY non-public endpoint reachable by a first-login user before changing their password. |
| `GET` | `/auth/me` | JWT (no `@AllowFirstLogin()`) | **Blocked for first-login users** — see `FirstLoginGuard` below. |

### `POST /auth/login` response (`LoginResponse`)

```ts
{
  accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn,
  user: { name, username, email, role: RoleCode, firstLogin: boolean },
  mustChangePassword: boolean, // === user.firstLogin, redundant on purpose
}
```
Login succeeds (200) even when `firstLogin` is `true` — the backend does NOT reject the login attempt itself. `mustChangePassword`/`user.firstLogin` are the only signal; there is no separate "temporary password" flag or token type.

### `FirstLoginGuard` — the actual mechanism behind "troca obrigatória de senha"

Applied globally (alongside `JwtAuthGuard`/`RolesGuard`). For any authenticated, non-`@Public()` endpoint that is NOT also decorated `@AllowFirstLogin()`, if the JWT payload's `firstLogin` is `true`, the guard throws:

```ts
403 ForbiddenException({
  message: 'Password change is required before accessing this resource.',
  code: 'PASSWORD_CHANGE_REQUIRED',
})
```

which the global `HttpExceptionFilter` turns into the standard error envelope with `statusCode: 403` and `code: 'PASSWORD_CHANGE_REQUIRED'` at the top level (confirmed by reading the filter — it forwards `exception.getResponse().code` verbatim).

**Critically: `GET /auth/me` is NOT marked `@AllowFirstLogin()`.** So a first-login user's access token, right after a successful login, will ALWAYS get a 403 `PASSWORD_CHANGE_REQUIRED` from `/auth/me` — there is no way to fetch the full `AuthenticatedUser` profile before the password is changed. The frontend must treat the `LoginResponse`'s thin `user`/`mustChangePassword` fields as authoritative for this window, and only call `GET /auth/me` again after `POST /auth/change-password` succeeds.

`POST /auth/change-password` transactionally sets `firstLogin: false` and revokes all the user's existing refresh tokens (not the current access token). Confirmed by reading `JwtAuthGuard` (`src/modules/auth/guards/jwt-auth.guard.ts`): it does NOT trust the JWT payload's claims for authorization data — it only uses the JWT to get `payload.sub` (user id), then re-queries `prisma.user.findUnique(...)` for `firstLogin`/`role`/`active` on every single request. So the SAME still-valid access token immediately passes `FirstLoginGuard` on the very next request after `change-password` succeeds, since the guard sees the freshly-queried `firstLogin: false`. No token refresh or re-login is needed between changing the password and `reloadUser()`'s `GET /auth/me` call succeeding.

### `ChangePasswordDto` (`newPassword`)

Mirrored client-side in `auth.schemas.ts`: min 12, max 100 chars, at least one uppercase/lowercase/digit/special character. New password must differ from current — backend rejects an identical new password with `401 UnauthorizedException('The new password must be different from the current password.')` (yes, 401, not 400 — pre-existing backend quirk, not something the frontend should try to "fix" by remapping, since a real 401 IS the correct code for "the credential you provided fails a password-policy re-check" is technically debatable, but out of scope — see `resolveChangePasswordErrorKey` in `change-password-page.tsx`, which maps any 401 there to a generic "check your current password" message; this is slightly imprecise for the same-password case specifically but not the reported bug and left as-is).

### Frontend decisions (first-login fix, 2026-08-07)

- `src/features/auth/auth-errors.ts` — `isPasswordChangeRequiredError(error)` checks `statusCode === 403 && code === 'PASSWORD_CHANGE_REQUIRED'` specifically; nothing else is treated this way.
- `AuthContext.login()`: if `response.mustChangePassword` is true, skips calling `GET /auth/me` entirely (it would always 403) — sets `mustChangePassword = true` directly from the login response and leaves `user` as `null` until the password is actually changed.
- `AuthContext`'s `isAuthenticated` is now `user !== null || mustChangePassword` — a first-login user has a valid session (tokens exist, routing must treat them as logged in) before `user` can ever be populated.
- `AuthContext.initialize()` (page load with stored tokens) and `refreshSession()`: both now catch `isPasswordChangeRequiredError` specifically and set `mustChangePassword = true` WITHOUT clearing the session — previously ANY error from `loadUser()` cleared tokens and logged the user out, which silently broke "refresh the /change-password page as a first-login user" (they'd get bounced to `/login` with no error shown).
- `login-page.tsx`'s `resolveLoginErrorKey` no longer needs (or gets) a `PASSWORD_CHANGE_REQUIRED` branch — it can't reach the login form as an error anymore. Also fixed a real (if minor) pre-existing gap while touching this function: 5xx responses were falling into the generic "network error" bucket instead of `api.errors.server`; default fallback (unmapped codes) now goes to `api.errors.unknown` instead of also being mislabeled as a network error.
- `ChangePasswordPage`/`useChangePassword` needed NO changes — `reloadUser()` after a successful change already calls `GET /auth/me` again, which now succeeds (no more `FirstLoginGuard` block) and correctly flips `mustChangePassword` back to `false`.

## API Keys

Last verified: 2026-08-07 (backend source, filling in a previously-empty template — no divergence found from the frontend's existing `api-keys.types.ts`/`.service.ts`).

Source files:

- `src/modules/api-keys/api-keys.controller.ts`
- `src/modules/api-keys/api-keys.service.ts`
- `src/modules/api-keys/dto/*`
- `prisma/schema.prisma`

### Endpoints

Class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)` — all four roles read.

| Method | Path | Roles | Notes |
|---|---|---|---|
| `POST` | `/api-keys` | ADMIN, OPERATOR | |
| `GET` | `/api-keys` | ADMIN, OPERATOR, VIEWER, AUDITOR | |
| `GET` | `/api-keys/:id` | ADMIN, OPERATOR, VIEWER, AUDITOR | |
| `PATCH` | `/api-keys/:id` | ADMIN, OPERATOR | `name`/`expiresAt` only |
| `PATCH` | `/api-keys/:id/status` | ADMIN, OPERATOR | |
| `POST` | `/api-keys/:id/revoke` | ADMIN, OPERATOR | 200, idempotent |
| `POST` | `/api-keys/:id/regenerate` | ADMIN, OPERATOR | 200, new secret |
| `DELETE` | `/api-keys/:id` | **ADMIN only** | 204; no dependency guard (`RequestLog.apiKey` is `onDelete: SetNull`) |

No aggregate/summary endpoint exists (e.g. no `GET /api-keys/clients-summary`) — see the "Missing: per-client aggregate endpoints" note below.

### DTOs

`FindApiKeysQueryDto`: `page` (default 1), `limit` (default 20, max 100), `search?` (matches `name`, `prefix`, `client.name`, `client.code`), `clientId?` (UUID), `prefix?` (partial match), `active?` (boolean, string-coerced), `expiresFrom?`/`expiresTo?` (ISO date, range filter on `expiresAt`), `sortBy?` — `'name' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'lastUsedAt'` (default `'createdAt'`), `sortOrder?` — `'asc' | 'desc'` (default `'desc'`). **No `revoked` boolean filter exists** — revocation is only exposed via the nullable `revokedAt` field on the response, not filterable server-side.

`CreateApiKeyDto`: `name` (2–150 chars, required), `clientId` (UUID, required), `expiresAt?` (ISO date, must be in the future).

`UpdateApiKeyDto`: `name?`, `expiresAt?` — same validation. `clientId` is not editable.

`ChangeApiKeyStatusDto`: `{ active: boolean }`.

`RegenerateApiKeyDto`: `{ revokePrevious?: boolean }` (default `true`).

### Responses

`apiKeySelect` (list/detail/update/status/revoke):
```ts
{
  id, clientId, name, prefix, active, expiresAt, lastUsedAt, revokedAt, createdAt, updatedAt,
  client: { id, name, code, active },
}
```

`POST /api-keys` (create) response `data`: `{ apiKey: ApiKey, key: string /* raw secret, shown once */, warning: string }`.

`POST /api-keys/:id/regenerate` response `data`: `{ apiKey: ApiKey /* new record */, key: string /* new raw secret */, previousApiKeyRevoked: boolean, warning: string }`.

`GET /api-keys` response `data`: `{ items: ApiKey[], pagination: { page, limit, total, totalPages }, filters: { search, clientId, prefix, active, expiresFrom, expiresTo, sortBy, sortOrder } }`.

### Business rules

- The raw key (`key`) is only ever returned once, on `create` and `regenerate` — every other response only has the non-secret `prefix`.
- `changeStatus` is idempotent (no-op if `active` already matches). Activating is blocked (400) if the key is revoked, expired, or the client is inactive.
- `revoke` is idempotent — re-revoking an already-revoked key returns the current record unchanged, no re-audit.
- `regenerate` creates a brand-new `ApiKey` row (new id/prefix/hash) carrying over `name`/`expiresAt`; by default also revokes the old key (`revokePrevious !== false`).
- `remove` (hard delete) has no dependency guard — `RequestLog.apiKey` is `onDelete: SetNull`, so historical logs survive with `apiKeyId` cleared.
- Client must exist and be active to create; reactivating via the status endpoint also requires the client to be active.

### Frontend decisions

- API Key belongs to Client.
- Complete public endpoint depends on Gateway Route.
- API Key creation modal shows the public Gateway base only.
- Full endpoint is shown in Gateway Routes.

## Missing: per-client aggregate endpoints for API Keys / Allowed IPs / Gateway Routes (2026-08-07, spec refined 2026-08-07)

Investigated for a "group the main list by client" frontend reorganization (API Keys, Allowed IPs, Gateway Routes). **Confirmed absent** — no scalable per-client aggregate/summary endpoint exists for any of the three modules:

- No `GET /api-keys/clients-summary`, `GET /allowed-ips/clients-summary`, `GET /gateway-routes/clients-summary` or equivalent — confirmed by reading all three controllers in full.
- `GET /clients` / `GET /clients/:id` (`clientSelect` in `clients.service.ts`) returns no `_count`/`apiKeysCount`/`allowedIpsCount`/`gatewayRoutesCount` — just `{id, name, code, description, contactName, contactEmail, active, createdAt, updatedAt}`.
- The only `_count`/`groupBy`/Prisma-aggregate usage anywhere in the backend is `dashboard.service.ts`, and every one of those aggregates operates on `RequestLog` (traffic stats) — never on API Keys/Allowed IPs/Gateway Routes counts per client.
- `DELETE /clients/:id`'s dependency check (`CLIENT_HAS_DEPENDENCIES`) does run three `prisma.*.count({ where: { clientId } })` calls, but that's a one-off, single-client check at delete time — not a reusable, paginated, multi-client summary endpoint.

**Current frontend state (implemented, 2026-08-07):** the three main pages (`api-keys-page.tsx`, `allowed-ips-page.tsx`, `gateway-routes-page.tsx`) list **every** client (via the real, paginated `GET /clients`), regardless of whether it has any resources, with no Total/Ativos/Inativos columns — the "Status" column shown there is currently `client.active` (the client's own status), not a resource-derived one. Selecting a client opens a `*ClientDrawer` that queries the real `GET /api-keys|allowed-ips|gateway-routes?clientId=<id>` — unchanged, already scalable, already paginated server-side. See "Frontend architecture" note in `.ai/FRONTEND_ARCHITECTURE.md`.

**Blocked refinement (2026-08-07):** product wants two changes to the main view that this data shape cannot support: (1) hide clients with zero resources for that feature, (2) show a resource-derived status (Ativo = ≥1 active resource; Inativo = has resources but none active; API Key `revokedAt` never counts as active) instead of `client.active`. Both changes together also require **exact server-side pagination** over the *filtered* set. This combination is mathematically impossible to do correctly from the frontend alone: the "has ≥1 resource" filter can only be applied to a client after querying its resources, but by then `GET /clients`'s pagination boundary has already been decided on the *unfiltered* set — the client that should fill a gap left by a filtered-out client lives on a different page and can't be pulled in without knowing the filter outcome first. Loading everything or querying per-client (N+1) were both explicitly ruled out as scale-breaking. **No frontend changes were made for this refinement; the client-list main view described above is the frontend's current end state until the endpoint below exists.**

### Endpoints needed (conceptual, NOT implemented — full spec for whoever picks up the backend task)

Paths (matching this backend's existing nested-action convention, e.g. `POST /api-keys/:id/revoke`):
```
GET /api-keys/clients-summary
GET /allowed-ips/clients-summary
GET /gateway-routes/clients-summary
```
**NestJS routing gotcha:** the `clients-summary` route handler must be declared *before* the `:id` handler in each controller class — NestJS matches routes in declaration order, so `:id` declared first would swallow `clients-summary` as a literal id and fail `ParseUUIDPipe` with a 400.

**Roles:** identical to each module's existing list endpoint — `ADMIN, OPERATOR, VIEWER, AUDITOR` for all three. No permission model changes.

**Query params (identical across all three — one shared DTO, e.g. `FindClientsSummaryQueryDto`):**
| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | `1` | |
| `limit` | int | `20` (max `100`) | |
| `search?` | string | — | matches `client.name`/`client.code`, same semantics as `GET /clients?search=` |
| `status?` | `'active' \| 'inactive'` | — | **aggregate** status: `active` = client has ≥1 active resource; `inactive` = client has resources but none active. Omitted = all clients with ≥1 resource |
| `sortBy?` | `'clientName' \| 'total' \| 'active'` | `'clientName'` | |
| `sortOrder?` | `'asc' \| 'desc'` | `'asc'` | |

No `clientId` param here — that stays exclusive to the existing per-resource list endpoints used by the Drawer.

**Response** (real envelope, `data`):
```ts
{
  items: ClientResourceSummary[],
  pagination: { page, limit, total, totalPages },
  filters: { search?, status?, sortBy, sortOrder },
}
```
`ClientResourceSummary` for API Keys:
```ts
{
  client: { id, name, code, active },
  total,    // count of all ApiKeys for the client
  active,   // active = true AND revokedAt IS NULL
  inactive, // active = false AND revokedAt IS NULL — never overlaps with revoked
  revoked,  // revokedAt IS NOT NULL
}
```
`total === active + inactive + revoked`. For Allowed IPs/Gateway Routes (no revoke concept): `{ client, total, active, inactive }` with `total === active + inactive`. **Only clients with `total >= 1` are ever returned** — this is what replaces "hide client with zero resources".

**Query strategy (conceptual):** Prisma's `groupBy` can't express conditional aggregation (active vs. revoked counts) joined with `Client` for search/sort in one call, so this needs a raw parametrized SQL query (`prisma.$queryRaw` tagged template) per endpoint: `JOIN Client → resource table`, `GROUP BY client.id`, conditional `COUNT(*) FILTER (WHERE ...)` (Postgres) for each bucket, `HAVING COUNT(resource.id) > 0` (plus the `status` filter's own `HAVING` condition when present) *before* `ORDER BY`/`LIMIT`/`OFFSET` — this is what keeps pagination exact against the already-filtered set. A second raw query (same `WHERE`/`HAVING`, wrapped in `SELECT COUNT(*) FROM (...) t`, no `LIMIT`/`OFFSET`) gives `pagination.total`. Same `Promise.all([dataQuery, countQuery])` shape already used everywhere else in this backend, just with raw SQL as the data query. **Always add a unique-column tiebreaker to `ORDER BY` (e.g. `client.id`)** — this is the exact non-deterministic-pagination bug already found and fixed once for Request Logs' `buildOrderBy` (see the "Backend fix — non-deterministic sort order" note above); the same fix must be built in from the start here.

**Indexes to confirm/add:** `clientId` on each resource table (likely already present, since `?clientId=` filtering already works); composite `(clientId, active, revokedAt)` for `ApiKey` and `(clientId, active)` for `AllowedIp`/`GatewayRoute` to keep the conditional aggregation index-backed; `Client(name)`/`Client(code)` for the `search` `ILIKE` (likely already present given `GET /clients?search=` already works).

**Full example SQL sketch, N+1/load-all/pagination-exactness reasoning, and the frontend consumption plan once this exists** are written out in detail in the session scratchpad spec — ask if you need the complete worked example reproduced here.

Once this endpoint exists: the three main pages swap `useClients(params)` for a new `use{Feature}ClientsSummary(params)` hook hitting it; `ClientResourceListTable` (already built, shared) takes `ClientResourceSummary[]` instead of `Client[]` and derives the Status badge from `row.active > 0` instead of `row.client.active`; the `status` filter sends `status=active|inactive` to the new endpoint instead of `active=true|false` to `GET /clients`. The Drawer and every one of its existing actions (create/edit/status/revoke/regenerate/delete) are untouched — they already query the real per-resource `?clientId=<id>` endpoints correctly.

## Allowed IPs

Last verified: 2026-08-06

Source files:

- `src/modules/allowed-ips/allowed-ips.controller.ts`
- `src/modules/allowed-ips/allowed-ips.service.ts`
- `src/modules/allowed-ips/dto/*`
- `src/modules/allowed-ips/utils/ip-address.util.ts`
- `prisma/schema.prisma`

### Endpoints

| Method | Path | Roles |
|---|---|---|
| `POST` | `/allowed-ips` | ADMIN, OPERATOR |
| `GET` | `/allowed-ips` | ADMIN, OPERATOR, VIEWER, AUDITOR |
| `GET` | `/allowed-ips/:id` | ADMIN, OPERATOR, VIEWER, AUDITOR |
| `PATCH` | `/allowed-ips/:id` | ADMIN, OPERATOR |
| `PATCH` | `/allowed-ips/:id/status` | ADMIN, OPERATOR |

No `DELETE` endpoint exists. Deactivation via `PATCH :id/status` is the only "removal" mechanism. `:id` must be a valid UUID (`ParseUUIDPipe`).

### DTOs

`GET /allowed-ips` query (`FindAllowedIpsQueryDto`):
- `page` (default `1`), `limit` (default `20`, max `100`)
- `search?` — matches `address`, `description`, `client.name`, `client.code`
- `clientId?` (UUID)
- `type?` — one of `IPV4`, `IPV6`, `CIDR_IPV4`, `CIDR_IPV6`
- `active?` (boolean)
- `sortBy?` — `'address' | 'createdAt' | 'updatedAt'` (default `'createdAt'`)
- `sortOrder?` — `'asc' | 'desc'` (default `'desc'`)
- No `status` string field, no `revoked` filter (this module has no revoke concept).

`POST /allowed-ips` (`CreateAllowedIpDto`):
- `address` (required, string, max 100) — **exact field name**, holds IP or CIDR, format not validated at DTO layer.
- `clientId` (required, UUID).
- `description?` (optional, string, max 500).

`PATCH /allowed-ips/:id` (`UpdateAllowedIpDto`):
- `address?`, `description?` only. **`clientId` is not editable.** `active`/status excluded (own endpoint).

`PATCH /allowed-ips/:id/status` (`ChangeAllowedIpStatusDto`):
- `active: boolean` (required, only field).

### Responses

Single allowed-ip shape (`allowedIpSelect`, used by every endpoint):
```ts
{
  id, clientId, address, type, description, active, createdAt, updatedAt,
  client: { id, name, code, active },
}
```

`GET /allowed-ips` response `data`:
```ts
{
  items: AllowedIp[],
  pagination: { page, limit, total, totalPages },
  filters: { search, clientId, type, active, sortBy, sortOrder },
}
```

### Business rules

- **CIDR/IP normalization** (`parseAllowedIpAddress`, via `ipaddr.js`): on create AND on update-with-address-change, the backend normalizes the network address and derives `type` automatically. Example: `192.168.1.50/24` → `192.168.1.0/24`, `type: CIDR_IPV4`. The frontend must always display the value returned by the backend, never the raw user input.
- Invalid IP/CIDR → `400 BadRequestException('The provided IP address or CIDR network is invalid.')`.
- Duplicate `(clientId, address)` → `409 ConflictException('This IP address or CIDR network is already allowed for this client.')`.
- Client must exist (create only) → `404 NotFoundException('Client was not found.')`.
- Client must be active to create, or to reactivate via status endpoint → `400 BadRequestException('Client is inactive.')` (not checked on deactivate, not checked on update).
- Allowed IP not found → `404 NotFoundException('Allowed IP was not found.')`.
- `changeStatus` is idempotent: setting the same `active` value is a no-op (no error, no audit log).

### Frontend decisions

- Client picker (create form + filter bar) reuses `GET /clients` via `src/features/clients/clients.service.ts` (same pattern as API Keys' client combobox) — no separate lookup service written.
- No client-side IP/CIDR format validation — only "required, max 100 chars" is checked client-side (Zod). The real `ipaddr.js` parsing is backend-only; duplicating it risks accepting/rejecting differently than the real API. Invalid input surfaces as a translated 400 error instead.
- Success feedback after create/update explicitly includes the normalized `address` returned by the backend (e.g. "Allowed IP criado com sucesso: 192.168.1.0/24."), not the raw value the user typed — satisfies the "always show the official value" requirement without needing a separate confirmation step.
- `type` is never a form input — always derived/read-only, shown as a translated label (`allowedIps.types.IPV4` etc.).

### Known gap (not fixed, out of scope for Allowed IPs)

`src/lib/api/api-response.ts`'s `STATUS_TRANSLATION_KEY` map has no entry for HTTP `400` — a 400 (e.g. invalid CIDR) falls through to the generic `api.errors.unknown` message instead of a more specific one. This is pre-existing, shared infrastructure from Etapa 3, affects every module's 400 errors app-wide, and was deliberately not touched here (not part of the Allowed IPs module, no unrelated refactors).

## Clients — `code` field removed from write DTOs (2026-08-06)

`CreateClientDto`/`UpdateClientDto` no longer accept `code` at all (confirmed live via `GET /docs-json` → `components.schemas.CreateClientDto`/`UpdateClientDto` → properties are exactly `name, description, contactName, contactEmail`). The identifier (`code` on every read response) is generated server-side from `name` and can never be set by the caller, and does not change when `name` is edited. Frontend: `src/features/clients/utils/generate-identifier.ts` (`generateIdentifier`) is a **client-side preview only** — same slugify rules as the backend is presumed to use (lowercase, strip accents, ASCII letters/digits/hyphen only, collapse/trim hyphens) — shown live under the Nome field on create, read-only, never sent in the payload. On edit, the existing `client.code` is shown read-only and is never recomputed from the edited name. UI label changed from "Código"/"Code" to "Identificador"/"Identifier" everywhere (table column, filters sort option, form field, details drawer) — only display strings changed, all technical keys/params (`code` field on `Client`, `sortBy=code` query value, `clients.table.code`/`clients.form.code` i18n keys) are unchanged.

## DELETE endpoints — ADMIN only (2026-08-06)

Confirmed live via `GET /docs-json` and backend controller source. Endpoints exist for Users, Clients, API Keys, Allowed IPs, Gateway Routes and Route Headers — **only the first four have a frontend module today** (Gateway Routes/Route Headers are still unimplemented per `IMPLEMENTATION_STATUS.md`, so their DELETE cannot be wired up yet).

| Method | Path | Roles | Response | Notes |
|---|---|---|---|---|
| `DELETE` | `/users/:id` | **ADMIN only** | 204 | 403 `USER_CANNOT_DELETE_SELF` (self-delete blocked), 403 `LAST_ADMIN_CANNOT_BE_DELETED` (last active admin blocked). Both are 403, not 409. |
| `DELETE` | `/clients/:id` | **ADMIN only** | 204 | 409 `CLIENT_HAS_DEPENDENCIES` if the client still has API Keys, Allowed IPs or Gateway Routes. |
| `DELETE` | `/api-keys/:id` | **ADMIN only** | 204 | Unconditional — no dependency guard (`RequestLog.apiKey` is `onDelete: SetNull`). |
| `DELETE` | `/allowed-ips/:id` | **ADMIN only** | 204 | Unconditional — no dependency guard. |
| `DELETE` | `/gateway-routes/:id` | ADMIN only (route exists, frontend module not built yet) | 204 | Not wired up — no Gateway Routes page exists. |
| `DELETE` | `/route-headers/:id` | ADMIN only (route exists, frontend module not built yet) | 204 | Not wired up — no Route Headers page exists. |

**Important:** unlike every other write operation in this app (`create`/`update`/`status`/`revoke`/`regenerate`), which are `@Roles(ADMIN, OPERATOR)`, every `DELETE` is `@Roles(ADMIN)` only. `src/features/auth/role-permissions.ts` reflects this: `*.delete` permissions are granted ONLY via ADMIN's `'*'` wildcard — do NOT add `users.delete`/`clients.delete`/`apiKeys.delete`/`allowedIps.delete` to OPERATOR's array.

### Frontend decisions (DELETE feature)

- Shared `src/components/shared/delete-confirmation-dialog.tsx` (`DeleteConfirmationDialog`) — reused across all four modules; shows entity name, fixed irreversibility notice, optional per-module dependency-warning slot.
- Shared `src/lib/api/delete-error.ts` (`getDeleteErrorMessage`) — delete-specific copy: 403 → fixed "no permission" message (does not try to distinguish self-delete vs last-admin vs plain forbidden), 404 → fixed "record no longer exists" message (list is also invalidated on 404 so the stale row disappears), 409 → the backend's own curated `ConflictException` message (safe, never raw Prisma), appends `Código de atendimento/Reference code: <requestId>` when present. Everything else falls back to the existing generic `api.errors.*` map.
- Every delete dialog guards double-submit with a `useRef` flag checked synchronously in `handleConfirm` (in addition to `mutation.isPending` disabling the button) — needed because `isPending` only updates on the next render, so two rapid clicks in the same tick would otherwise both fire.
- Users table never renders "Excluir" on the current user's own row (`canDeleteUser` in `users.permissions.ts`); the "last active admin" rule is deliberately NOT predicted client-side, only handled via the 403 response.
- API Keys: delete dialog only ever uses `apiKey.id`/`apiKey.name` — the type has no key/hash/secret field at all, so there's nothing to accidentally leak.
- Audit Logs and Request Logs pages do not exist in the frontend yet (Etapas 12/13 pending) — there is nothing to add/verify a "no delete" rule against yet; flagged here so a future implementer doesn't skip it.

## Gateway Routes (Etapa 10)

Last verified: 2026-08-06 (live against `GET /docs-json` + backend source).

Source files:

- `src/modules/gateway-routes/gateway-routes.controller.ts`
- `src/modules/gateway-routes/gateway-routes.service.ts`
- `src/modules/gateway-routes/dto/*`
- `src/modules/gateway-routes/utils/{gateway-route-slug,destination-url}.util.ts`
- `src/modules/gateway-proxy/gateway-proxy.controller.ts`
- `prisma/schema.prisma`

### Endpoints

Class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)` — all four roles read.

| Method | Path | Roles | Notes |
|---|---|---|---|
| `POST` | `/gateway-routes` | ADMIN, OPERATOR | |
| `GET` | `/gateway-routes` | ADMIN, OPERATOR, VIEWER, AUDITOR | |
| `GET` | `/gateway-routes/:id` | ADMIN, OPERATOR, VIEWER, AUDITOR | |
| `PATCH` | `/gateway-routes/:id` | ADMIN, OPERATOR | `clientId` not editable |
| `PATCH` | `/gateway-routes/:id/status` | ADMIN, OPERATOR | |
| `DELETE` | `/gateway-routes/:id` | **ADMIN only** | 204; 409 if Route Headers still exist |

### DTOs

`CreateGatewayRouteDto` (confirmed live via `/docs-json`): `name, slug, destinationUrl, method, clientId, description?, timeoutMs?, retryCount?`. **`slug` is required and user-supplied** — unlike `Client.code`, the backend does NOT generate it from `name`; it only normalizes/validates it (`normalizeGatewayRouteSlug`): lowercased, must start with `/`, no `//`, not exactly `/`, matches `^[a-z0-9/_-]+$`, and rejects reserved prefixes (`/api`, `/api/v1`, `/docs`, `/health`, `/auth`, `/users`, `/roles`, `/clients`, `/api-keys`, `/allowed-ips`, `/audit-logs`). All violations → `400 BadRequestException('The provided slug is invalid.')`.

`UpdateGatewayRouteDto`: same fields minus `clientId` (not editable) and no `active` (separate status endpoint).

`ChangeGatewayRouteStatusDto`: `{ active: boolean }`.

`FindGatewayRoutesQueryDto`: `page` (default 1), `limit` (default 20, max 100), `search?` (matches `name`, `slug`, `description`, `client.name`, `client.code`), `clientId?` (UUID), `method?` (`GatewayHttpMethod` enum), `active?` (bool), `sortBy?` (`'name'|'slug'|'createdAt'|'updatedAt'|'timeoutMs'`, default `'createdAt'` — **`retryCount` is NOT sortable**), `sortOrder?` (default `'desc'`).

`GatewayHttpMethod` enum: `GET | POST | PUT | PATCH | DELETE`.

Defaults applied server-side when omitted on create: `timeoutMs: 30000`, `retryCount: 0`, `active: true` (always, not settable via DTO).

### Responses

`gatewayRouteSelect` (identical across create/update/list/get/status endpoints):
```ts
{
  id, clientId, name, slug, description, destinationUrl, method,
  timeoutMs, retryCount, active, createdAt, updatedAt,
  client: { id, name, code, active },
}
```
Every response additionally gets `publicPath: string` appended (computed in-service, NOT a Prisma column) via `withPublicPath()` — exactly `` `/gateway${slug}` ``.

`GET /gateway-routes` response `data`: `{ items, pagination: { page, limit, total, totalPages }, filters }`.

### Business rules

- **Slug is the public route identifier**, validated as above; duplicate slug → `409 ConflictException('A gateway route with this slug already exists.')`.
- **Destination URL** (`normalizeDestinationUrl`): must parse as a URL with `http:`/`https:` protocol, no username/password, no fragment → `400 BadRequestException('The provided destination URL is invalid.')`. Normalizes by stripping a trailing `/` from the pathname.
- Client must exist (create) → `404`; client must be active to create, or to reactivate via the status endpoint → `400 BadRequestException('Client is inactive.')` (not checked on plain update).
- `changeStatus` is idempotent (no-op, no audit log, if `active` already matches).
- **Delete**: 409 `GATEWAY_ROUTE_HAS_DEPENDENCIES` if the route still has `RouteHeader` rows (`RouteHeader.gatewayRoute` is DB-level `onDelete: Restrict` too). **No check against `RequestLog`** — `RequestLog.gatewayRoute` is `onDelete: SetNull`, historical logs survive with the FK cleared.
- **`ApiKey` has NO relation to `GatewayRoute`** in the schema — an API Key is client-scoped only; "which routes it can call" is enforced at proxy-time by client match, not a DB foreign key.

### Public gateway proxy

`GatewayProxyController` (`@Controller('gateway')`, `@Public()`) is excluded from the global `api/v1` prefix (`app.setGlobalPrefix('api/v1', { exclude: [{ path: 'gateway/*path', method: RequestMethod.ALL }] })` in `main.ts`). So the real callable public URL is exactly `` `/gateway${slug}` `` (no `/api/v1`) — matches `publicPath` exactly. Auth there is `X-API-Key` header only, never JWT.

### Frontend decisions

- `PublicEndpointField` (`src/components/gateway-routes/public-endpoint-field.tsx`) builds the full URL from `env.VITE_PUBLIC_GATEWAY_URL + route.publicPath` — never reconstructs the path from `slug`/`destinationUrl` manually, always uses the backend's `publicPath` verbatim. Falls back to the relative `publicPath` alone when the env var is unset (still useful to copy locally), unlike the API Keys reveal dialog which shows an explicit "not configured" message (there, no per-route path exists to fall back to).
- `CopyField` (shared) gained an optional `truncate` prop (visually truncates with an ellipsis + native `title` tooltip; the full value is still what gets copied) — used in the table's public-endpoint column; the details drawer uses the untruncated default.
- `MethodBadge` (`src/components/gateway-routes/method-badge.tsx`) — new small badge component for the HTTP method, same visual pattern as `RoleBadge`/`StatusBadge`.
- Create form shows a live public-path preview (`` `/gateway${slug}` ``) computed from the user's own slug input as they type — this is NOT invented, it mirrors the backend's confirmed, fixed `buildGatewayPublicPath()` formula exactly; the authoritative `publicPath` from the response is what's actually shown/copyable after success (opens the details drawer).
- `slug`/`destinationUrl` only get basic client-side checks (non-empty, max length, `.url()`) — the backend's real normalization (reserved-prefix rejection, protocol/credential/fragment checks) is deliberately not duplicated, to avoid diverging from the real API; invalid input surfaces as a translated 400.
- `destinationUrl` (internal target) is shown in the details drawer to any role that can view details — the backend returns it to all four read roles identically (`gatewayRouteSelect` has no role-conditional projection), so there is no real permission boundary to enforce client-side; it is deliberately never shown in the table (task requirement: don't expose it unnecessarily in the listing).
- **Permission correction**: `role-permissions.ts`'s AUDITOR array was missing `gatewayRoutes.read` even though the controller's class-level `@Roles` includes AUDITOR (confirmed live) — fixed as part of this etapa. `routeHeaders.read` has the same latent gap but was deliberately left untouched since Route Headers isn't implemented yet (out of scope for this etapa; flag it when Route Headers is built).

## Route Headers (Etapa 11)

Last verified: 2026-08-07 (backend source + live `GET /docs-json` via `npm run api:types`).

Source files:

- `src/modules/route-headers/route-headers.controller.ts`
- `src/modules/route-headers/route-headers.service.ts`
- `src/modules/route-headers/dto/*`
- `prisma/schema.prisma`

### Endpoints

Class-level `@Roles(ADMIN, OPERATOR, VIEWER, AUDITOR)` — all four roles read.

| Method | Path | Roles | Notes |
|---|---|---|---|
| `POST` | `/route-headers` | ADMIN, OPERATOR | |
| `GET` | `/route-headers` | ADMIN, OPERATOR, VIEWER, AUDITOR | |
| `GET` | `/route-headers/:id` | ADMIN, OPERATOR, VIEWER, AUDITOR | |
| `PATCH` | `/route-headers/:id` | ADMIN, OPERATOR | `gatewayRouteId` not editable |
| `PATCH` | `/route-headers/:id/status` | ADMIN, OPERATOR | |
| `DELETE` | `/route-headers/:id` | **ADMIN only** | 204; no dependency guard in service |

### DTOs

`CreateRouteHeaderDto`: `gatewayRouteId`, `name`, `value`, `sensitive?`.

- `gatewayRouteId`: required UUID.
- `name`: required string, max `100`; normalized server-side to HTTP Header-Case.
- `value`: required string, max `4000`.
- `sensitive?`: optional boolean, default `false`.

`UpdateRouteHeaderDto`: `name?`, `value?`, `sensitive?`.

- `gatewayRouteId` is absent — route association is not editable.
- `value` is optional; omitting it preserves the existing encrypted value.

`ChangeRouteHeaderStatusDto`: `{ active: boolean }`.

`FindRouteHeadersQueryDto`:

- `page` (default `1`), `limit` (default `20`, max `100`)
- `search?` — matches `name`, `gatewayRoute.name`, `gatewayRoute.slug`
- `gatewayRouteId?` (UUID)
- `headerName?` (string)
- `active?` (boolean)
- `sensitive?` (boolean)
- `sortBy?` — `'headerName' | 'createdAt' | 'updatedAt'` (default `'createdAt'`)
- `sortOrder?` — `'asc' | 'desc'` (default `'desc'`)

### Responses

Safe route-header shape returned by create/list/get/update/status:
```ts
{
  id,
  gatewayRouteId,
  name,
  value,
  sensitive,
  active,
  createdAt,
  updatedAt,
}
```

`GET /route-headers` response `data`:
```ts
{
  items: RouteHeader[],
  pagination: { page, limit, total, totalPages },
  filters: { search, gatewayRouteId, headerName, active, sensitive, sortBy, sortOrder },
}
```

### Business rules

- Create validates that the referenced `GatewayRoute` exists; missing route → `404 NotFoundException('Gateway route was not found.')`.
- Create also requires the route to be active; inactive route → `400 BadRequestException('Gateway route is inactive.')`.
- Header names are normalized server-side with `normalizeRouteHeaderName()` before uniqueness checks and persistence.
- Duplicate `(gatewayRouteId, normalized name)` → `409 ConflictException('This header is already configured for this gateway route.')`.
- Values are encrypted at rest (`valueEncrypted` in Prisma) and are never returned to the frontend directly.
- **Sensitive masking:** every response uses `toSafeRouteHeader()`. When `sensitive = true`, the backend returns `value: '********'`. When `sensitive = false`, it returns the decrypted cleartext `value`.
- Update only re-encrypts the value when `dto.value !== undefined`; sending no `value` preserves the existing secret. This is the real basis for the frontend rule "leave blank to keep current value".
- `changeStatus` is idempotent: if `active` already matches, the backend returns the current safe record and writes no audit log.
- Delete has no dependency guard in the service; it deletes after the existence check + audit log write. No 409 rule was found in this module's real source.

### Prisma / relations

- `RouteHeader.gatewayRouteId` → `GatewayRoute.id`
- relation: `RouteHeader.gatewayRoute @relation(..., onDelete: Restrict)`
- unique constraint: `@@unique([gatewayRouteId, name])`
- indexes: `gatewayRouteId`, `active`, `sensitive`, `createdAt`

### Frontend decisions

- The Route Headers frontend keeps the feature's own contract exact and fetches route/client/method/public endpoint context separately from `GET /gateway-routes/:id`, because the Route Headers backend responses do **not** embed route/client data.
- The list filter bar uses only real backend filters: `search`, `gatewayRouteId`, `sensitive`, `active`, `sortBy`, `sortOrder`. No fake `clientId` filter was added.
- Sensitive headers are never shown in cleartext in table, delete dialog or details drawer. The details drawer shows masked `********`; the edit form starts with an empty `value` input for sensitive records.
- Non-sensitive values may be shown in the details drawer because the backend really returns them in `value`; they are still omitted from the table to reduce accidental exposure.
- `routeHeaders.delete` is shown only for ADMIN, matching the real controller.

## Audit Logs (Etapa 12)

Last verified: 2026-08-07 (backend source + live `GET /docs-json` via `npm run api:types`).

Source files:

- `src/modules/audit-logs/audit-logs.controller.ts`
- `src/modules/audit-logs/audit-logs.service.ts`
- `src/modules/audit-logs/dto/find-audit-logs-query.dto.ts`
- `prisma/schema.prisma`

### Endpoints

Class-level `@Roles(ADMIN, AUDITOR, OPERATOR)` — `VIEWER` does not read audit logs.

| Method | Path | Roles | Notes |
|---|---|---|---|
| `GET` | `/audit-logs` | ADMIN, AUDITOR, OPERATOR | |
| `GET` | `/audit-logs/:id` | ADMIN, AUDITOR, OPERATOR | detail includes `user.email` |

No `POST`, `PATCH` or `DELETE` endpoint exists. Audit Logs are read-only in the real backend and there is no manual purge/delete flow.

### DTOs

`FindAuditLogsQueryDto`:

- `page` (default `1`)
- `limit` (default `20`, max `100`)
- `action?` (`AuditAction`)
- `entity?` (`AuditEntity`)
- `userId?` (UUID)
- `entityId?` (string)
- `requestId?` (string)
- `startDate?` (ISO date string)
- `endDate?` (ISO date string)

No `search`, `username`, `sourceIp`, `sortBy` or `sortOrder` fields exist in the real query DTO.

`AuditAction` enum confirmed in Prisma:

- `CREATE`, `UPDATE`, `DELETE`, `ACTIVATE`, `DEACTIVATE`, `CHANGE_ROLE`, `RESET_PASSWORD`, `CHANGE_PASSWORD_REQUIREMENT`, `LOGIN`, `LOGOUT`, `REFRESH_TOKEN`, `REVOKE`, `REGENERATE`

`AuditEntity` enum confirmed in Prisma:

- `USER`, `ROLE`, `CLIENT`, `API_KEY`, `ALLOWED_IP`, `GATEWAY_ROUTE`, `ROUTE_HEADER`, `SYSTEM_SETTING`

### Responses

`GET /audit-logs` item shape:
```ts
{
  id,
  action,
  entity,
  entityId,
  previousValue,
  newValue,
  sourceIp,
  requestId,
  description,
  createdAt,
  user: user ? {
    id,
    name,
    username,
    role: { code, name },
  } : null,
}
```

`GET /audit-logs/:id` returns the same shape, but `user` additionally includes `email` when present.

`GET /audit-logs` response `data`:
```ts
{
  items,
  pagination: { page, limit, total, totalPages },
  filters: { action, entity, userId, entityId, requestId, startDate, endDate },
}
```

### Business rules

- Ordering is fixed in service: `createdAt desc`.
- The `user` relation is nullable (`onDelete: SetNull`), so historical logs can remain after a user is deleted.
- `findOne` returns `404 NotFoundException('Audit log was not found.')` when the record does not exist.
- `previousValue` and `newValue` are arbitrary JSON payloads from historical writes; consumers must treat them as display-only audit evidence.
- No manual delete exists for audit logs. A future retention routine may remove old data server-side, but that is not part of the current API contract.

### Frontend decisions

- The frontend keeps Audit Logs strictly read-only: table + filters + details drawer only.
- The filter bar mirrors the backend contract exactly; no fake free-text search or unsupported sort controls were added.
- Sensitive keys inside `previousValue` and `newValue` are masked client-side before rendering, even if the backend stored them in raw historical payloads.
- Removed users are shown gracefully as a translated fallback instead of assuming `user` is always present.
- No delete button, bulk action or retention action exists in the UI, matching the real backend contract.

## Request Logs (Etapa 13)

Last verified: 2026-08-07 (backend source + live `GET /docs-json` via `npm run api:types` + unauthenticated `GET /api/v1/request-logs` returning `401 Access token was not provided.`).

Source files:

- `src/modules/request-logs/request-logs.controller.ts`
- `src/modules/request-logs/request-logs.service.ts`
- `src/modules/request-logs/dto/find-request-logs-query.dto.ts`
- `prisma/schema.prisma`

### Endpoints

Class-level `@Roles(ADMIN, OPERATOR, AUDITOR)` — `VIEWER` does not read request logs.

| Method | Path | Roles | Notes |
|---|---|---|---|
| `GET` | `/request-logs` | ADMIN, OPERATOR, AUDITOR | list with pagination, filters and search |
| `GET` | `/request-logs/:id` | ADMIN, OPERATOR, AUDITOR | UUID `:id` only |
| `GET` | `/request-logs/by-request-id/:requestId` | ADMIN, OPERATOR, AUDITOR | exact Request ID lookup |

No `POST`, `PATCH` or `DELETE` endpoint exists for operators/admins in this module. Request Logs are read-only in the real backend and there is no manual purge/delete flow.

### DTOs

`FindRequestLogsQueryDto`:

- `page` (default `1`)
- `limit` (default `20`, max `100`)
- `search?` (string)
- `clientId?` (UUID)
- `apiKeyId?` (UUID)
- `gatewayRouteId?` (UUID)
- `sourceIp?` (string)
- `requestOrigin?` (`PUBLIC | INTERNAL`)
- `destinationHost?` (string)
- `destinationIp?` (string)
- `method?` (string; backend normalizes filter to `toUpperCase()` in service)
- `statusCode?` (int, `100..599`)
- `result?` (`SUCCESS | ERROR`)
- `errorCode?` (string)
- `requestId?` (string)
- `startDate?` (ISO date string)
- `endDate?` (ISO date string)
- `sortBy?` — `'attemptedAt' | 'createdAt' | 'durationMs' | 'statusCode' | 'attempts'` (default `'attemptedAt'`)
- `sortOrder?` — `'asc' | 'desc'` (default `'desc'`)

`RequestLogResult` enum confirmed in Prisma:

- `SUCCESS`, `ERROR`

`RequestOrigin` enum confirmed in Prisma:

- `PUBLIC`, `INTERNAL`

### Responses

`GET /request-logs` item shape (`requestLogListSelect`):
```ts
{
  id,
  requestId,
  attemptedAt,
  requestOrigin,
  sourceHost,
  clientId,
  apiKeyId,
  gatewayRouteId,
  sourceIp,
  method,
  publicPath,
  publicEndpoint,
  destinationHost,
  destinationIp,
  statusCode,
  durationMs,
  attempts,
  result,
  errorCode,
  errorMessage,
  requestSizeBytes,
  responseSizeBytes,
  createdAt,
  client: client ? { id, name, code } : null,
  apiKey: apiKey ? { id, name } : null,
  gatewayRoute: gatewayRoute ? { id, name, slug, method } : null,
}
```

`GET /request-logs/:id` and `GET /request-logs/by-request-id/:requestId` return the same shape plus:
```ts
{
  destinationUrl,
  upstreamStatusCode,
  requestHeaders,
  requestQuery,
  requestBody,
  responseHeaders,
  responseBody,
}
```

`GET /request-logs` response `data`:
```ts
{
  items,
  pagination: { page, limit, total, totalPages },
  filters: {
    search,
    clientId,
    apiKeyId,
    gatewayRouteId,
    requestOrigin,
    sourceIp,
    destinationHost,
    destinationIp,
    method,
    statusCode,
    result,
    errorCode,
    requestId,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  },
}
```

### Business rules

- `attemptedAt` is the real time the request attempt entered the gateway and is the sole official timestamp for the attempt — see the "Backend fix — attemptedAt now NOT NULL" note below for the 2026-08-07 contract change. `createdAt` is only the persistence timestamp (when the row was written to the database) and is never used as a fallback for `attemptedAt`.
- Date-range filtering (`startDate`/`endDate`) filters exclusively by `attemptedAt` — there is no `createdAt` fallback in the filter.
- Search (`search`) matches real backend fields only: `requestId`, `sourceIp`, `sourceHost`, `publicPath`, `publicEndpoint`, `destinationHost`, `destinationIp`, `errorCode`, `client.name`, `client.code`, `apiKey.name`, `apiKey.prefix`, `gatewayRoute.name`, `gatewayRoute.slug`.
- Ordering is limited to the real `sortBy` set above.
- `findOne`/`findByRequestId` return `404 NotFoundException('Request log was not found.')` when absent.
- `client`, `apiKey` and `gatewayRoute` relations are nullable (`onDelete: SetNull`) — historical logs survive after those records are deleted.
- Request payloads are already sanitized server-side on write (`sanitizeForLog`) and may be truncated there, but the frontend should still sanitize again before rendering.
- No manual delete exists for request logs. A future retention routine may remove old data server-side, but that is not part of the current API contract.

### Frontend decisions

- The frontend keeps Request Logs strictly read-only: filters + table + details drawer only.
- The table uses `attemptedAt` as the primary time column and shows `createdAt` only in the drawer.
- The filter bar mirrors the backend contract exactly; no client-side fake filters or fake sort fields were added.
- `method`/`publicPath` are the real backend field names; the UI labels them as HTTP method and Request Path without inventing API aliases such as `httpMethod` or `requestPath`.
- Sensitive keys inside headers/query/body payloads are masked client-side before rendering, even if the backend already sanitized them.
- `requestLogs.read` is shown only for `ADMIN`, `OPERATOR` and `AUDITOR`, matching the real controller.
- No delete button, bulk action, manual cleanup or retention action exists in the UI, matching the real backend contract.
- `formatRequestLogDateTime(value, locale)` (`request-logs.utils.ts`) is the single date/time formatter for the whole feature — used by both the table's "Horário" column and the drawer's "Horário da tentativa"/"Criado em" rows, so the two can never drift into different formats. pt-BR always renders `DD/MM/AAAA HH:mm:ss` via explicit 2-digit fields (not the `dateStyle`/`timeStyle` shorthand); other languages use the project's existing `dateStyle`/`timeStyle` convention. The formatters are built fresh per call (not cached module-level) so they always reflect the current local timezone.
- `buildRequestLogStartDate`/`buildRequestLogEndDate` (`request-logs.utils.ts`) convert the raw `YYYY-MM-DD` from `<input type="date">` into a real UTC ISO instant representing the start/end of that day in the browser's local timezone (`new Date(year, month-1, day, h, m, s, ms).toISOString()`) — never a naive `` `${date}T00:00:00.000Z` `` string, which would misinterpret the local day as UTC midnight and shift it for any non-UTC timezone.

### Backend fix — non-deterministic sort order (2026-08-07)

User reported the list looked randomly ordered rather than newest-to-oldest, even though the frontend already sends `sortBy=attemptedAt&sortOrder=desc` (the real backend default) on every request. Root cause was in the **backend**, not the frontend: `RequestLogsService.buildOrderBy()` (`src/modules/request-logs/request-logs.service.ts`, real backend project) returned a single `{ attemptedAt: sortOrder }` object with no tiebreaker. Postgres does not guarantee a stable order for rows that tie on the sort field (e.g. several requests logged within the same second), which is especially visible across paginated (`skip`/`take`) requests — the same page can come back reshuffled between calls.

Fixed (with explicit user authorization to touch the backend, since this can't be solved from the frontend alone — the frontend only ever sees whichever page the backend decides to return): `buildOrderBy` now returns `[primarySortField, { id: 'desc' }]` — `id` is a unique UUID, so appending it as a secondary sort key makes every `sortBy` option (`attemptedAt`, `createdAt`, `durationMs`, `statusCode`, `attempts`) fully deterministic. `FindRequestLogsParams`/`RequestLogSortBy` on the frontend are unaffected — this part is purely a backend query-shape fix. Verified: real backend's `request-logs.service.spec.ts` (30 tests, incl. 2 new ones asserting the exact `orderBy` array shape) and full backend suite (510 tests) pass; backend build succeeds.

### Backend fix — attemptedAt now NOT NULL, no more createdAt fallback (2026-08-07)

The backend was fixed (by the user, outside this frontend task) so that `RequestLog.attemptedAt` is now `NOT NULL` in the database — every new row always has a real `attemptedAt`, historical rows were backfilled with `attemptedAt = createdAt`, and `startDate`/`endDate` filtering plus `sortBy=attemptedAt` ordering use `attemptedAt` exclusively (no more silent `createdAt` fallback for rows where it used to be `null`). Timestamps continue to be persisted in UTC.

Frontend aligned to this contract the same day: `RequestLogListItem.attemptedAt` changed from `string | null` to `string` (non-nullable) in `request-logs.types.ts`; the `getRequestLogAttemptedAt()` fallback helper (`attemptedAt ?? createdAt`) was deleted — the table and drawer now read `row.attemptedAt`/`currentRequestLog.attemptedAt` directly. `createdAt` is still shown, but only as a separate "Criado em"/"Created at" row in the details drawer, never substituted for `attemptedAt`.

### Frontend addition — sortable "Horário"/Time column (2026-08-07)

Follow-up to the fix above: the user also asked for a way to toggle asc/desc on the time column specifically, while keeping "most recent first" as the default. Added `sortOrder: SortOrder` to `RequestLogsFilterState` (default `'desc'` in `DEFAULT_REQUEST_LOG_FILTERS`) — `sortBy` itself stays hardcoded to `'attemptedAt'` in `toFindRequestLogsParams`, since that is the only column exposed as sortable in the UI. `RequestLogsTable` renders the "Horário"/"Time" column header as a clickable button (`aria-sort` on the `<th>`, `ArrowDown`/`ArrowUp` icon, sr-only label describing the action) that toggles the direction via `onToggleSort`, resetting to page 1. No new dropdown was added to the already-dense filter bar — a single-field toggle on the column header itself matched the request more directly than the "Ordenar por/Direção" `FilterSelect` pair used in other modules (which makes sense there because those modules expose several sortable fields; here there is only one).

## Trusted CAs (Etapa 15 — Configurações → Certificados)

Last verified: 2026-08-07 (backend source read directly — this section did not exist before, despite the module being fully implemented).

Source files:

- `src/modules/trusted-cas/trusted-cas.controller.ts`
- `src/modules/trusted-cas/trusted-cas.service.ts`
- `src/modules/trusted-cas/dto/find-trusted-cas-query.dto.ts`, `dto/change-trusted-ca-status.dto.ts`
- `src/modules/trusted-cas/utils/trusted-ca-certificate.util.ts`
- `prisma/schema.prisma` (`TrustedCa` model)

### Endpoints

Class-level `@Roles(ADMIN)` — **every endpoint, including `GET`/list, is ADMIN only** (unlike every other module, where read is normally shared with OPERATOR/VIEWER/AUDITOR).

| Method | Path | Roles | Notes |
|---|---|---|---|
| `POST` | `/trusted-cas` | ADMIN | `multipart/form-data`; fields `name` + `file` |
| `GET` | `/trusted-cas` | ADMIN | |
| `GET` | `/trusted-cas/:id` | ADMIN | |
| `PATCH` | `/trusted-cas/:id/status` | ADMIN | `{ active: boolean }`, idempotent |
| `DELETE` | `/trusted-cas/:id` | ADMIN | 204; **no dependency guard** |

### Upload contract

`POST /trusted-cas` reads the body via Fastify's `request.file({ limits: { files: 1, fields: 5, parts: 6, fileSize: 1024 * 1024 } })` (1 MB max) — `name` comes from `file.fields.name.value`, the certificate bytes from `file.toBuffer()`. Field names are exactly `name` and `file`; there is no other accepted shape.

Certificate validation (`parseTrustedCaCertificate`, fully server-side, no frontend X.509 parsing):

- Allowed extensions: `.pem`, `.crt`, `.cer`. Blocked: `.key`, `.pfx`, `.p12` → `400 { code: 'PRIVATE_KEY_NOT_ALLOWED' }`.
- PEM must contain exactly one `-----BEGIN CERTIFICATE----- … -----END CERTIFICATE-----` block and parse as a valid `X509Certificate`, else `400 { code: 'UNSUPPORTED_CERTIFICATE_FORMAT' }` / `{ code: 'INVALID_CERTIFICATE' }`.
- `certificate.ca` must be `true` → else `400 { code: 'CERTIFICATE_NOT_CA' }`.
- `validToDate <= now` → `400 { code: 'CERTIFICATE_EXPIRED' }`.
- Name must be 3–120 chars after trim → else `400 { code: 'INVALID_TRUSTED_CA_NAME' }`.
- Duplicate fingerprint → `409 { code: 'TRUSTED_CA_ALREADY_EXISTS' }`.
- Missing/invalid multipart shape → `400 { code: 'INVALID_MULTIPART_REQUEST' }` / `{ code: 'INVALID_TRUSTED_CA_UPLOAD' }`; oversized file → `413 { code: 'FILE_TOO_LARGE' }`.
- `isRoot` is computed server-side as `subject === issuer` — never client-derived, never labeled "Intermediate CA" for non-root certs (backend gives no data to support that distinction).

### Query params (`GET /trusted-cas`)

- `page` (default `1`), `limit` (default `20`, max `100`)
- `search?` — matches `name`, `subject`, `issuer`, `serialNumber`, `fingerprintSha256`
- `active?` (boolean)
- `validity?` — **`'valid' | 'expired'` only — there is no `'expiring'` value server-side.** The frontend's three-state visual badge (valid/expiring/expired) is purely client-derived from `validTo` and is a separate concept from this filter.
- `sortBy?` — `'name' | 'validTo' | 'createdAt' | 'updatedAt'` (default `'createdAt'`)
- `sortOrder?` — `'asc' | 'desc'` (default `'desc'`)

### Responses

`trustedCaPublicSelect` (returned by every endpoint) — **`certificatePem` is a real Prisma column but is never part of this select, so it is never returned by any endpoint.** No divergence found: the frontend's `TrustedCa` type correctly has no `certificatePem`/`pem`/raw-content field, and no UI code path renders one.

```ts
{
  id, name, fingerprintSha256, subject, issuer, serialNumber,
  validFrom, validTo, isRoot, active, createdById, createdAt, updatedAt,
}
```

`GET /trusted-cas` response `data`:
```ts
{
  items: TrustedCa[],
  pagination: { page, limit, total, totalPages },
  filters: { search, active, validity, sortBy, sortOrder },
}
```

### Business rules

- `create()` always sets `active: true` on a newly uploaded CA.
- `changeStatus()` is idempotent — no-op (no audit log written) if the value already matches.
- `remove()` has **no dependency guard** — unconditional delete after an existence check, unlike Clients/Gateway Routes.
- Every mutation invalidates a `TrustedCaDispatcherService` cache and writes an audit log (`AuditEntity.TRUSTED_CA`).
- No update/edit endpoint exists — renewal is a documented flow only (add new CA → activate → test → deactivate old → delete old), never a single "replace file" action.

### Backend bug found and fixed — multipart uploads globally blocked (2026-08-07)

Live verification of the new frontend feature failed: every upload returned `415 Unsupported Media Type` / `"Only application/json is accepted on this endpoint."`, reproduced directly with `curl` against the running backend (independent of the frontend).

Root cause was in the **backend**, not the frontend: `registerContentTypeValidationHook` (`src/common/hooks/security-hooks.ts`) restricts every `/api/v1/*` route with a body to `application/json` only, with no exception for the Trusted CAs upload endpoint — which the controller itself requires to be `multipart/form-data`. This made `POST /trusted-cas` unusable for **any** client, not something specific to this frontend. The backend's own integration test suite never caught this because `test/helpers/test-app.helper.ts` intentionally does not register the Fastify-level hooks from `main.ts` (comment there says that layer is covered by a separate "Security Hardening manual test pass").

Fixed (explicit user authorization to touch the backend for this): added a `MULTIPART_ROUTES` allowlist (currently just `POST /api/v1/trusted-cas`) so the hook accepts `application/json` **or** `multipart/form-data` on those specific routes only — every other admin endpoint remains JSON-only. Verified via `curl`: the same multipart request now returns `401 Unauthorized` (no token) instead of `415`, confirming it passes content-type validation and reaches the auth guard. Backend `tsc --noEmit` passes; no automated test previously covered this hook, so none needed updating.

### Frontend decisions

- `src/features/trusted-cas/` follows the Route Headers file convention (single `.hooks.ts` with inline query keys, not the split `hooks/`+`.query-keys.ts` style used by Request Logs).
- Upload uses a real browser `FormData` (`name`, `file`), posted with axios's `adapter: 'fetch'` explicitly (not the default `xhr`) for this one call — `xhr` had inconsistent `FormData`+`File` handling in this app's test environment (jsdom + MSW), and `fetch` is the well-supported path for multipart bodies in every target browser. No manual `Content-Type`/boundary is ever set — the browser computes it.
- The certificate's raw/PEM content is never requested, stored, logged, or rendered anywhere in the UI: no Download, "Ver certificado bruto", "Copiar PEM", "Exportar certificado" or Edit action exists for Trusted CAs.
- No frontend option to bypass/ignore TLS validation exists anywhere in the app (`Ignorar SSL/TLS`, `Aceitar certificado inválido`, `rejectUnauthorized: false` or equivalent) — this was a hard requirement, verified by dedicated tests asserting the absence of such strings in the rendered UI.
- The three-state validity badge (Válido/Expirando/Expirado) is computed client-side (`getCertificateValidityStatus`, 30-day "expiring soon" threshold) purely for display — it never touches `active` and is never sent to the backend; the real `validity` query filter only ever offers the two real backend values (`valid`/`expired`).
