# Rotas e permissões

## Rotas existentes

Definidas em `src/routes/app-router.tsx`.

| Rota               | Guard                                              | Camada        | Conteúdo                                                              |
| ------------------ | -------------------------------------------------- | ------------- | --------------------------------------------------------------------- |
| `/login`           | `PublicRoute`                                      | standalone    | Login funcional                                                       |
| `/change-password` | `FirstLoginRoute`                                  | standalone    | Troca de senha (obrigatória ou não)                                   |
| `/`                | `ProtectedRoute`                                   | `AdminLayout` | Home institucional                                                    |
| `/dashboard`       | `ProtectedRoute`                                   | `AdminLayout` | Dashboard administrativo (ver [`10-dashboard.md`](./10-dashboard.md)) |
| `/users`           | `ProtectedRoute` + `PermissionRoute('users.read')` | `AdminLayout` | Gestão de usuários (ver [`11-users.md`](./11-users.md))               |
| `/clients`         | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/api-keys`        | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/allowed-ips`     | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/gateway-routes`  | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/route-headers`   | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/audit-logs`      | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/request-logs`    | `ProtectedRoute`                                   | `AdminLayout` | Página provisória                                                     |
| `/403`             | nenhum                                             | standalone    | Acesso negado                                                         |
| `/*`               | nenhum                                             | standalone    | 404                                                                   |

## Guards de rota

### `ProtectedRoute` (`src/routes/protected-route.tsx`)

- `isInitializing` → mostra `AuthLoadingScreen` (evita flash de login).
- `!isAuthenticated` → redireciona para `/login`, preservando a rota
  pretendida em `location.state.from`.
- `mustChangePassword` → redireciona para `/change-password`.
- Caso contrário, renderiza `<Outlet />` (dentro de `AdminLayout`).

### `PublicRoute` (`src/routes/public-route.tsx`)

- `isInitializing` → `AuthLoadingScreen`.
- `isAuthenticated` → redireciona para `/change-password` (se
  `mustChangePassword`) ou para `location.state.from` (se existir) ou para
  `/`. É essa lógica — não um `navigate()` do formulário de login — que
  decide para onde ir depois de um login bem-sucedido.
- Caso contrário, renderiza `<Outlet />` (a tela de login).

### `FirstLoginRoute` (`src/routes/first-login-route.tsx`)

- `!isAuthenticated` → redireciona para `/login`.
- Caso contrário, renderiza `<Outlet />`. Não é exclusiva para primeiro
  acesso: qualquer usuário autenticado pode chegar em `/change-password`
  (um usuário já onboarded trocando a senha voluntariamente também faria
  sentido, ainda que não haja hoje nenhum link para isso na UI).

### `PermissionRoute` (`src/routes/permission-route.tsx`)

Introduzido na Etapa 6. Recebe uma `permission` e redireciona para `/403`
quando `usePermissions().hasPermission(permission)` é falso; caso
contrário renderiza `<Outlet />`. Usado hoje apenas em `/users`
(`permission="users.read"`), aninhado dentro de `ProtectedRoute` +
`AdminLayout`. Mesma ressalva das demais checagens de permissão: é
client-side, não uma fronteira de segurança — o backend responde `403` de
qualquer forma.

## Permissões

O backend **não expõe** `GET /auth/permissions` (confirmado: rota
inexistente no controller). Nesta etapa, permissões são derivadas
localmente a partir do `role.code` do usuário
(`src/features/auth/role-permissions.ts`):

- **ADMIN**: acesso irrestrito (`*`).
- **OPERATOR**: leitura de dashboard, clientes, API Keys, IPs permitidos,
  rotas do gateway, cabeçalhos de rota e request logs, mais o módulo
  completo de usuários (`users.*` — leitura, criação, edição, status,
  perfil, reset de senha e exigência de troca de senha).
- **VIEWER**: mesmas leituras do OPERATOR, exceto request logs e usuários
  (o backend retorna `403` em qualquer endpoint de `/users` para VIEWER).
- **AUDITOR**: dashboard, audit logs e request logs (sem acesso a
  usuários, mesma razão do VIEWER).

`useAuth().hasPermission(permission)` e o hook `usePermissions()` expõem
essa verificação. **Isto não é uma fronteira de segurança** — é só uma
conveniência de UI; o backend é sempre a autoridade final. Desde a Etapa
6, o item "Usuários" do menu (`NavItem.permission`) e a própria rota
`/users` (via `PermissionRoute`) já respeitam `users.read` — os demais
itens do menu continuam sempre visíveis (fora de escopo até que os
módulos correspondentes existam). A matriz visual completa por módulo
fica para uma etapa futura, quando (e se) o backend expuser permissões
reais.

## Fora de escopo nesta etapa

Ocultar do menu os itens cujos módulos ainda não existem, página de
detalhe de perfil do próprio usuário e qualquer CRUD administrativo além
de usuários.
