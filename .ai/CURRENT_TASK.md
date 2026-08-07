# Current Task

Personalização (Branding global) — **concluída** (2026-08-07). Nova seção em Configurações, logo abaixo de Certificados, em `/settings/personalization`, ADMIN only (`branding.update`, mesmo padrão ADMIN-only-sem-exceções de `trustedCas.*`; a página em si já herda o gate `settings.read`). Consome exclusivamente o contrato real confirmado ao vivo via `/docs-json` (não estava documentado em `BACKEND_CONTRACTS.md` antes desta tarefa — ver seção "Per-client... CONFIRMED IMPLEMENTED" não, ver a seção "Branding" nova em `BACKEND_CONTRACTS.md`): `GET /branding` (público), `PATCH /branding` (nome), `POST`/`DELETE /branding/{logo,favicon,brand-image}` (multipart, ADMIN). `applicationName` e a imagem principal (`brandImageUrl`) agora são dinâmicos em Sidebar, Home, Login, tela de loading (`AuthLoadingScreen` usa o favicon + nome) e `document.title`/favicon da aba — tudo via um único hook compartilhado `useBranding()` (`src/features/branding/branding.hooks.ts`), com fallback central em `DEFAULT_BRANDING` (`branding.constants.ts`) para quando o backend não tiver customizado um asset ou a query falhar. Ver `.ai/FRONTEND_ARCHITECTURE.md` → "Personalização / Branding global" para a arquitetura completa.

**Bugs de backend encontrados e corrigidos ao vivo durante o teste (autorizados pelo usuário em tempo real, um de cada vez):**
1. `MULTIPART_ROUTES` (`security-hooks.ts`) só liberava `multipart/form-data` para `POST /trusted-cas` — os 3 uploads novos de branding levavam 415 antes de chegar no controller. Corrigido adicionando as 3 rotas ao Set.
2. `@fastify/multipart`'s `fileSize` só é verificado durante `file.toBuffer()`, não em `request.file()` — o try/catch de `branding-admin.controller.ts` só cobria o segundo, deixando o erro de arquivo grande escapar sem virar um 413 limpo. Corrigido envolvendo `toBuffer()` no mesmo tratamento.
3. Helmet aplica `Cross-Origin-Resource-Policy: same-origin` por padrão em toda resposta, bloqueando `<img src>` cross-origin mesmo em assets públicos — `branding-public.controller.ts` agora seta `cross-origin-resource-policy: cross-origin` só nos 3 endpoints de asset (`sendAsset`), sem mudar a política do resto da API.
4. Limite de tamanho da Imagem principal ajustado de 5MB para 10MB a pedido do usuário (`BRANDING_UPLOAD_LIMITS.brandImage` no backend + `BRANDING_BRAND_IMAGE_MAX_SIZE_BYTES` no frontend, mantidos em espelho exato — ver nota em `branding.constants.ts`).

**Achado não relacionado ao backend:** `public/favicon.svg` e `public/duda10.png` estavam deletados na árvore de trabalho do frontend (não commitado, causa desconhecida, não foi ação deste agente) — restaurados via `git checkout`. Isso explicava o ícone de imagem quebrada em todo lugar que usa o fallback padrão (Sidebar, Home, Login) antes mesmo de qualquer asset customizado existir.

---

API Keys / Allowed IPs / Gateway Routes — reorganização "visão por cliente": **concluída** (2026-08-07, tarefa anterior a esta). As três telas principais consomem exclusivamente os endpoints agregados reais `GET /{api-keys|allowed-ips|gateway-routes}/clients-summary` (confirmados implementados pelo backend) — apenas clientes com ≥1 recurso aparecem, o Status principal é derivado de `active > 0`/`total > 0 && active === 0` (nunca `client.active`), contadores (Total/Ativas/Inativas[/Revogadas]) são exibidos por cliente, e toda mutação dentro do Drawer (create/status/revoke/regenerate/delete) invalida tanto sua própria query quanto a `clients-summary` correspondente — sem `window.location.reload()`. O Drawer por cliente continua usando os endpoints antigos filtrados por `clientId`, inalterados. Ver `.ai/BACKEND_CONTRACTS.md` e `.ai/FRONTEND_ARCHITECTURE.md` → "Client-scoped resource views" para o contrato e a arquitetura final.

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
