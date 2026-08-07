# Arquitetura

## Estrutura de pastas

```text
src/
├── app/
├── assets/
├── components/
│   ├── branding/
│   ├── language/
│   ├── layout/
│   ├── theme/
│   └── ui/
├── config/
├── contexts/
├── features/
│   └── api-status/
├── hooks/
├── layouts/
├── lib/
│   └── api/
├── locales/
├── pages/
├── routes/
├── services/
│   └── health/
├── stores/
├── styles/
├── test/
├── types/
│   └── generated/
└── utils/
```

## Responsabilidade de cada pasta

### `app`

Composição raiz da aplicação. Contém o componente `App`, responsável apenas
por renderizar o `RouterProvider`, e o `AppProviders`, responsável por
encapsular os providers globais. `AppProviders` compõe `ThemeProvider`,
`SidebarProvider` e `QueryClientProvider` (TanStack Query); autenticação e
notificações serão adicionados em etapas futuras. Não contém regra de
negócio nem layout definitivo.

### `assets`

Imagens, ícones e demais arquivos estáticos importados pelo código-fonte.
As imagens institucionais (`duda10.png` e `favicon.svg`) ficam em `public/`,
não em `assets/`, pois são referenciadas por caminho absoluto (`/duda10.png`)
e usadas fora do grafo de módulos do bundler.

### `components`

Componentes de UI reutilizáveis e agnósticos de domínio, organizados em
subpastas por responsabilidade:

- `branding/`: `AppLogo` (símbolo + nome, usado no topo da sidebar) e
  `HeroImage` (mascote institucional, usado na Home e no Login).
- `language/`: `LanguageSelector`, dropdown de seleção de idioma.
- `layout/`: `Sidebar` (desktop), `SidebarItem`, `SidebarFooter`,
  `MobileSidebar` (drawer) e `AppShell` (composição responsiva entre
  sidebar, header mobile e conteúdo).
- `theme/`: `ThemeToggle`, botão de alternância claro/escuro.
- `ui/`: primitivas Shadcn UI (`button`, `card`, `separator`, `tooltip`,
  `dropdown-menu`, `sheet`).

### `config`

Validação de configuração da aplicação. `env.ts` valida as variáveis
`VITE_*` com Zod na inicialização, falhando de forma explícita (e sem
imprimir valores) caso alguma esteja ausente ou em formato inválido.

### `contexts`

Contextos React compartilhados entre múltiplas partes da aplicação:
`ThemeContext` (tema claro/escuro) e `SidebarContext` (estado
expandido/recolhido da sidebar).

### `features`

Código organizado por domínio de negócio, agrupando componentes, hooks e
lógica específicos de cada funcionalidade administrativa. Primeira feature
implementada: `api-status/` (`ApiStatusCard` + `useApiHealth`), a primeira
integração real com o backend.

### `hooks`

Hooks customizados reutilizáveis: `useTheme` e `useSidebar` (acesso aos
contextos de tema e sidebar), além de hooks futuros não vinculados a uma
feature específica.

### `layouts`

Componentes de layout que definem a estrutura visual das páginas.
`AdminLayout` renderiza o `AppShell` (sidebar + área de conteúdo) e o
`Outlet` das rotas administrativas. Ainda não contém autenticação.

### `lib`

Configuração e inicialização de bibliotecas de terceiros: `utils.ts` (helper
`cn` para composição de classes Tailwind), `i18n.ts` (configuração do
i18next) e `api/` — a camada HTTP:

- `api-client.ts`: instância única do Axios, com interceptors de requisição
  (`X-Request-ID`, `Authorization` quando há token) e de resposta
  (normalização de erros em `ApiError`).
- `api-error.ts`: classe `ApiError` e type guard `isApiError`.
- `api-response.ts`: `getApiErrorMessage`, tradutor de erros para mensagens
  seguras e amigáveis.
- `api-query-client.ts`: instância do `QueryClient` do TanStack Query.
- `request-id.ts`: gerador de UUID para correlação com os logs do backend.
- `token-storage.ts`: abstração sobre `localStorage` para os tokens de
  sessão (ainda não usada por nenhum fluxo real).

### `locales`

Arquivos de tradução por idioma (`pt-BR`, `en`, `es`), consumidos pelo
`i18next`.

### `pages`

Componentes de página, um por rota. Inclui `home`, `login`, `not-found` e
`placeholder` (página genérica reutilizada pelas rotas administrativas
ainda não implementadas).

### `routes`

Definição centralizada das rotas da aplicação: o roteador
(`app-router.tsx`) e a configuração de itens de navegação
(`nav-items.ts`), compartilhada entre a sidebar e o roteador. Rotas
protegidas e permissões serão adicionadas em etapa futura.

### `services`

Camada de comunicação com APIs externas, uma subpasta por domínio
(`{domínio}.service.ts` + `{domínio}.types.ts`). Implementado nesta etapa:
`health/` (`GET /health`). `services/index.ts` reexporta apenas os services
públicos. Não há `meta/` — o endpoint `/meta` não existe no backend (ver
[`05-api-integration.md`](./05-api-integration.md)).

### `stores`

Estado global da aplicação (ex.: sessão do usuário, preferências). Ainda não
implementado nesta etapa.

### `styles`

Estilos globais da aplicação, incluindo o `global.css` com a importação do
Tailwind e os tokens de tema (claro/escuro).

### `test`

Setup global do Vitest (`setup.ts`), que registra os matchers do
`@testing-library/jest-dom`.

### `types`

Tipos e interfaces TypeScript compartilhados: `NavItem` (item de navegação
da sidebar), `api.ts` (envelope de sucesso/erro do backend) e
`pagination.ts` (meta de paginação, ainda não consumida). `generated/`
contém `api-types.ts`, gerado automaticamente a partir do OpenAPI do
backend via `npm run api:types` — nunca editado manualmente.

### `utils`

Funções utilitárias puras, sem dependência de estado ou de contexto React.

## Princípios

- Separação entre composição (`app`), roteamento (`routes`) e apresentação
  (`pages`, `components`, `layouts`).
- Código organizado por domínio dentro de `features` conforme a aplicação
  crescer.
- Nenhuma regra de negócio no componente raiz (`App`).
- Imports absolutos usando o alias `@/` para evitar caminhos relativos
  longos.
- Tokens de tema como única fonte de verdade de cor: nenhuma cor é escrita
  diretamente nos componentes, apenas classes Tailwind ligadas às variáveis
  CSS de `global.css`.

## Política de scroll

A aplicação possui apenas **um** container com rolagem vertical: o
`<main>` dentro de `AppShell`. Nenhum outro elemento entre ele e o
`<html>` pode criar uma segunda barra de rolagem vertical.

```text
html/body/#root:  overflow: hidden (altura 100%, nunca rolam)
Sidebar:          fixa, h-dvh, overflow-hidden — nunca rola
Main content:     único container com overflow-y-auto
Páginas:          sem h-screen/h-dvh/overflow-y-auto na raiz
Tabelas:          overflow-x-auto apenas quando necessário; nunca overflow-y
Modais/Sheets:    podem ter rolagem interna própria (são sobrepostos, não
                  fazem parte do fluxo de scroll da página)
```

Qualquer página ou componente novo deve herdar o scroll do `<main>` — não
criar `overflow-y-auto`/`h-screen`/`h-dvh`/`max-h-screen` na própria raiz.
