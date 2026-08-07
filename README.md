# Gateway Hub LF Frontend

Interface administrativa do Gateway Hub LF.

## Stack

- React
- Vite
- TypeScript
- React Router
- TailwindCSS v4
- Shadcn UI (primitivas Radix hand-rolled — ver observação abaixo)
- i18next / react-i18next
- Axios
- TanStack Query
- Zod
- React Hook Form / @hookform/resolvers
- Recharts
- Vitest / Testing Library / MSW

## Requisitos

- Node.js
- npm
- Backend Gateway Hub LF rodando localmente na porta 3110, com
  `http://localhost:5173` (porta padrão do Vite) liberado em `ALLOWED_ORIGINS`
  no CORS do backend

## Instalação

```bash
npm install
```

## Ambiente

Copie o arquivo de exemplo de variáveis de ambiente.

Linux/macOS:

```bash
cp .env.example .env.local
```

Windows:

```cmd
copy .env.example .env.local
```

## Executar

```bash
npm run dev
```

Execute na porta padrão do Vite (5173) — o backend só libera CORS para essa
origem em desenvolvimento.

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Formatação

```bash
npm run format
```

## Testes

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Tipos gerados a partir do OpenAPI

```bash
npm run api:types
```

Regenera `src/types/generated/api-types.ts` a partir de
`http://localhost:3110/docs-json` (backend precisa estar rodando). Nunca
editar esse arquivo manualmente — ele é sobrescrito a cada execução.

## Estrutura

```text
src/
├── app/          # composição do App (App, Providers)
├── assets/       # imagens, ícones e outros arquivos estáticos
├── components/
│   ├── auth/     # componentes visuais de autenticação
│   ├── branding/ # logo e imagem institucional (duda10.png)
│   ├── dashboard/ # componentes do Dashboard
│   ├── language/ # seletor de idioma
│   ├── layout/   # sidebar, shell administrativo, drawer mobile
│   ├── shared/   # componentes genéricos reutilizáveis (tabela, paginação, badges, diálogos)
│   ├── theme/    # botão de alternância de tema
│   ├── users/    # componentes da tela de usuários
│   └── ui/       # primitivas Shadcn UI (button, card, input, sheet, dialog, etc.)
├── config/       # validação de variáveis de ambiente (Zod)
├── contexts/     # ThemeContext, SidebarContext e AuthContext
├── features/     # código organizado por domínio/funcionalidade
│   ├── api-status/ # card de status do backend (useApiHealth)
│   ├── auth/       # login, logout, troca de senha, permissões
│   ├── dashboard/  # serviço, tipos e hooks do Dashboard
│   └── users/      # serviço, tipos, hooks e permissões da tela de usuários
├── hooks/        # useTheme, useSidebar e demais hooks customizados
├── layouts/      # AdminLayout (sidebar + Outlet)
├── lib/
│   ├── api/      # cliente Axios, refresh token, tratamento de erros, TanStack Query
│   └── i18n.ts   # configuração do i18next
├── locales/      # traduções pt-BR, en e es
├── pages/        # componentes de página, um por rota (inclui dashboard/, users/)
├── routes/       # roteador, guards de rota (incl. PermissionRoute) e configuração de navegação
├── services/     # comunicação com APIs externas (ex.: health)
├── stores/       # estado global da aplicação
├── styles/       # estilos globais e tokens de tema
├── test/         # setup global do Vitest e handlers MSW
├── types/
│   └── generated/ # tipos gerados automaticamente a partir do OpenAPI
└── utils/        # funções utilitárias
```

## Design system

- **Tema claro/escuro**: tokens CSS em `src/styles/global.css`, aplicados via
  classe `light`/`dark` no elemento `html`. Persistido em `localStorage`
  (`gateway-hub-lf-theme`), com detecção da preferência do sistema no
  primeiro acesso.
- **Sidebar**: expansível/recolhível, com estado persistido em
  `localStorage` (`gateway-hub-lf-sidebar`). Em telas pequenas, é
  substituída por um drawer (Shadcn `Sheet`).
- **Internacionalização**: `pt-BR` (padrão), `en` e `es`, com idioma
  persistido em `localStorage` (`gateway-hub-lf-language`).
- **Imagens**: `public/duda10.png` (mascote institucional) e
  `public/favicon.svg` (ícone/logo).

## Integração com o backend

- Cliente HTTP único (`src/lib/api/api-client.ts`), com `baseURL` a partir de
  `VITE_API_URL` e `timeout` a partir de `VITE_REQUEST_TIMEOUT`.
- Todas as requisições enviam `X-Request-ID` (UUID) para correlação com os
  logs do backend; o `Authorization: Bearer <token>` é adicionado somente
  quando existe um access token salvo.
- Erros de rede, timeout, cancelamento e erros do backend são normalizados
  em uma única classe `ApiError` (`src/lib/api/api-error.ts`).
- TanStack Query (`src/lib/api/api-query-client.ts`) não repete
  automaticamente erros `400/401/403/404/409/429`.
- Card de status do backend (`GET /health`) na Home.

## Autenticação

- Login, logout, refresh automático, restauração de sessão, primeiro acesso
  e troca obrigatória de senha — ver [`docs/03-authentication.md`](docs/03-authentication.md).
- Tokens em `localStorage` (`src/lib/api/token-storage.ts`); usuário e
  permissões nunca são persistidos, apenas mantidos em memória
  (`AuthContext`).
- Refresh automático em `401` com fila single-flight
  (`src/lib/api/refresh-token.ts`) — evita múltiplas chamadas simultâneas a
  `/auth/refresh`.
- Rotas protegidas/públicas/primeiro-acesso em `src/routes/`
  (`protected-route.tsx`, `public-route.tsx`, `first-login-route.tsx`).

## Dashboard

Painel administrativo real (`/dashboard`), consumindo 6 endpoints reais do
backend (`GET /dashboard/overview`, `requests-over-time`,
`status-distribution`, `top-clients`, `top-routes`, `recent-requests`) —
sem dados mockados. Atualização automática a cada 60s via TanStack Query.
Detalhes completos, incluindo os dados que o backend não expõe (e por isso
não foram inventados) em [`docs/10-dashboard.md`](docs/10-dashboard.md).

## Gestão de usuários

Tela administrativa real (`/users`), consumindo 8 endpoints reais do
backend (`GET /users`, `GET /users/:id`, `POST /users`,
`PATCH /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/status`,
`POST /users/:id/reset-password`, `PATCH /users/:id/password-requirement`,
`GET /roles`) — sem dados mockados. Único módulo hoje restrito por
permissão (`users.read`, via `PermissionRoute`): ADMIN e OPERATOR têm
acesso completo, VIEWER e AUDITOR recebem `403` (mirror exato do backend).
Como `GET /users` não tem paginação/busca/filtro, essas operações são
feitas no cliente sobre a lista completa já retornada. Senha temporária
(criação/reset) exibida uma única vez, nunca persistida. Detalhes
completos em [`docs/11-users.md`](docs/11-users.md).

## Observação sobre o Shadcn UI

O CLI oficial do Shadcn (`npx shadcn@latest`) apresentou um bug no Windows
nesta versão, retornando erro de "unsafe file path" para qualquer preset ou
biblioteca de componentes. As primitivas necessárias (`button`, `card`,
`separator`, `tooltip`, `dropdown-menu`, `sheet`, `dialog`) foram
implementadas manualmente em `src/components/ui/`, seguindo a mesma convenção de código,
variantes (`class-variance-authority`) e dependências Radix que o CLI teria
gerado. `components.json` foi mantido para documentar a configuração de
aliases.

## Documentação

Consultar a pasta [`docs/`](docs/).

## Status

Etapa 6 — Gestão de usuários concluída.
