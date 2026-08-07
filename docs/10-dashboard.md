# Dashboard administrativo

Implementado na Etapa 5, consumindo exclusivamente endpoints reais do
backend — nenhum dado é mockado ou inventado.

## Endpoints utilizados

O backend não possui um único endpoint `/dashboard` que agrega tudo; é uma
família de sub-rotas independentes, todas sob `/api/v1/dashboard`,
protegidas por autenticação e liberadas para os quatro papéis (`ADMIN`,
`OPERATOR`, `AUDITOR`, `VIEWER`):

| Endpoint                             | Uso no frontend                              |
| ------------------------------------ | -------------------------------------------- |
| `GET /dashboard/overview`            | Cards superiores + indicadores de desempenho |
| `GET /dashboard/requests-over-time`  | Gráfico de requisições ao longo do tempo     |
| `GET /dashboard/status-distribution` | Gráfico de distribuição por status HTTP      |
| `GET /dashboard/top-clients`         | Tabela de principais clientes                |
| `GET /dashboard/top-routes`          | Tabela de principais rotas                   |
| `GET /dashboard/recent-requests`     | Tabela de últimas requisições                |

Todas aceitam `period` (padrão `last7days`) — a barra de filtros descrita
abaixo em [Filtros](#filtros) expõe esse seletor de período de forma real.

Os endpoints `GET /dashboard/top-errors`, `GET /dashboard/top-source-ips` e
`GET /dashboard/health` existem no backend mas não são consumidos, pois a
especificação desta etapa não pedia essas seções.

## Filtros

Barra de filtros (`DashboardFilters`,
`src/components/dashboard/dashboard-filters.tsx`) acima das seções do
Dashboard:

- **Período**: `today`, `last7days` (padrão), `last30days`, `last90days`,
  `custom` (exibe seletor de data inicial/final). **Funcional** — o valor
  escolhido é propagado como `period`/`startDate`/`endDate` para as 6
  chamadas reais do Dashboard (confirmado contra
  `DashboardPeriodDto`/`DashboardTopListQueryDto` do backend).
- **Cliente** e **Rota**: comboboxes com busca (debounce de 300ms),
  populados pelos endpoints reais e paginados `GET /clients?search=&limit=`
  e `GET /gateway-routes?search=&limit=` (`searchClients`/
  `searchGatewayRoutes` em `dashboard.service.ts`) — nunca carregam a lista
  inteira de uma vez.
- **Status**: seletor com códigos HTTP comuns (não vem de nenhum endpoint,
  são apenas rótulos de UI).

**Limitação confirmada no backend**: nenhum dos 6 endpoints do Dashboard
aceita `clientId`, `gatewayRouteId`/`routeId` ou `statusCode` como filtro —
os DTOs reais (`DashboardPeriodDto`/`DashboardTopListQueryDto`) só têm
`period`/`startDate`/`endDate`(/`limit`). Por isso, selecionar um cliente,
rota ou status na barra **não altera** os indicadores/gráficos/tabelas —
apenas fica com a seleção visível e uma nota explicativa aparece na barra
(`dashboard.filters.unsupportedNote`). Não foi implementada nenhuma
filtragem local (client-side) sobre os dados já agregados pelo backend,
pois isso produziria números incorretos (ex.: filtrar client-side a lista
de "top 10 clientes" por um cliente específico não reflete o agregado real
daquele cliente) — seria inventar comportamento, o que a instrução desta
etapa proíbe explicitamente. Quando o backend passar a aceitar esses
filtros, basta propagá-los em `dashboard.hooks.ts` do mesmo jeito que
`period` já é propagado hoje.

"Limpar filtros" reseta a barra inteira para o período padrão
(`last7days`) e limpa cliente/rota/status.

## Dados que não existem no backend (não inventados)

Confirmado diretamente no código-fonte do backend antes de implementar:

- **Total de Allowed IPs**: não existe contador no `overview`. O card foi
  substituído por "Taxa de sucesso" (`successRate`, um campo real).
- **Tempo mínimo de resposta**: só existem `averageResponseTime` e
  `maxResponseTime`. A seção "Desempenho" mostra apenas esses dois.
- **Variação/tendência nos cards**: o `overview` não retorna comparação
  com o período anterior, então nenhum indicador de variação foi
  adicionado aos cards.
- **Um endpoint único que agregue tudo**: cada seção do Dashboard faz sua
  própria chamada (`useDashboard`, `useDashboardCharts`, `useTopClients`,
  `useTopRoutes`, `useRecentRequests`), com loading/erro independentes.

## Decisão sobre "Últimos Logs Administrativos"

A especificação desta etapa pedia uma seção de auditoria consumindo
Audit Logs, mas a mesma especificação lista "Audit Logs" entre os itens
que **não devem ser implementados ainda**. Não existe um endpoint de
auditoria dentro do módulo `/dashboard` — a única forma de obter esses
dados seria chamar o módulo separado `GET /api/v1/audit-logs`, que é
exatamente o que a instrução pede para não implementar nesta etapa.

Diante do conflito, a seção "Últimos Logs Administrativos" foi
**omitida**, priorizando a regra explícita de exclusão. A seção "Últimas
Requisições" foi mantida porque `GET /dashboard/recent-requests` pertence
ao próprio módulo do Dashboard (não ao módulo `Request Logs`, também
listado como excluído), sendo portanto uma rota diferente e já dentro do
escopo desta etapa.

## Estrutura de arquivos

```text
src/features/dashboard/
├── dashboard.types.ts    # tipos espelhando o backend exatamente
├── dashboard.service.ts  # chamadas HTTP (Axios)
├── dashboard.hooks.ts    # useDashboard, useDashboardCards, useDashboardCharts,
│                         # useTopClients, useTopRoutes, useRecentRequests
├── dashboard.service.test.ts
└── dashboard.hooks.test.tsx

src/components/dashboard/
├── dashboard-card.tsx         # ícone + rótulo + valor + skeleton
├── dashboard-section.tsx      # título + conteúdo
├── dashboard-chart.tsx        # wrapper Recharts (área/barra), tema-aware
├── dashboard-table.tsx        # tabela genérica e tipada
├── dashboard-filters.tsx      # barra de filtros (período/cliente/rota/status)
├── dashboard-combobox.tsx     # combobox pesquisável genérico (cliente/rota)
├── dashboard-skeleton.tsx
├── dashboard-empty-state.tsx
└── dashboard-error-state.tsx

src/pages/dashboard/dashboard-page.tsx  # monta todas as seções
```

## Atualização automática

`staleTime: 30s`, `refetchInterval: 60s` em todos os hooks
(`src/features/dashboard/dashboard.hooks.ts`). O `retry` é customizado por
consulta: só tenta novamente em erros `5xx` (até 2 vezes), nunca em `4xx`
ou erro de rede — diferente do padrão global do `QueryClient`
(`src/lib/api/api-query-client.ts`), que é mais permissivo para timeouts.

## Estados

Cada seção trata `loading` (skeleton), `erro` (mensagem amigável +
"Tentar novamente", nunca stack trace) e `sem dados` (mensagem neutra)
independentemente — uma seção falhando não derruba as demais. "Online"/
"Offline" não ganharam um indicador visual dedicado nesta etapa: refletem-se
na própria mensagem de erro (`api.errors.network` vs. `api.errors.server`,
já traduzida por `getApiErrorMessage`).

## Gráficos

Biblioteca: Recharts. Um bug real foi encontrado e corrigido durante a
verificação manual: usar `var(--primary)`/`var(--destructive)` diretamente
como atributo SVG (`stroke`/`fill`) não repinta de forma confiável quando o
tema muda dinamicamente — os gráficos ficavam em branco ao alternar para o
tema escuro. A correção foi resolver cores literais (hex) a partir do
`useTheme()` dentro de `DashboardChart`, tornando a cor uma prop React
reativa de verdade, em vez de depender só da cascata CSS dentro de um
atributo SVG.

## Acessibilidade

- Cada `DashboardCard` tem `aria-label` com o rótulo do indicador.
- Cada gráfico tem `role="img"` + `aria-label` com uma descrição do que ele
  mostra, mais um `<span className="sr-only">` redundante.
- Tabelas usam `<caption className="sr-only">`, `<th scope="col">`.

## Permissões

O backend libera todos os 6 endpoints usados para os quatro papéis
(`ADMIN`, `OPERATOR`, `AUDITOR`, `VIEWER`) — não há nenhuma restrição de
papel para o Dashboard em si.

## Fora de escopo nesta etapa

CRUDs, filtro por cliente/rota/status aplicado de fato aos indicadores
(bloqueado pelo backend — ver [Filtros](#filtros)), exportação (PDF/Excel),
tempo real via WebSocket, notificações, "Últimos Logs Administrativos"
(ver decisão acima).
