# Gestão de usuários

Implementado na Etapa 6, consumindo exclusivamente endpoints reais do
backend — nenhum dado é mockado ou inventado.

## Endpoints utilizados

Todos sob `/api/v1`, protegidos por `@Roles(ADMIN, OPERATOR)` no
`UsersController` (confirmado no código-fonte do backend) — **VIEWER e
AUDITOR recebem `403` em qualquer endpoint de usuários, inclusive a
listagem**.

| Endpoint                                | Uso no frontend                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /users`                            | Listagem (array puro, sem paginação/filtro/busca)                             |
| `GET /users/:id`                        | Detalhe (não usado pela UI hoje — o drawer usa a linha já carregada da lista) |
| `POST /users`                           | Criar usuário                                                                 |
| `PATCH /users/:id`                      | Editar nome/username/e-mail                                                   |
| `PATCH /users/:id/role`                 | Alterar perfil                                                                |
| `PATCH /users/:id/status`               | Ativar/desativar                                                              |
| `POST /users/:id/reset-password`        | Resetar senha (sem corpo)                                                     |
| `PATCH /users/:id/password-requirement` | Exigir/não exigir troca de senha no próximo login                             |
| `GET /roles`                            | Perfis que **o usuário logado** pode atribuir                                 |

## `GET /users` não tem paginação, busca nem filtros (confirmado no backend)

O handler `findAll` do `UsersController` não recebe `@Query()` — retorna
sempre a lista completa (array puro, sem envelope `{items, pagination}`),
ordenada por `createdAt desc`. Por instrução explícita de não inventar
parâmetros que o backend não aceita, **pesquisa, filtro por perfil/status/
primeiro acesso, ordenação e paginação são inteiramente client-side**
(`src/features/users/users.view-utils.ts`), aplicados sobre o array já
carregado. Isso é seguro aqui — diferente do Dashboard, onde os endpoints
retornam dados pré-agregados — porque o backend já entrega toda a lista
que o usuário logado pode ver; recortar/ordenar essa mesma lista no
navegador não distorce nada.

O estado desses filtros é sincronizado com a query string
(`?search=&role=&status=&firstLogin=&sortBy=&sortOrder=&page=`) via
`useSearchParams`, para permitir links compartilháveis — nunca enviado ao
backend.

## Papel de `GET /roles`

Não é um catálogo genérico de perfis: é a lista de perfis que **o próprio
usuário autenticado** pode atribuir. ADMIN recebe os quatro perfis;
OPERATOR recebe os três não-ADMIN. Usar essa resposta diretamente no
formulário de criação e no diálogo de troca de perfil resolve, de graça, a
regra "um OPERATOR não deve ver ADMIN como opção" — sem precisar
replicá-la no frontend.

## Regras de permissão

`src/features/auth/role-permissions.ts` ganhou `users.read`,
`users.create`, `users.update`, `users.status`, `users.role`,
`users.resetPassword` e `users.passwordRequirement` — concedidos a ADMIN
(via `*`) e OPERATOR; **nenhum** para VIEWER/AUDITOR, espelhando o guard
de classe do `UsersController`. `usePermissions().hasPermission(...)`
decide o que mostrar; **não é uma fronteira de segurança** (ver nota já
existente em `role-permissions.ts`) — o backend é sempre a autoridade
final e retorna `403` de qualquer forma se o frontend errar.

Regras mais finas, por linha, ficam em
`src/features/users/users.permissions.ts` — dicas de UI que espelham
`src/modules/users/policies/user-creation.policy.ts` do backend:

- `canManageTargetRole`: ADMIN gerencia qualquer perfil; OPERATOR gerencia
  qualquer perfil exceto ADMIN (usado para esconder Editar/Ativar-
  Desativar/Alterar perfil/Resetar senha/Exigência de senha quando o alvo
  é ADMIN e quem está logado é OPERATOR).
- `canDeactivate`: esconde "Desativar" na própria linha do usuário logado.
- `canChangeOwnAdminRole`: esconde "Alterar perfil" quando o usuário
  logado é ADMIN olhando para a própria linha.

O backend também bloqueia demover/desativar o **último ADMIN ativo**
restante — essa contagem não é replicável de forma confiável no
frontend (exigiria buscar todos os usuários e ainda assim haveria uma
condição de corrida), então essa regra específica não tem um espelho
visual: a ação aparece habilitada e, se for a última, o backend responde
`403`, exibido como qualquer outro erro de permissão (ver seção abaixo).

## Tratamento de erros

`getApiErrorMessage` (já existente, `src/lib/api/api-response.ts`) cobre
`400/401/403/404/408/409/429/5xx` com mensagens traduzidas — reutilizado
sem alterações. `409` (username/e-mail duplicado) usa a tradução
`api.errors.conflict` já existente. Mensagens específicas do backend
("You cannot deactivate your own user.", "The last active administrator
cannot be deactivated or demoted.") **não são exibidas cruas** — seguindo
o padrão já estabelecido no projeto desde a Etapa 3, apenas o
`statusCode`/`code` decide a mensagem traduzida exibida. Quando a
`ApiError` tem `requestId`, o `TableErrorState` mostra
"Código de atendimento: `<requestId>`".

## Senha temporária

`POST /users` retorna `{ user, temporaryPassword, passwordMustBeChanged }`;
`POST /users/:id/reset-password` retorna apenas
`{ temporaryPassword, passwordMustBeChanged }` (sem o usuário). Em ambos
os casos, o valor só existe em `useState` local de `UsersPage`
(`temporaryPassword`), nunca em `localStorage`, nunca em cache do
TanStack Query, nunca logado no console — `TemporaryPasswordDialog`
(`src/components/users/temporary-password-dialog.tsx`) exibe com
`CopyField` (botão copiar + feedback textual "Copiado!") e o estado é
descartado (`setTemporaryPassword(null)`) ao fechar o modal.

## Não implementado (por instrução explícita)

- `DELETE` de usuário — não existe endpoint no backend.
- Alterar perfil ou status pelo formulário de edição — o backend tem
  endpoints dedicados (`/role`, `/status`); o formulário de edição só
  aceita `name`/`username`/`email` (`PATCH /users/:id`).
- Escolher se a troca de senha será exigida ao resetar senha — o backend
  não aceita corpo em `POST /users/:id/reset-password` e sempre força
  `firstLogin: true`.
- Clientes, API Keys, Allowed IPs, Gateway Routes, Route Headers, Audit
  Logs, Request Logs, configurações gerais e deploy.

## Estrutura de arquivos

```text
src/features/users/
├── users.types.ts             # tipos espelhando o backend exatamente
├── users.service.ts           # chamadas HTTP (Axios)
├── users.hooks.ts             # query keys + queries + mutations (TanStack Query)
├── users.schemas.ts           # Zod (mesmas regras do CreateUserDto/UpdateUserDto)
├── users.constants.ts         # ROLE_CODES, USERS_PAGE_SIZE, DEFAULT_USERS_FILTERS
├── users.permissions.ts       # dicas de UI por linha (não é fronteira de segurança)
├── users.view-utils.ts        # filtro/ordenação/paginação client-side + query string
└── *.test.ts(x)

src/components/users/
├── users-table.tsx
├── user-filters.tsx
├── user-form.tsx               # CreateUserForm + EditUserForm
├── user-details-drawer.tsx
├── user-status-dialog.tsx
├── user-role-dialog.tsx
├── reset-password-dialog.tsx
├── temporary-password-dialog.tsx
└── password-requirement-dialog.tsx

src/components/shared/          # novos, reutilizáveis por qualquer feature futura
├── page-header.tsx
├── data-table-pagination.tsx
├── search-input.tsx
├── filter-select.tsx
├── status-badge.tsx
├── role-badge.tsx
├── confirmation-dialog.tsx
├── copy-field.tsx
├── table-skeleton.tsx
├── table-empty-state.tsx
└── table-error-state.tsx

src/components/ui/dialog.tsx    # novo primitivo Shadcn (modal centralizado, Radix Dialog)

src/pages/users/users-page.tsx  # monta filtros + tabela + paginação + diálogos
src/routes/permission-route.tsx # guard client-side por permissão (usado por /users)
```

Desvio deliberado da estrutura sugerida na especificação desta etapa: os
componentes de usuários ficam em `src/components/users/` (não em
`src/features/users/components/`) e os hooks ficam consolidados em um
único `users.hooks.ts` (não um arquivo por hook) — para seguir a mesma
convenção já usada em `src/components/dashboard/` e
`src/features/dashboard/dashboard.hooks.ts` desde a Etapa 5, em vez de
introduzir um segundo padrão de organização no mesmo projeto.

## Acessibilidade

- Diálogos (`Dialog`/`Sheet`, ambos Radix) já trazem foco inicial, trap de
  foco e devolução de foco ao elemento que abriu — comportamento nativo
  do Radix, não precisou de código adicional.
- Toda ação de ícone tem `aria-label`.
- Status nunca é indicado só por cor: `StatusBadge` sempre mostra o texto
  ("Ativo"/"Inativo"), o ponto colorido é redundante.
- `CopyField` expõe um `role="status"` com o texto "Copiado!" para leitores
  de tela, além do texto visível no próprio botão.
- Tabela usa `<caption className="sr-only">`, `<th scope="col">`.

## Responsividade

Filtros em grid (`md:grid-cols-2 xl:grid-cols-5`, coluna única abaixo de
`md`); tabela com `overflow-x-auto` (sem scroll vertical próprio — herda a
rolagem do `<main>`, ver política de scroll em
[`02-architecture.md`](./02-architecture.md#política-de-scroll)); diálogos
e drawer ocupam largura adequada em qualquer tamanho de tela
(`max-w-md`/`w-72`).

## Fora de escopo nesta etapa

Clientes, API Keys, Allowed IPs, Gateway Routes, Route Headers, Audit
Logs, Request Logs, configurações gerais, deploy, página de perfil do
próprio usuário (`/profile`, já listada como pendente desde a Etapa 4).
