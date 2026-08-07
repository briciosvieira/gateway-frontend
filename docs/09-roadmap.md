# Roadmap

## Etapa 1 — Fundação

- [x] React + Vite
- [x] TypeScript
- [x] Estrutura de pastas
- [x] React Router
- [x] Alias
- [x] Variáveis de ambiente
- [x] ESLint
- [x] Prettier
- [x] README
- [x] Documentação inicial

## Etapa 2 — Design system e layout base

- [x] TailwindCSS v4
- [x] Shadcn UI (primitivas hand-rolled — ver README)
- [x] Tema claro/escuro com persistência
- [x] Sidebar expansível/recolhível com persistência
- [x] Sidebar mobile (drawer)
- [x] Internacionalização (pt-BR, en, es) com persistência
- [x] Home institucional com hero image e cards
- [x] Login visual provisório (sem autenticação)
- [x] Páginas provisórias para os módulos administrativos
- [x] Componentes base (button, card, separator, tooltip, dropdown-menu,
      sheet)

## Etapa 3 — Integração técnica com o backend

- [x] Axios (cliente único, `baseURL`/`timeout` via env)
- [x] Interceptors (`X-Request-ID`, `Authorization` condicional,
      normalização de erros)
- [x] Tipos de resposta (`ApiSuccessResponse`, `ApiErrorResponse`,
      paginação)
- [x] Tratamento global de erros (`ApiError`, `getApiErrorMessage`,
      traduções `api.errors.*`)
- [x] Zod para validação de variáveis de ambiente
- [x] TanStack Query configurado (retry seletivo, sem polling agressivo)
- [x] Armazenamento de tokens preparado (`token-storage.ts`, não usado
      ainda)
- [x] Tipos OpenAPI gerados (`npm run api:types`)
- [x] Health check real (`GET /health`) exibido na Home
- [x] Vitest configurado com testes unitários da camada HTTP
- [ ] Meta service — endpoint `/meta` não existe no backend ainda

## Etapa 4 — Autenticação completa

- [x] Login funcional (`POST /auth/login`, React Hook Form + Zod)
- [x] Refresh token automático com fila single-flight (evita chamadas
      simultâneas a `/auth/refresh`)
- [x] Restauração de sessão ao recarregar (`GET /auth/me`)
- [x] Primeiro acesso e troca obrigatória de senha (política de senha
      idêntica ao backend)
- [x] Logout real (`POST /auth/logout`, melhor esforço, sempre limpa a
      sessão local)
- [x] Rotas protegidas/públicas/primeiro-acesso (`ProtectedRoute`,
      `PublicRoute`, `FirstLoginRoute`)
- [x] Sessão expirada tratada de forma centralizada (evento +
      `sessionStorage`)
- [x] Sidebar mostra usuário autenticado e papel
- [x] Permissões derivadas do papel no cliente (endpoint real não existe)
- [x] Testes unitários e de integração da camada de autenticação (MSW)
- [x] Validação manual completa contra o backend real
- [ ] `GET /auth/permissions` — endpoint não existe no backend ainda
- [ ] Login com papéis diferentes de ADMIN — sem outros usuários seedados

## Etapa 5 — Dashboard administrativo

- [x] 6 endpoints reais de `/dashboard` integrados (`overview`,
      `requests-over-time`, `status-distribution`, `top-clients`,
      `top-routes`, `recent-requests`) — sem dados mockados
- [x] Cards de indicadores (clientes, chaves de API, rotas, requisições,
      erros, taxa de sucesso) com skeleton por card
- [x] Indicadores de desempenho (tempo médio e máximo de resposta)
- [x] Gráficos com Recharts (requisições ao longo do tempo, distribuição
      por status HTTP), tema-aware (claro/escuro)
- [x] Tabelas de principais clientes, principais rotas e últimas
      requisições
- [x] Atualização automática a cada 60s via TanStack Query
- [x] Estados de loading (skeleton), erro (com "tentar novamente") e sem
      dados, independentes por seção
- [x] Componentes reutilizáveis (`DashboardCard`, `DashboardSection`,
      `DashboardChart`, `DashboardTable`, `DashboardSkeleton`,
      `DashboardEmptyState`, `DashboardErrorState`)
- [x] Internacionalização completa (pt-BR, en, es)
- [x] Acessibilidade (`aria-label` em cards e gráficos, `<caption>`/`<th
scope="col">` nas tabelas)
- [x] Testes unitários (service, hooks, componentes)
- [x] Validação manual completa contra o backend real (encontrado e
      corrigido bug de repaint dos gráficos no tema escuro)
- [x] Barra de filtros com seletor de período real (`today`/`last7days`/
      `last30days`/`last90days`/`custom`), propagado às 6 chamadas do
      Dashboard; comboboxes de cliente/rota e filtro de status preparados
      (endpoints reais de busca) mas não aplicados aos indicadores — o
      backend do Dashboard não aceita esses filtros (ver `10-dashboard.md`)
- [x] Política de scroll definitiva (`<main>` como único container com
      rolagem vertical; Sidebar sem scroll próprio) — ver
      `02-architecture.md`/`06-ui-guidelines.md`
- [ ] "Últimos Logs Administrativos" — omitido por conflito com a regra de
      exclusão de Audit Logs nesta etapa (ver `10-dashboard.md`)

## Etapa 6 — Gestão de usuários

- [x] 8 endpoints reais de `/users` e `/roles` integrados (listar,
      detalhar, criar, editar, alterar perfil, alterar status, resetar
      senha, alterar exigência de troca de senha) — sem dados mockados
- [x] Listagem, pesquisa (debounce), filtros por perfil/status/primeiro
      acesso e ordenação client-side, com paginação e query string
      sincronizada (`GET /users` não tem esses parâmetros no backend)
- [x] Criação de usuário com senha temporária exibida uma única vez
      (nunca persistida em `localStorage`/estado global/console)
- [x] Edição (nome/username/e-mail), alterar perfil, ativar/desativar,
      resetar senha e alterar exigência de troca de senha, cada um com seu
      endpoint dedicado e diálogo de confirmação
- [x] Permissões: `users.*` para ADMIN/OPERATOR, nenhuma para
      VIEWER/AUDITOR (mirror do guard real do backend); dicas de UI por
      linha para as regras de OPERATOR não gerenciar ADMIN e de não
      auto-desativação/auto-demoção
- [x] Menu e rota `/users` (via `PermissionRoute`) respeitam `users.read`
- [x] Componentes reutilizáveis novos em `src/components/shared/`
      (`PageHeader`, `DataTablePagination`, `SearchInput`, `FilterSelect`,
      `StatusBadge`, `RoleBadge`, `ConfirmationDialog`, `CopyField`,
      `TableSkeleton`, `TableEmptyState`, `TableErrorState`) e primitivo
      `Dialog` (Radix) em `src/components/ui/`
- [x] Internacionalização completa (pt-BR, en, es)
- [x] Testes unitários e de componente (service, hooks, view-utils,
      permissões, tabela, diálogos)
- [ ] `DELETE` de usuário — endpoint não existe no backend
- [ ] Escolher exigência de troca de senha ao resetar senha — o backend
      não aceita corpo em `POST /users/:id/reset-password`

## Demais etapas

- [ ] CRUDs administrativos (clientes, chaves de API, IPs permitidos,
      rotas do gateway, cabeçalhos de rota)
- [ ] Logs de auditoria e de requisições
- [ ] Matriz visual completa de permissões por módulo
- [ ] Página de perfil do usuário autenticado (`/profile`)
- [ ] Testes de componentes das páginas de autenticação, de rotas e E2E
- [ ] Docker, Nginx e deploy
