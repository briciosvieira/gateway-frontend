# Current Task

API Keys / Allowed IPs / Gateway Routes — reorganização "visão por cliente": **parcialmente implementada, refinamento bloqueado em backend** (2026-08-07). Ver `.ai/BACKEND_CONTRACTS.md` → "Missing: per-client aggregate endpoints..." (spec completa) e `.ai/FRONTEND_ARCHITECTURE.md` → "Client-scoped resource views".

**O que já está implementado e funcionando (frontend, sem mudança de backend):** as três telas principais (API Keys, Allowed IPs, Gateway Routes) agora listam **clientes** (via `GET /clients` real, paginado) em vez de registros individuais — colunas Cliente/Identificador/Status/Ações, sem contadores. Clicar num cliente (linha ou botão "Ver X") abre um Drawer (`ApiKeyClientDrawer`/`AllowedIpClientDrawer`/`GatewayRouteClientDrawer`) que consulta o endpoint real de cada feature filtrado por `clientId`, com paginação/filtros/CRUD/status/revoke/regenerate/delete idênticos aos de antes — nada foi removido. Os botões globais "+ Nova API Key"/"+ Adicionar IP"/"+ Nova rota" continuam abrindo o formulário de criação normal (cliente selecionável); dentro do Drawer, o mesmo formulário é reaproveitado com o cliente já fixo (`lockedClient`), sem duplicar lógica.

**O que ficou bloqueado (não implementado):** duas regras de produto pedidas depois — (1) esconder da lista principal clientes sem nenhum recurso daquela feature, (2) trocar a coluna Status da lista principal para refletir o estado agregado dos recursos (Ativo = tem ao menos 1 recurso ativo; Inativo = tem recursos mas nenhum ativo; API Key revogada nunca conta como ativa) em vez de `client.active`. Essas duas regras juntas, mantendo paginação exata e escala para milhares de clientes, são impossíveis de resolver só no frontend — ver a explicação matemática completa em `.ai/BACKEND_CONTRACTS.md`. Confirmado com o usuário: não implementar aproximação/gambiarra; especificar o backend necessário e parar.

**Próxima tarefa (depende de backend, spec completa já pronta):** criar `GET /api-keys/clients-summary`, `GET /allowed-ips/clients-summary`, `GET /gateway-routes/clients-summary` — ver a seção "Endpoints needed" em `.ai/BACKEND_CONTRACTS.md` para query params, response shape exato, esboço de query SQL (Postgres, agregação condicional via `FILTER`), índices sugeridos e o plano de consumo do frontend depois que existir (troca pontual de hook na tela principal + o badge de Status do `ClientResourceListTable` passa a usar a contagem agregada — Drawer não muda nada). Até lá, não continuar essa reorganização.

Request Logs — alinhamento ao contrato corrigido de `attemptedAt` (NOT NULL): concluído (2026-08-07).

Etapa 15 — Configurações (Certificados internos / Trusted CAs): concluída (2026-08-07).

Próxima etapa sugerida: Etapa 14 — Meu Perfil (ainda pendente) ou Etapa 16 — Revisão final de componentes.

## Read first (para a próxima etapa)

- `.ai/PROJECT_CONTEXT.md`
- `.ai/UI_RULES.md`
- `.ai/BACKEND_CONTRACTS.md` — seção "Request Logs" (contrato de `attemptedAt` corrigido) e seção "Trusted CAs"
- `.ai/FRONTEND_ARCHITECTURE.md` — seção "Configurações"
- `.ai/IMPLEMENTATION_STATUS.md`

## Notes from Request Logs — attemptedAt contract alignment (2026-08-07)

- Backend agora garante `RequestLog.attemptedAt` `NOT NULL` (registros históricos foram backfillados com `attemptedAt = createdAt`); filtro por período e `sortBy=attemptedAt` usam exclusivamente `attemptedAt`, sem fallback para `createdAt`.
- Frontend alinhado: `RequestLogListItem.attemptedAt` mudou de `string | null` para `string`; o helper `getRequestLogAttemptedAt()` (fallback `attemptedAt ?? createdAt`) foi removido — tabela e drawer leem `attemptedAt` diretamente.
- Formatter central único `formatRequestLogDateTime(value, locale)` (`src/features/request-logs/request-logs.utils.ts`) usado pela tabela ("Horário") e pelo drawer ("Horário da tentativa"/"Criado em") — elimina a duplicidade de `Intl.DateTimeFormat` que existia antes entre os dois lugares. pt-BR sempre `DD/MM/AAAA HH:mm:ss`.
- `buildRequestLogStartDate`/`buildRequestLogEndDate` constroem os limites do dia local (00:00:00.000 / 23:59:59.999) via `Date` local + `toISOString()`, nunca concatenação de string — evita o bug de deslocamento de dia por timezone.
- Ordenação continua 100% server-side (`sortBy=attemptedAt&sortOrder=desc` por padrão); nenhum `.sort()` client-side existe na feature.
- `createdAt` continua exibido separadamente no drawer, nunca como substituto visual de `attemptedAt`.

## Notes from Etapa 15 (2026-08-07)

- Nova área "Configurações", item ADMIN-only e último no Sidebar principal (`settings.read`, wildcard do ADMIN — nenhuma outra role tem esse permission). Rotas `/settings` (redireciona para `/settings/certificates`) e `/settings/certificates`, protegidas por `PermissionRoute`.
- Sidebar secundária interna à área de Configurações (`SettingsSidebar`, `src/routes/settings-nav-items.ts`) contém apenas "Certificados" por enquanto — arquitetura pronta para novos itens futuros (Segurança, Gateway, Retenção, Sistema) sem placeholders criados agora.
- Ajuste visual da página `Configurações > Certificados` concluído: cabeçalho geral agora tem linha divisória discreta, o conteúdo interno de Certificados sobe para o topo da área útil, a hierarquia tipográfica foi reduzida para evitar competição com o H1, e a tabela ficou mais compacta com fingerprint abreviado visualmente e truncamento controlado de `subject`/`issuer`, sem alterar filtros, paginação, permissões ou fluxo de upload.
- Módulo `src/features/trusted-cas/` criado seguindo o padrão de Route Headers (types/schemas/constants/service/hooks/utils em arquivos únicos, sem split extra).
- **Divergência de backend encontrada e corrigida** (autorizado pelo usuário em tempo real): o hook global `registerContentTypeValidationHook` (`src/common/hooks/security-hooks.ts` no backend) bloqueava com `415` qualquer corpo que não fosse `application/json` em todas as rotas `/api/v1/*`, o que tornava `POST /trusted-cas` (que exige `multipart/form-data`) inutilizável para qualquer cliente. Corrigido com uma exceção pontual (`MULTIPART_ROUTES`) apenas para essa rota — todo o resto da API continua JSON-only. Os testes de integração do backend não cobrem essa camada (bootstrap de teste não registra os hooks do Fastify), por isso o bug nunca foi pego automaticamente.
- Upload usa `FormData` real (`name`, `file`) com o adapter `fetch` do axios (não o `xhr` padrão) especificamente nessa chamada — o `xhr` tem comportamento inconsistente com corpos `FormData` contendo `File` em alguns ambientes; `fetch` é o caminho estável em todos os navegadores modernos alvo deste app.
- PEM/certificado bruto nunca é exposto pelo backend (`certificatePem` não está no `trustedCaPublicSelect`) nem renderizado pelo frontend — sem Download, Ver PEM, Copiar PEM, Exportar ou Editar em nenhum lugar da UI. Nenhuma opção de bypass de TLS existe.
- Validação de "Válido/Expirando/Expirado" é 100% visual/derivada de `validTo` no frontend (`getCertificateValidityStatus`, limiar de 30 dias) — nunca toca `active` nem envia ao backend; o filtro real de `validity` só aceita `valid`/`expired` (sem "expiring" no backend).
- 405 testes passando (100 arquivos), incluindo cobertura nova de rotas/permissões, Sidebar secundária, upload multipart, tabela/badges, ativação/desativação, exclusão e ausência de PEM/download/edit/TLS-bypass.
