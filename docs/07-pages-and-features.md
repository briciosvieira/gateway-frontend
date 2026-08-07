# Páginas e funcionalidades

## Páginas implementadas

| Rota               | Descrição                                             | Status    |
| ------------------ | ----------------------------------------------------- | --------- |
| `/`                | Home institucional (hero + cards + status do backend) | Concluída |
| `/login`           | Login funcional                                       | Concluída |
| `/change-password` | Troca de senha (obrigatória ou voluntária)            | Concluída |
| `/dashboard`       | Dashboard administrativo (dados reais do backend)     | Concluída |
| `/users`           | Gestão de usuários (dados reais do backend)           | Concluída |
| `/403`             | Acesso negado                                         | Concluída |
| `/*`               | Página 404                                            | Concluída |

`/dashboard` está detalhado em [`10-dashboard.md`](./10-dashboard.md).
`/users` está detalhado em [`11-users.md`](./11-users.md) — única rota
administrativa hoje protegida também por permissão (`PermissionRoute`,
`users.read`), além da autenticação.

## Páginas provisórias (dentro do `AdminLayout`, atrás de `ProtectedRoute`)

| Rota              | Descrição                       | Status            |
| ----------------- | ------------------------------- | ----------------- |
| `/clients`        | Gestão de clientes              | Página provisória |
| `/api-keys`       | Gestão de chaves de API         | Página provisória |
| `/allowed-ips`    | Gestão de IPs permitidos        | Página provisória |
| `/gateway-routes` | Gestão de rotas do gateway      | Página provisória |
| `/route-headers`  | Gestão de cabeçalhos de rota    | Página provisória |
| `/audit-logs`     | Consulta de logs de auditoria   | Página provisória |
| `/request-logs`   | Consulta de logs de requisições | Página provisória |

"Página provisória" indica que a rota usa o componente genérico
`PlaceholderPage`, exibindo o título traduzido do módulo e uma mensagem
informando que a página será implementada em etapa futura — agora atrás de
autenticação real, não mais publicamente acessível.

## Pendente

| Item       | Descrição                     | Status   |
| ---------- | ----------------------------- | -------- |
| `/profile` | Perfil do usuário autenticado | Pendente |

Não há endpoint de perfil detalhado no backend além de `GET /auth/me`
(já usado internamente pelo `AuthContext`); uma página de perfil dedicada
fica para uma etapa futura.
