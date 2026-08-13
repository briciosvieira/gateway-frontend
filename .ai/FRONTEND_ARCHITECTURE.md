# Frontend Architecture

This file was empty before Etapa 15 (Configurações). It is not a full retroactive audit of every prior module — only architecture that a future etapa needs to know about to extend "Configurações" or add a similarly structured settings-like area.

## Configurações (Settings) area — added Etapa 15 (2026-08-07), extended 2026-08-08

Two-level navigation:

```
Main Sidebar (src/routes/nav-items.ts)
  └─ "Configurações" (last item, ADMIN + OPERATOR via `settings.read`)
       └─ AdminLayout <main> (the app's one true vertical scroll container
            for every OTHER page — Settings is the one exception, see below)
            └─ SettingsLayout (src/layouts/settings-layout.tsx)
                 ├─ outer title/description ("Configurações") — fixed
                 ├─ SettingsSidebar (src/components/settings/settings-sidebar.tsx)
                 │    — secondary, in-page nav; vertical column on desktop
                 │      (md:w-56 md:flex-col), horizontal scrollable strip on
                 │      narrow screens (overflow-x-auto) — fixed, never its
                 │      own vertical scrollbar; filters entries by `permission`
                 │      (Certificados hidden from OPERATOR)
                 └─ <Outlet /> → the selected setting's page, in its OWN
                      scrollable pane (see "Scroll policy" below)
                      (`/settings/certificates` ADMIN-only, `/settings/personalization`
                      and `/settings/users` reachable by ADMIN + OPERATOR)
```

- `SETTINGS_NAV_ITEMS` (`src/routes/settings-nav-items.ts`) is the single source of truth for the secondary sidebar's entries — Certificados, Personalização, Usuários (2026-08-08: Usuários moved here from the main Sidebar, at `/settings/users` — the old `/users` path now redirects). **Adding a future section (Segurança, Gateway, Retenção, Sistema) means appending one `NavItem` here plus one new route under `/settings/*` in `app-router.tsx` — nothing else in `SettingsSidebar`/`SettingsLayout` needs to change.**
- Route redirect: `/settings` (index) → `SettingsIndexRedirect` (`src/routes/settings-index-redirect.tsx`), which picks the FIRST `SETTINGS_NAV_ITEMS` entry the current role can access (not a hardcoded path) — necessary since Certificados (the first entry) is ADMIN-only and a static redirect would 403 an OPERATOR landing on bare `/settings`.
- Permission model (2026-08-08 — per-subsection, no longer one blanket gate): `settings.read` gates the nav item + entry into the `/settings/*` tree only — ADMIN and OPERATOR (no longer ADMIN-only). Each subsection then applies its OWN, stricter inner `PermissionRoute`: Certificados requires `trustedCas.read` (ADMIN only, no exceptions); Usuários requires `users.read` (ADMIN + OPERATOR, mirrors `UsersController`); Personalização has no extra route gate (anyone who reached `/settings/*` can view it), but its write actions split `branding.update` (ADMIN + OPERATOR — name/upload) from `branding.delete` (ADMIN only — reset to default), mirroring `BrandingAdminController`'s per-method `@Roles`. VIEWER/AUDITOR have none of `settings.read`/`trustedCas.*`/`users.*`/`branding.*` and never see Configurações at all.
- Scroll policy — **deliberate exception to `.ai/UI_RULES.md`, added 2026-08-08**: Settings is treated as an internal workspace rather than a normal page. `SettingsLayout` fills `AdminLayout`'s `<main>` exactly (`h-full`, never `h-screen`/`h-dvh` — `<main>` still bounds the height) and keeps the title/description/divider and `SettingsSidebar` fixed (`shrink-0`, outside any scrolling element); only the inner content pane wrapping `<Outlet />` scrolls (`min-h-0 flex-1 overflow-y-auto`, scrollbar hidden via the existing `.hide-scrollbar` utility, same technique as the main Sidebar's nav). This means `<main>` itself never actually scrolls while a Settings page is open — there is still only ever one active vertical scrollbar. Verified by `settings-layout.test.tsx` (title/menu/link sit outside `.overflow-y-auto`, the outlet content sits inside it, no `h-screen`/`h-dvh` anywhere) and `settings-sidebar.test.tsx`.

## Per-module feature file convention (as of Etapa 15)

Two conventions coexist in this codebase; pick based on which the module more closely resembles:

- **Route Headers style** (full CRUD + status + delete, no separate details endpoint beyond `GET /:id`): a single `src/features/{module}/{module}.hooks.ts` with an inline `{module}Keys` query-key object, plus `.types.ts`/`.schemas.ts`/`.constants.ts`/`.service.ts`. Used by Route Headers and, as of this etapa, Trusted CAs.
- **Request Logs style** (read-only, heavier querying surface): split `hooks/` directory + separate `.query-keys.ts`.

Query key shape either way: `{all, lists(), list(params), details(), detail(id)}`. Mutations invalidate `lists()` and either invalidate or `removeQueries` on `detail(id)` depending on whether the record can still exist after the mutation (status change → invalidate; delete → `removeQueries`).

## Client-scoped resource views — API Keys / Allowed IPs / Gateway Routes (final architecture, 2026-08-07)

These three features' main pages are organized "one row per client" (with potentially thousands of clients/resources, repeating the same client name on every row didn't scale visually), sourced from each feature's **`clients-summary` aggregate endpoint** — not `GET /clients`. Only clients with at least one resource for that feature ever appear (backend-enforced), and the main STATUS column is derived from the resource aggregate, never from the client entity's own `active` flag. The pattern, identical across all three:

```
{Feature}Page (e.g. api-keys-page.tsx)
  ├─ PageHeader (unchanged title/description) + global "+ New X" button
  │    → opens the existing CreateXForm with a normal, user-editable client picker
  ├─ ClientResourceSummaryFilters (src/components/shared/client-resource-summary-filters.tsx
  │    — shared, presentation-only component wrapping the real summary query
  │    params: search/status/sortBy/sortOrder. `sortBy` options differ per
  │    feature (API Keys adds `revoked`) so they're passed in as a prop; all
  │    labels are pre-translated by the caller, keeping the component
  │    feature-agnostic. Backed by `use{Feature}ClientsSummary(params)`.)
  ├─ ClientResourceListTable (src/components/shared/client-resource-list-table.tsx
  │    — generic over the summary row type: `getClient`/`isActive`/
  │    `renderCounts` props. Cliente | Identificador | Status | Ações;
  │    STATUS badge is `isActive(row)` — always `row.active > 0` in practice,
  │    never `row.client.active`. `renderCounts` renders the optional compact
  │    total/active/inactive[/revoked] text under the badge, worded per
  │    feature via i18n. Row click + explicit "Ver X" button both call
  │    `onOpenClient(client)`.)
  └─ {Feature}ClientDrawer (e.g. api-key-client-drawer.tsx — per feature, UNCHANGED from the client-list iteration)
       ├─ Sheet + SheetContent (`sm:max-w-4xl`, wider than the default `w-72`)
       ├─ ClientResourceDrawerHeader (src/components/shared/client-resource-drawer-header.tsx
       │    — shared component: client name, code, and `client.active`
       │    status, labeled "Status do cliente" — this is administrative
       │    client info, deliberately distinct from the aggregate STATUS
       │    shown on the main table)
       ├─ "+ New X" → same CreateXForm, passed `lockedClient={client}` (renders
       │    a read-only client display instead of the Combobox; no GET /clients call)
       ├─ {Feature}Filters with `showClientFilter={false}` (hides the now-redundant
       │    client combobox filter — every other filter/sort option unchanged)
       └─ the existing {Feature}Table + DataTablePagination + every existing
            dialog (status/revoke/regenerate/delete/details), unchanged —
            queried via the real `GET /{feature}?clientId=<id>&...`, paginated
            server-side, exactly like before
```

**`ClientRef` type** (`src/features/clients/clients.types.ts`): `Pick<Client, 'id' | 'name' | 'code' | 'active'>` — the minimal client shape embedded in every per-resource record (`ApiKeyClientRef` etc. are now type aliases of it) and in every `clients-summary` item's `client` field. The three `*ClientDrawer` components' `client` prop is typed `ClientRef | null`, not the full `Client` — the drawer never needs `description`/`contactName`/`contactEmail`.

**Summary invalidation (React Query):** every mutation hook for all three features (create/update/status/revoke/regenerate/delete) invalidates BOTH its own resource query key (`{feature}Keys.lists()`/`detail(id)`, unchanged) AND the feature's `{feature}ClientsSummaryKeys.lists()` on success (and on delete's 404 `onError`, since that also means the record is gone). This is what makes create-first-resource/delete-last-resource/activate/deactivate on the drawer automatically reflect on the main clients-summary view via a refetch — no `window.location.reload()` anywhere. `useUpdateApiKey` also invalidates the summary, since editing `expiresAt` can flip whether a key currently counts as "active" in the aggregate.

**Component split to avoid conditional-hooks violations:** each `*ClientDrawer` is `<Sheet>{client && <XClientDrawerContent client={client} />}</Sheet>` — the actual data-fetching/state-holding component only mounts once a client is selected (never called with a possibly-null client), and gets `key={client.id}` so switching clients cleanly remounts (fresh filters/dialog state) instead of reusing stale state across clients.

**Backward-compatible additive props** (both default to the old behavior, so every pre-existing usage/test needed zero changes):
- `CreateApiKeyForm`/`CreateAllowedIpForm`/`CreateGatewayRouteForm` gained an optional `lockedClient?: {id, name, code}` prop.
- `ApiKeyFilters`/`AllowedIpFilters`/`GatewayRouteFilters` gained an optional `showClientFilter?: boolean` (default `true`).

See `.ai/BACKEND_CONTRACTS.md` → "Per-client aggregate endpoints ... CONFIRMED IMPLEMENTED" for the full real contract these pages consume.

## Personalização / Branding global (2026-08-07)

New "Personalização" section under Configurações (`/settings/personalization`, immediately below Certificados in `SETTINGS_NAV_ITEMS`), ADMIN only. Lets an admin edit the installation-wide (never per-user/per-client) `applicationName`, logo, favicon and main/brand image, all consumed from the real backend contract documented in `.ai/BACKEND_CONTRACTS.md` → "Branding" (that contract was undocumented before this task — confirmed live against `/docs-json` since the backend had already shipped it).

```
src/features/branding/
  branding.types.ts       — Branding / ResolvedBranding / BrandingAssetKind
  branding.constants.ts   — DEFAULT_BRANDING (single fallback source), per-asset accept lists + max sizes
  branding.utils.ts       — resolveBranding(): the ONLY place fallback logic lives
  branding.schemas.ts     — updateBrandingNameSchema (2–100 chars, trim, no `<`/`>`)
  branding.service.ts     — GET /branding, PATCH /branding, POST/DELETE /branding/{logo,favicon,brand-image}
  branding-errors.ts      — getBrandingUploadErrorMessage(): 400/413/415 → friendly copy, else falls back to api.errors.*
  branding.hooks.ts       — useBranding() + useUpdateBrandingName/useUpload*/useDelete*
```

**`useBranding()` is the single source of branding data for the whole app** — Sidebar (`AppLogo`), Home/Login (`HeroImage`), the loading screen (`AuthLoadingScreen`, favicon + name), `document.title`/favicon (`BrandingEffects`) and the Personalização page itself all call this same hook, sharing one React Query cache entry (`brandingKeys.all = ['branding']`, no params) — no duplicate requests. It always returns a fully-resolved `branding` object (never `undefined`, even while loading or on error) via `resolveBranding()`, which is the **single** place fallback logic lives: every asset field falls back to `DEFAULT_BRANDING` independently, so customizing only the logo still shows the default favicon/brand image. `GET /branding` is a public, unauthenticated endpoint by design — it must work on `/login` and before the auth check resolves.

**Asset URLs**: the backend returns `logoUrl`/`faviconUrl`/`brandImageUrl` as paths relative to its own origin (e.g. `/api/v1/branding/assets/logo?v=abc123`, already cache-busted by the backend) — `branding.service.ts` resolves them against `new URL(env.VITE_API_URL).origin` (never `VITE_PUBLIC_GATEWAY_URL`, which is the customer-facing gateway proxy and can be a different host in production). The resolver is idempotent (leaves an already-absolute `http(s)://` URL untouched) as a defensive guard.

**Mutation invalidation**: there is only one real read endpoint (`GET /branding`, public — no separate "admin" branding query exists), so every mutation (name/upload/delete, 7 hooks total) invalidates that single query key on success. This is what makes the Sidebar/Home/Login/document title update immediately after saving in Personalização, with no `window.location.reload()`.

**UI composition**: `BrandingNameForm` (name field, RHF + zod) and `BrandingAssetSection` (shared preview + upload + remove UI, reused 3× for logo/favicon/brand image — `variant="compact"` for logo/favicon, `"large"` for the brand image) are both presentational, driven entirely by props from `PersonalizationPage`. `BrandingAssetSection` does a client-side extension + file-size pre-check (mirroring the real backend per-asset limits in `branding.constants.ts` exactly) before ever calling `onUpload`, so an obviously-invalid file never round-trips to the network. Remove uses the existing `ConfirmationDialog` (not `DeleteConfirmationDialog` — resetting to default isn't a destructive data loss).

**Permission model**: `branding.update` is ADMIN-only-no-exceptions (same pattern as `trustedCas.*` — see `role-permissions.ts`), gating the write controls within the page; the route itself is already gated by the existing `settings.read` (also ADMIN-only wildcard), so no new route-level permission was needed. There is deliberately no `branding.read` — `GET /branding` is public by design.

**Backend bugs found and fixed live during this task** (all authorized by the user in real time, one at a time — see `.ai/CURRENT_TASK.md` for the full list): the global multipart content-type allowlist didn't include the 3 new branding upload routes (415 on every upload); `@fastify/multipart`'s file-size limit is only enforced during `file.toBuffer()`, not `request.file()`, so the try/catch needed to wrap both; Helmet's default `Cross-Origin-Resource-Policy: same-origin` blocked the public asset images from loading cross-origin via `<img src>` (fixed by setting `cross-origin-resource-policy: cross-origin` only on the 3 asset GET routes, not globally).

## File upload / multipart pattern — first introduced Etapa 15

Trusted CAs is the first feature in this codebase to upload a file. Pattern to reuse for any future upload feature:

- Build a real `FormData` in the `.service.ts` function, appending fields with the exact names the backend DTO expects (confirmed against backend source, never guessed) — never convert file content to base64/JSON.
- Never set `Content-Type` manually — let the browser compute the multipart boundary.
- Pass `{ adapter: 'fetch' }` in the axios request config for the specific upload call. `apiClient`'s default `xhr` adapter has inconsistent behavior with `FormData` bodies containing a `File` in this app's test environment (jsdom + MSW) — `fetch` is the reliable adapter for multipart in every browser this app targets, and is also what let the corresponding hook/component tests pass reliably.
- The shared `Input` component (`src/components/ui/input.tsx`) does **not** forward `ref`. To reset a native `<input type="file">` after a successful upload, remount it via a `key` bump (`useState` counter incremented on reset) instead of trying to clear `.value` through a ref.
- In tests, do **not** call `await request.formData()` / `await request.text()` inside an MSW handler that receives a fetch-adapter request built from a `FormData` containing a real `File` — this hangs indefinitely under jsdom in this dependency combination (axios 1.19 + jsdom 29 + msw 2.15). Verify the exact field names sent (`name`, `file`, etc.) at the `.service.ts` level instead, where `apiClient` is mocked and the `FormData` object is inspected directly without going over the network; component/hook-level tests should only check response handling (success/error/reset) and, if needed, the `content-type` header (`multipart/form-data...`) without consuming the body.

## Gateway Routes — `requiresApiKey` (2026-08-08)

`GatewayRoute.requiresApiKey: boolean` (default `true`) — a per-route, ADMIN-only exception that lets a specific route skip X-API-Key validation (every other Gateway protection — Allowed IP, Client/route `active`, TLS, Route Headers — still applies; see `gateway-hub-lf/.ai/BACKEND_CONTRACTS.md` → "Gateway Routes — Optional API Key requirement" for the full backend contract this mirrors). Reusable patterns introduced here:

- **Field-level ADMIN-only inside an OPERATOR-permitted action**: unlike `branding.update`/`branding.delete` (two separate actions, cleanly split in `role-permissions.ts`), this is ONE action (create/edit a route) where a single FIELD is more restricted than the rest of the form. Modeled by checking `useAuth().user?.role.code === 'ADMIN'` directly in the component (`gateway-route-form.tsx`) rather than inventing a new coarse permission string — the checkbox is `disabled` for non-ADMIN (always shows the real value, never forced to `true` visually) and, on submit, the diff-based edit payload only ever includes `requiresApiKey` when it actually changed, so a non-ADMIN's unrelated edit can never incidentally flip it. The backend enforces the same rule independently (`403 REQUIRES_API_KEY_ADMIN_ONLY`) — the frontend gate is UX-only, same "not a security boundary" caveat as every other permission check in this app.
- **Non-silent confirmation before a sensitive field change**: changing `requiresApiKey` (either direction, in both Create and Edit) doesn't submit on click — it opens a `ConfirmationDialog` first (`pendingCreate`/`pendingUpdate` state holding the already-validated form values until confirmed). Disabling uses the new `variant="warning"` (amber); enabling uses the default variant. This is the pattern to reuse for any future "this checkbox needs a deliberate second step before saving" requirement.
- **`ConfirmationDialog` gained `variant?: 'default' | 'destructive' | 'warning'`** (`src/components/shared/confirmation-dialog.tsx`), additive on top of the existing `destructive` boolean (all ~22 other call sites unchanged) — `warning` is amber (new `warning` variant on `buttonVariants`, `ui/button.tsx`), for a sensitive-but-not-destructive change, distinct from the red `destructive` reserved for actual data loss.
- **Alert badge pattern for "this row has a security exception"**: `ApiKeyRequirementBadge` (`components/gateway-routes/api-key-requirement-badge.tsx`) — amber `inline-flex` badge + tooltip, shown only when the exception is active, placed next to (never merged into) the existing `StatusBadge` (Ativo/Inativo is a completely separate concept). Same amber token (`bg-amber-500/10 text-amber-700 dark:text-amber-300`) reused in `gateway-routes-table.tsx` (badge + a subtle `border-l-2 border-l-amber-500` row accent) and `gateway-route-details-drawer.tsx`'s new "Authentication" `DetailRow`. Reuse this exact token combination for any future "works, but has a noteworthy exception" indicator — never red (not an error), never green/blue (not simply safe/neutral).

## Allowed IPs — DNS/Hostname support (2026-08-08)

`AllowedIpType` gained `HOSTNAME` (alongside `IPV4`/`IPV6`/`CIDR_IPV4`/`CIDR_IPV6`) — the backend still has **no `type` input field**, `address` alone drives everything (see `.ai/BACKEND_CONTRACTS.md` → "Allowed IPs" for the confirmed contract; the memory here was stale before this task and had to be re-verified against the real backend source). Reusable pattern introduced:

- **UI-only grouping over a richer backend enum**: `AllowedIpSourceType = 'IP' | 'CIDR' | 'DNS'` (`allowed-ip-form.tsx`) collapses the 5 real `AllowedIpType` values into 3 user-facing buckets purely to drive the `address` field's label/placeholder/hint — its value is **never sent in the payload** (the backend keeps auto-deriving `type` from `address` exactly as before). `sourceTypeFromAllowedIpType()` maps a real `AllowedIp.type` back to the UI bucket for the edit form's initial value — never assumes `IP`. Reuse this "selector drives presentation only, real classification stays server-derived" shape whenever a backend enum is inferred rather than client-supplied but the UI still benefits from a category picker.
- **Basic client-side format guard, scoped to one UI bucket**: when `sourceType === 'DNS'`, a single regex (`/[\s/:]/`) rejects protocol/port/path/whitespace before ever calling the API, via RHF's `setError`/`clearErrors` (not the Zod schema, which stays type-agnostic — one `address: string` field serves all three buckets). This mirrors the project's standing "don't duplicate the backend's real parser" decision (see `ip-address.util.ts`/`hostname-address.util.ts` in `.ai/BACKEND_CONTRACTS.md`) while still catching the single most common mistake (pasting a full URL) with a friendly message.
- **Categorical badge, not a status/warning badge**: `AllowedIpTypeBadge` (`components/allowed-ips/allowed-ip-type-badge.tsx`) — same `inline-flex rounded-full` shape as `MethodBadge`/`RequestOriginBadge`, but slate/sky/violet tones (never amber/red/green) since IP vs CIDR vs DNS is a category, not a health/security signal. Long values (hostnames, unlike IPs/CIDRs, can be up to 253 chars) get `max-w-56 truncate` + a `Tooltip` with the untruncated value, applied only when `type === 'HOSTNAME'` — IP/CIDR cells are untouched.
- **Native `<select>` role collision, worth remembering for tests**: adding a second plain `<select>` next to the shared `Combobox` component (which sets `role="combobox"` on its input) means `getByRole('combobox')` without a `name` filter becomes ambiguous — any test asserting on the client picker must use `getByRole('combobox', { name: 'Client' })` (or the equivalent accessible name) once a form has more than one combobox-role element.
