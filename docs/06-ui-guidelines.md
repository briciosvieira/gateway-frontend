# Diretrizes de UI

## Design system implementado (Etapa 2)

- **TailwindCSS v4**: utilitário principal de estilização, configurado via
  plugin do Vite (`@tailwindcss/vite`), sem arquivo `tailwind.config.js`
  (configuração inline em `src/styles/global.css`).
- **Shadcn UI**: primitivas em `src/components/ui/` (`button`, `card`,
  `separator`, `tooltip`, `dropdown-menu`, `sheet`), construídas sobre Radix
  UI e `class-variance-authority`.
- **Tokens de tema**: única fonte de verdade de cor, definida em
  `src/styles/global.css` como variáveis CSS (`--background`,
  `--foreground`, `--sidebar`, `--primary`, `--border`, `--muted`, etc.),
  mapeadas para utilitários Tailwind via `@theme inline`. Nenhuma cor é
  escrita diretamente nos componentes.
- **Tema claro/escuro**: classe `light`/`dark` no elemento `html`,
  persistida em `localStorage` (`gateway-hub-lf-theme`). Um script inline em
  `index.html` aplica a classe antes da primeira renderização, evitando
  flash do tema incorreto.
- **Sidebar expansível/recolhível**: larguras de 280px (expandida) e 80px
  (recolhida), com estado persistido em `localStorage`
  (`gateway-hub-lf-sidebar`). Em telas abaixo do breakpoint `md`, é
  substituída por um drawer (`Sheet`).
- **Internacionalização**: `pt-BR` (padrão), `en` e `es`, via
  `i18next`/`react-i18next`, com idioma persistido em `localStorage`
  (`gateway-hub-lf-language`) e refletido no atributo `lang` do `html`.

## Interface limpa

Priorizar clareza e objetividade nas telas administrativas, evitando
elementos visuais que não agreguem valor à tarefa do usuário. A Home usa
gradiente suave (`surface` → `background` → `surface-soft`) e formas
discretas, sem comprometer a legibilidade do texto institucional.

## Responsiva

Breakpoints usados (padrão Tailwind: `sm`, `md`, `lg`):

- **Desktop** (`md` e acima): sidebar fixa, layout em duas colunas na Home
  e no Login, cards em grade de até três colunas.
- **Tablet**: mesma estrutura do desktop; a sidebar pode ser recolhida
  manualmente pelo usuário.
- **Mobile** (abaixo de `md`): sidebar oculta, substituída por um header
  com logo e botão de menu (drawer); Home e Login em coluna única, com a
  imagem institucional posicionada acima do conteúdo textual/formulário.

`overflow: hidden` é aplicado em `html`, `body` e `#root` (altura 100%) para
impedir qualquer scroll nesses elementos — ver a política de scroll completa
em [`02-architecture.md`](./02-architecture.md#política-de-scroll). Em
resumo: `<main>` é o único container com `overflow-y-auto` da aplicação; a
Sidebar nunca rola; páginas não devem definir `h-screen`/`h-dvh`/
`overflow-y-auto` na própria raiz; tabelas usam `overflow-x-auto` apenas
quando o conteúdo não cabe horizontalmente.

## Acessível

- Botões reais (`<button>`) em todos os controles interativos, com
  `aria-label` nos que possuem apenas ícone (tema, idioma, logout, abrir/
  recolher menu).
- Imagens com `alt` traduzido (`HeroImage`) ou `alt=""` quando puramente
  decorativas (ícone da sidebar, que já é acompanhado de texto).
- Tooltips (`Tooltip` do Shadcn) nos itens da sidebar quando recolhida,
  garantindo que o significado do ícone não se perca.
- Foco visível via `:focus-visible` com contorno baseado no token `--ring`.
- Atributo `lang` do `html` sincronizado com o idioma ativo.

## Estados de loading

Toda operação assíncrona (carregamento de dados, submissão de formulários)
deve comunicar visualmente que está em andamento. Ainda não aplicável nesta
etapa, pois não há chamadas assíncronas reais.

## Estados de erro

Erros de requisição ou de validação devem ser comunicados de forma clara,
sem expor detalhes técnicos desnecessários ao usuário final. O login
provisório já demonstra o padrão de mensagem de feedback (embora, nesta
etapa, apenas informativa e não de erro).

## Estados vazios

Listagens sem resultados devem exibir uma mensagem explicativa, evitando
telas em branco sem contexto. As páginas provisórias (`PlaceholderPage`)
seguem esse padrão: ícone, título e mensagem central.

## Confirmações

Ações destrutivas ou irreversíveis (exclusão, revogação de chaves, etc.)
devem exigir confirmação explícita do usuário antes de serem executadas.
Ainda não aplicável nesta etapa.

## Consistência visual

Reutilizar os mesmos padrões visuais e de interação em todas as telas
administrativas. Cards, botões e tipografia seguem as primitivas Shadcn UI
e os tokens de tema em todas as páginas desta etapa.

## Fora de escopo nesta etapa

Estados de loading/erro reais dependem de integração com o backend
(Etapa 3) e não foram implementados.
