# Autenticação

Implementada na Etapa 4, com base no contrato real do backend (confirmado
na fonte, não assumido).

## Contrato do backend

- `POST /auth/login` — `{ login, password }` → tokens + `user` (formato
  reduzido: `name`, `username`, `email`, `role` como string, `firstLogin`) +
  `mustChangePassword`.
- `POST /auth/refresh` — `{ refreshToken }` → novo par de tokens. O backend
  faz rotação: o refresh token usado é revogado, reutilizá-lo falha com 401.
- `POST /auth/logout` — `{ refreshToken }` → `204 No Content`.
- `POST /auth/change-password` — `{ currentPassword, newPassword }` →
  `204 No Content`. Acessível mesmo com `firstLogin = true`
  (`@AllowFirstLogin()` no backend).
- `GET /auth/me` — autenticado → usuário completo: `id`, `name`, `username`,
  `email`, `active`, `firstLogin`, `lastLoginAt`, `createdAt`, `role` (objeto
  `{ id, code, name, level }`).
- `GET /auth/permissions` **não existe** no backend (confirmado: ausente do
  controller). Ver seção "Permissões" abaixo.

Importante: o `user` retornado por `/auth/login` e o retornado por
`/auth/me` têm formatos diferentes (o backend não usa o mesmo DTO nos dois
casos) — `role` é uma string simples no login e um objeto no `/me`. Por
isso, `AuthContext` sempre mantém o formato de `/auth/me`
(`AuthenticatedUser`, `src/features/auth/auth.types.ts`) como fonte única
de verdade; o retorno do login é usado apenas para decidir o redirecionamento
imediato (`mustChangePassword`), não para preencher o estado do usuário.

Tokens vêm no corpo da resposta, não em cookies `HttpOnly` — por isso
`localStorage` (`src/lib/api/token-storage.ts`) é a estratégia de
armazenamento adequada para o contrato atual.

## Fluxo de login

1. Usuário envia `login`/`password` (`src/pages/login/login-page.tsx`,
   validado com Zod + React Hook Form).
2. `AuthContext.login()` chama `POST /auth/login`, salva os tokens, então
   chama `GET /auth/me` para obter o usuário canônico.
3. `PublicRoute` (que envolve `/login`) reage à mudança de
   `isAuthenticated` e redireciona:
   - para `/change-password`, se `mustChangePassword`;
   - para a rota originalmente solicitada (`location.state.from`), se
     houver;
   - para `/`, caso contrário.

A navegação pós-login é responsabilidade exclusiva do `PublicRoute` — o
hook `useLogin` não chama `navigate()`. Isso evita uma corrida real que foi
encontrada e corrigida durante o teste manual: se `useLogin` também
navegasse, competia com o redirecionamento automático do `PublicRoute` e o
usuário podia acabar em `/` em vez da rota que tinha originalmente pedido.

## Refresh automático

`src/lib/api/api-client.ts` intercepta respostas `401`:

1. Ignora rotas de autenticação (`/auth/login`, `/auth/refresh`,
   `/auth/logout`) — essas nunca disparam refresh.
2. Marca a requisição com `_retry` para nunca tentar duas vezes.
3. Chama `refreshAccessToken()` (`src/lib/api/refresh-token.ts`), que mantém
   uma única Promise compartilhada — se várias requisições falharem com
   `401` ao mesmo tempo, apenas uma chamada a `/auth/refresh` é feita.
4. Em sucesso: salva os novos tokens e repete a requisição original.
5. Em falha: limpa a sessão (`tokenStorage.clear()`) e emite o evento
   `gateway-hub-lf:session-expired` (`src/features/auth/auth-session-events.ts`).

## Restauração de sessão

Ao iniciar, `AuthContext` verifica `tokenStorage.hasSession()`:

- sem tokens → `isAuthenticated = false` imediatamente;
- com tokens → chama `GET /auth/me`; em sucesso, restaura o usuário; em
  falha, limpa a sessão.

Durante essa verificação, `isInitializing = true` e `ProtectedRoute`/
`PublicRoute`/`FirstLoginRoute` mostram `AuthLoadingScreen` em vez de
piscar a tela de login ou o conteúdo privado.

## Primeiro acesso e troca de senha

- `user.firstLogin` (do backend) determina `mustChangePassword` no
  `AuthContext`.
- `ProtectedRoute` redireciona qualquer usuário com `mustChangePassword`
  para `/change-password`, bloqueando as demais rotas privadas.
- A política de senha em `src/features/auth/auth.schemas.ts` espelha
  exatamente o `ChangePasswordDto` real do backend: mínimo de 12
  caracteres, ao menos uma maiúscula, uma minúscula, um número e um
  caractere especial. `PasswordRequirements` mostra cada regra em tempo
  real.
- Após sucesso, `reloadUser()` busca `/auth/me` novamente (atualizando
  `firstLogin`) antes de redirecionar para `/`.

## Logout

`AuthContext.logout()` chama `POST /auth/logout` (melhor esforço — falha de
rede não impede o logout local) e sempre limpa tokens, usuário e o cache do
TanStack Query (`queryClient.clear()`), preservando tema, idioma e estado
da sidebar.

## Permissões

`GET /auth/permissions` não existe no backend. Em vez de inventar o
endpoint, as permissões são derivadas no cliente a partir de
`role.code` (`src/features/auth/role-permissions.ts`) — **isto não é uma
fronteira de segurança**, apenas uma conveniência para decidir o que
mostrar na UI; o backend continua sendo a única autoridade real (seus
próprios guards de rota e papel).

## Sessão expirada

Quando o refresh falha, `emitSessionExpired()` grava uma flag temporária em
`sessionStorage` (`gateway-hub-lf-session-expired`) além de disparar o
evento que limpa a sessão. A tela de login lê e limpa essa flag uma única
vez (`consumeSessionExpiredFlag`) para mostrar "Sua sessão expirou. Entre
novamente." — nenhum detalhe do erro original é persistido.

## Limitações conhecidas

- Só existe um usuário seedado no banco local (perfil `ADMIN`) — não foi
  possível testar manualmente o login com `OPERATOR`, `VIEWER` ou
  `AUDITOR`, nem o fluxo real de primeiro acesso (`firstLogin: true`), pois
  criar esses usuários exigiria um CRUD de usuários, fora do escopo desta
  etapa.
- Permissões são um mapa estático no frontend, não vindas do backend (ver
  seção "Permissões").
