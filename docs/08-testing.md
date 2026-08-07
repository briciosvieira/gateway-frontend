# Testes

## Ferramentas

Vitest, `jsdom`, Testing Library (`@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/dom`) e MSW (`msw/node`),
configurados em `vite.config.ts` (bloco `test`, ambiente `jsdom`) com setup
global em `src/test/setup.ts` — inicia/encerra o servidor MSW e limpa o DOM
(`cleanup()`) entre cada teste.

```bash
npm run test
npm run test:watch
npm run test:coverage
```

MSW mocka a API nos testes (`src/test/msw/handlers.ts` e
`src/test/msw/server.ts`) — nenhum teste chama o backend real.

## Testes unitários

Arquivos `*.test.ts` ao lado do código testado:

- `src/config/env.test.ts` — formato das variáveis de ambiente.
- `src/lib/api/token-storage.test.ts` — get/set/remove/clear/`hasSession`
  de ambos os tokens, isoladamente.
- `src/lib/api/request-id.test.ts` — formato UUID v4 e unicidade.
- `src/lib/api/api-error.test.ts` — campos da `ApiError` e `isApiError`.
- `src/lib/api/api-response.test.ts` — `getApiErrorMessage` mapeia
  `code`/`statusCode` para a tradução correta.
- `src/lib/api/refresh-token.test.ts` — `refreshAccessToken` não chama a
  API sem refresh token salvo; salva os novos tokens em sucesso; retorna
  `null` sem alterar tokens em falha; **compartilha uma única chamada**
  entre invocações concorrentes (fila single-flight); permite uma nova
  chamada após a anterior terminar.
- `src/lib/api/api-client.test.ts` (MSW) — o interceptor de resposta faz
  refresh e repete a requisição original em `401`; limpa a sessão e emite
  `session-expired` quando o refresh falha; **não** tenta refresh para
  `/auth/login`.
- `src/services/health/health.service.test.ts` — desembrulho de
  `response.data.data` e propagação do `AbortSignal`.
- `src/features/auth/auth.schemas.test.ts` — `loginSchema` e
  `changePasswordSchema` (política de senha idêntica ao backend,
  confirmação de senha).
- `src/features/auth/role-permissions.test.ts` — mapa de permissões por
  papel (`ADMIN` com wildcard, demais papéis com escopos específicos).
- `src/features/auth/auth-session-events.test.ts` — assinatura/emissão do
  evento de sessão expirada e a flag de `sessionStorage`.
- `src/features/auth/auth.service.test.ts` — cada função chama o endpoint
  certo com o payload certo e desembrulha a resposta.
- `src/features/dashboard/dashboard.service.test.ts`,
  `dashboard.hooks.test.tsx` — Etapa 5.
- `src/features/users/users.service.test.ts` — as 8 operações reais
  (`findUsers`, `findUserById`, `createUser`, `updateUser`,
  `changeUserRole`, `changeUserStatus`, `resetUserPassword`,
  `changePasswordRequirement`, `findAssignableRoles`) chamam o endpoint e
  payload certos e desembrulham a resposta; confirma que `findUsers` não
  envia nenhum query param.
- `src/features/users/users.hooks.test.tsx` (MSW) — `useUsers` busca a
  lista sem query string; `useCreateUser` invalida a query de lista após
  sucesso.
- `src/features/users/users.view-utils.test.ts` — parse/serialização de
  filtros a partir da query string (incluindo valores inválidos caindo no
  default) e a filtragem/ordenação/paginação client-side sobre o array
  completo.
- `src/features/users/users.permissions.test.ts` — `canManageTargetRole`
  (ADMIN gerencia tudo; OPERATOR não gerencia ADMIN; VIEWER/AUDITOR não
  gerenciam ninguém), `canDeactivate` (bloqueia auto-desativação) e
  `canChangeOwnAdminRole` (bloqueia auto-demoção de ADMIN).
- `src/features/auth/role-permissions.test.ts` — ampliado para cobrir
  `users.*`: OPERATOR recebe todas as permissões de usuários;
  VIEWER/AUDITOR não recebem nenhuma.

## Testes de integração

- `src/contexts/auth-context.test.tsx` (MSW + Testing Library) —
  `AuthProvider` fica não autenticado sem sessão salva; restaura a sessão
  chamando `GET /auth/me` quando há tokens salvos; login bem-sucedido
  persiste os tokens; credenciais inválidas não autenticam; logout limpa a
  sessão local.

## Testes de componentes

- `src/components/auth/password-requirements.test.tsx` — cada requisito
  de senha (comprimento, maiúscula, minúscula, número, caractere especial,
  confirmação) reflete corretamente o estado atendido/não atendido.
- `src/components/dashboard/*.test.tsx` — Etapa 5 (cards, gráficos,
  estados, filtros, combobox).
- `src/components/shared/confirmation-dialog.test.tsx` — abre/fecha,
  chama `onConfirm`/`onOpenChange`, desabilita botões e troca o rótulo
  durante `isLoading`, exibe `errorMessage`.
- `src/components/shared/copy-field.test.tsx` — copia para
  `navigator.clipboard` e mostra o feedback textual "Copiado!".
- `src/components/shared/data-table-pagination.test.tsx` — desabilita
  Anterior/Próxima nas extremidades; `onPageChange` recebe a página certa.
- `src/components/users/users-table.test.tsx` — mostra todas as ações
  quando o usuário logado tem permissão total; esconde Editar/Desativar/
  Alterar perfil quando um OPERATOR olha para um alvo ADMIN (mas mantém
  "Visualizar"); esconde "Desativar" na própria linha; esconde toda ação
  de escrita quando as permissões do chamador são todas `false`.
- `src/components/users/temporary-password-dialog.test.tsx` — mostra a
  senha e o aviso de exibição única; mensagem correta conforme
  `mustChangeOnNextLogin`; `onClose` é chamado ao fechar.
- `src/routes/permission-route.test.tsx` — renderiza a rota quando a
  permissão é concedida; redireciona para `/403` quando é negada.

Demais componentes de UI (`LoginPage`, `ChangePasswordPage`,
`ApiStatusCard`, formulários e diálogos individuais de usuários, etc.) não
têm testes de componente dedicados ainda — a cobertura de integração via
`AuthProvider`/MSW e a verificação manual no navegador real (ver
`09-roadmap.md` e os relatórios de cada etapa) cobriram o comportamento
ponta a ponta por ora.

## Testes de rotas

`ProtectedRoute`, `PublicRoute` e `FirstLoginRoute` foram verificados
manualmente contra o backend real (não autenticado → `/login`;
autenticado → rota privada; autenticado acessando `/login` → redireciona
de volta para a rota originalmente pedida; `firstLogin`/`mustChangePassword`
→ `/change-password`). `PermissionRoute` tem teste automatizado dedicado
(acima) e foi validado manualmente contra o backend real na Etapa 6.

## Testes E2E

Fluxos completos de ponta a ponta, cobrindo cenários como navegação entre
módulos administrativos e operações de CRUD, a serem definidos quando as
respectivas funcionalidades existirem.

## Fora de escopo nesta etapa

Testes de componente para as páginas de autenticação, testes automatizados
para `ProtectedRoute`/`PublicRoute`/`FirstLoginRoute` (cobertos apenas
manualmente) e testes E2E.
