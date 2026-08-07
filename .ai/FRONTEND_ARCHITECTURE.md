# Frontend Architecture

This file was empty before Etapa 15 (Configurações). It is not a full retroactive audit of every prior module — only architecture that a future etapa needs to know about to extend "Configurações" or add a similarly structured settings-like area.

## Configurações (Settings) area — added Etapa 15 (2026-08-07)

Two-level navigation:

```
Main Sidebar (src/routes/nav-items.ts)
  └─ "Configurações" (last item, ADMIN only via `settings.read`)
       └─ AdminLayout <main> (the app's one true vertical scroll container)
            └─ SettingsLayout (src/layouts/settings-layout.tsx)
                 ├─ outer title/description ("Configurações")
                 ├─ SettingsSidebar (src/components/settings/settings-sidebar.tsx)
                 │    — secondary, in-page nav; vertical column on desktop
                 │      (md:w-56 md:flex-col), horizontal scrollable strip on
                 │      narrow screens (overflow-x-auto) — never a squeezed
                 │      narrow column, never its own vertical scrollbar
                 └─ <Outlet /> → the selected setting's page
                      (currently only `/settings/certificates` → CertificatesPage)
```

- `SETTINGS_NAV_ITEMS` (`src/routes/settings-nav-items.ts`) is the single source of truth for the secondary sidebar's entries — currently just Certificados. **Adding a future section (Segurança, Gateway, Retenção, Sistema) means appending one `NavItem` here plus one new route under `/settings/*` in `app-router.tsx` — nothing else in `SettingsSidebar`/`SettingsLayout` needs to change.**
- Route redirect: `/settings` (index) → `Navigate to="/settings/certificates" replace` — so `/settings` never renders a blank page even with a single section.
- Permission model: `settings.read` gates the nav item + the whole `/settings/*` route tree (via `PermissionRoute`, redirecting to `/403`). It is granted to ADMIN only, through the wildcard `'*'` in `ROLE_PERMISSIONS.ADMIN` — never added to OPERATOR/VIEWER/AUDITOR's arrays. Per-feature permissions inside a settings page (e.g. `trustedCas.create/status/delete`) follow the same ADMIN-only pattern when the real backend controller is ADMIN-only for that module.
- Scroll policy (per `.ai/UI_RULES.md`): neither `SettingsLayout` nor `SettingsSidebar` nor any settings page may add `h-screen`/`h-dvh`/`overflow-y-auto` — `AdminLayout`'s `<main>` remains the sole scroll container. Verified by `settings-layout.test.tsx` / `settings-sidebar.test.tsx` asserting those classes are absent.

## Per-module feature file convention (as of Etapa 15)

Two conventions coexist in this codebase; pick based on which the module more closely resembles:

- **Route Headers style** (full CRUD + status + delete, no separate details endpoint beyond `GET /:id`): a single `src/features/{module}/{module}.hooks.ts` with an inline `{module}Keys` query-key object, plus `.types.ts`/`.schemas.ts`/`.constants.ts`/`.service.ts`. Used by Route Headers and, as of this etapa, Trusted CAs.
- **Request Logs style** (read-only, heavier querying surface): split `hooks/` directory + separate `.query-keys.ts`.

Query key shape either way: `{all, lists(), list(params), details(), detail(id)}`. Mutations invalidate `lists()` and either invalidate or `removeQueries` on `detail(id)` depending on whether the record can still exist after the mutation (status change → invalidate; delete → `removeQueries`).

## Client-scoped resource views — API Keys / Allowed IPs / Gateway Routes (2026-08-07)

These three features' main pages were reorganized from "one row per resource" to "one row per client" (with potentially thousands of clients/resources, repeating the same client name on every row didn't scale visually). The pattern, identical across all three:

```
{Feature}Page (e.g. api-keys-page.tsx)
  ├─ PageHeader (unchanged title/description) + global "+ New X" button
  │    → opens the existing CreateXForm with a normal, user-editable client picker
  ├─ ClientFilters (src/components/clients/client-filters.tsx — REUSED AS-IS,
  │    not a new component; this page now paginates/searches/sorts CLIENTS,
  │    via `useClients(params)`, exactly like the Clients page does)
  ├─ ClientResourceListTable (src/components/shared/client-resource-list-table.tsx
  │    — new shared component: Cliente | Identificador | Status | Ações,
  │    row click + an explicit "Ver X" button both call `onOpenClient`)
  └─ {Feature}ClientDrawer (e.g. api-key-client-drawer.tsx — new per feature)
       ├─ Sheet + SheetContent (`sm:max-w-4xl`, wider than the default `w-72`)
       ├─ ClientResourceDrawerHeader (src/components/shared/client-resource-drawer-header.tsx
       │    — new shared component: client name, code, and `client.active`
       │    status, labeled "Status do cliente" — this is administrative
       │    client info, NEVER the resource-derived status described below)
       ├─ "+ New X" → same CreateXForm, passed `lockedClient={client}` (renders
       │    a read-only client display instead of the Combobox; no GET /clients call)
       ├─ {Feature}Filters with `showClientFilter={false}` (hides the now-redundant
       │    client combobox filter — every other filter/sort option unchanged)
       └─ the existing {Feature}Table + DataTablePagination + every existing
            dialog (status/revoke/regenerate/delete/details), unchanged —
            queried via the real `GET /{feature}?clientId=<id>&...`, paginated
            server-side, exactly like the old page did but scoped to one client
```

**Component split to avoid conditional-hooks violations:** each `*ClientDrawer` is `<Sheet>{client && <XClientDrawerContent client={client} />}</Sheet>` — the actual data-fetching/state-holding component only mounts once a client is selected (never called with a possibly-null client), and gets `key={client.id}` so switching clients cleanly remounts (fresh filters/dialog state) instead of reusing stale state across clients.

**Backward-compatible additive props** (both default to the old behavior, so every pre-existing usage/test needed zero changes):
- `CreateApiKeyForm`/`CreateAllowedIpForm`/`CreateGatewayRouteForm` gained an optional `lockedClient?: {id, name, code}` prop.
- `ApiKeyFilters`/`AllowedIpFilters`/`GatewayRouteFilters` gained an optional `showClientFilter?: boolean` (default `true`).

**Current limitation, blocked on backend — do not "fix" this client-side:** the main table currently shows **every** client (even ones with zero resources for that feature) and its Status column is `client.active`, not a resource-derived status. Product wants both changed (hide empty clients, derive Status from the resources), but that requires backend-side aggregation to keep pagination exact at scale — see `.ai/BACKEND_CONTRACTS.md` → "Missing: per-client aggregate endpoints" for the full spec already written for this. Do not attempt a load-all, N+1, or approximate-pagination workaround for this — it was explicitly evaluated and rejected.

## File upload / multipart pattern — first introduced Etapa 15

Trusted CAs is the first feature in this codebase to upload a file. Pattern to reuse for any future upload feature:

- Build a real `FormData` in the `.service.ts` function, appending fields with the exact names the backend DTO expects (confirmed against backend source, never guessed) — never convert file content to base64/JSON.
- Never set `Content-Type` manually — let the browser compute the multipart boundary.
- Pass `{ adapter: 'fetch' }` in the axios request config for the specific upload call. `apiClient`'s default `xhr` adapter has inconsistent behavior with `FormData` bodies containing a `File` in this app's test environment (jsdom + MSW) — `fetch` is the reliable adapter for multipart in every browser this app targets, and is also what let the corresponding hook/component tests pass reliably.
- The shared `Input` component (`src/components/ui/input.tsx`) does **not** forward `ref`. To reset a native `<input type="file">` after a successful upload, remount it via a `key` bump (`useState` counter incremented on reset) instead of trying to clear `.value` through a ref.
- In tests, do **not** call `await request.formData()` / `await request.text()` inside an MSW handler that receives a fetch-adapter request built from a `FormData` containing a real `File` — this hangs indefinitely under jsdom in this dependency combination (axios 1.19 + jsdom 29 + msw 2.15). Verify the exact field names sent (`name`, `file`, etc.) at the `.service.ts` level instead, where `apiClient` is mocked and the `FormData` object is inspected directly without going over the network; component/hook-level tests should only check response handling (success/error/reset) and, if needed, the `content-type` header (`multipart/form-data...`) without consuming the body.
