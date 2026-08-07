# Integração com a API

## Backend

O backend Gateway Hub LF está disponível localmente em:

```text
http://localhost:3110
```

Todas as rotas administrativas ficam sob o prefixo:

```text
/api/v1
```

exceto `gateway/*` (proxy público do gateway), que não é consumido pelo
painel administrativo.

Swagger UI: `http://localhost:3110/docs`. Documento OpenAPI:
`http://localhost:3110/docs-json`.

### CORS

O backend libera CORS por variável de ambiente (`ALLOWED_ORIGINS`), sem
`credentials: true`. Em desenvolvimento local, a origem liberada é
`http://localhost:5173` (porta padrão do Vite) — rodar `npm run dev` em
outra porta faz as chamadas ao backend falharem por CORS.

## Variáveis de ambiente

```env
VITE_APP_NAME="Gateway Hub LF"
VITE_API_URL="http://localhost:3110/api/v1"
VITE_REQUEST_TIMEOUT="30000"
```

Validadas com Zod em `src/config/env.ts`, que lança um erro explícito na
inicialização caso alguma esteja ausente ou em formato inválido (sem nunca
imprimir os valores).

## Cliente HTTP

Instância única do Axios em `src/lib/api/api-client.ts`:

- `baseURL`: `env.VITE_API_URL`.
- `timeout`: `env.VITE_REQUEST_TIMEOUT`.
- `headers.Accept: 'application/json'` — `Content-Type` não é fixado
  globalmente; o Axios já define o `Content-Type` correto conforme o corpo
  de cada requisição.

### Interceptor de requisição

- Adiciona `X-Request-ID` (UUID v4, `src/lib/api/request-id.ts`) em toda
  requisição, para correlação com os logs do backend (`Request Logs`,
  `Audit Logs`). Confirmado: o backend ecoa de volta o mesmo valor enviado;
  se nada for enviado, ele gera um UUID próprio.
- Adiciona `Authorization: Bearer <token>` somente quando existe um access
  token salvo (`tokenStorage.getAccessToken()`).
- **Nunca** adiciona `X-API-Key` — esse cabeçalho é do proxy público do
  gateway, não do painel administrativo.

### Interceptor de resposta — refresh automático em 401

Desde a Etapa 4, uma resposta `401` (exceto em `/auth/login`,
`/auth/refresh` e `/auth/logout`, que nunca disparam refresh) aciona
`refreshAccessToken()` (`src/lib/api/refresh-token.ts`), que garante uma
única chamada a `POST /auth/refresh` mesmo que várias requisições falhem
ao mesmo tempo. Em sucesso, a requisição original é repetida com o novo
token; em falha, a sessão é limpa e o evento
`gateway-hub-lf:session-expired` é emitido. Ver
[`03-authentication.md`](./03-authentication.md) para o fluxo completo.

Respostas de sucesso passam sem alteração. Erros são normalizados em uma
`ApiError` (`src/lib/api/api-error.ts`), distinguindo:

| Situação                           | `code`                          | `statusCode`              |
| ---------------------------------- | ------------------------------- | ------------------------- |
| Timeout (`ECONNABORTED`)           | `REQUEST_TIMEOUT`               | `408`                     |
| Sem resposta do servidor           | `NETWORK_ERROR`                 | `0`                       |
| Requisição cancelada (AbortSignal) | `REQUEST_CANCELLED`             | `0`                       |
| Erro do backend                    | o `code` do backend (se houver) | o `statusCode` do backend |
| Formato de erro inesperado         | `UNEXPECTED_ERROR`              | o status HTTP recebido    |

## Padrão de resposta do backend

Confirmado a partir do código-fonte real do backend (interceptors
`RequestIdInterceptor`/`ResponseInterceptor` e `HttpExceptionFilter`).

Sucesso:

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {},
  "requestId": "UUID",
  "timestamp": "2026-08-06T12:00:00.000Z"
}
```

Erro:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed.",
  "error": "Bad Request",
  "path": "/api/v1/example",
  "method": "POST",
  "requestId": "UUID",
  "timestamp": "2026-08-06T12:00:00.000Z"
}
```

Nuances confirmadas (não assumir o contrário):

- `code` é **opcional** e normalmente ausente; só aparece quando o próprio
  payload da exceção já define um `code`, ou automaticamente como
  `RATE_LIMIT_EXCEEDED` em respostas `429`.
- `error` (frase HTTP, ex.: `"Bad Request"`, `"Unauthorized"`) está sempre
  presente nos erros — é o campo usado no lugar de `code` na maioria dos
  casos.
- `message` pode ser uma string ou um array de strings (erros de validação
  do `ValidationPipe`) — nunca assumir apenas string.
- `requestId` pode vir como `"unknown"` em falhas muito iniciais do
  pipeline (antes do interceptor de request-id rodar), mesmo enviando
  `X-Request-ID`.

Os tipos correspondentes estão em `src/types/api.ts`
(`ApiSuccessResponse<T>`, `ApiErrorResponse`), cobrindo tanto o campo
`code` quanto `error`/`errors` como opcionais.

## Tratamento de erro para o usuário

`getApiErrorMessage(error, fallback)` (`src/lib/api/api-response.ts`)
converte uma `ApiError` em uma mensagem traduzida e segura, escolhida pelo
`statusCode`/`code` — nunca exibe a mensagem crua do backend (que hoje é
sempre em inglês) nem detalhes internos. As chaves de tradução ficam em
`api.errors.*` nos três idiomas.

## TanStack Query

`src/lib/api/api-query-client.ts` configura o `QueryClient`:

- `staleTime`: 30s: `refetchOnWindowFocus`: desabilitado.
- Sem retry automático para `400/401/403/404/409/429` (erros de cliente não
  se resolvem tentando de novo).
- No máximo 1 retry para os demais casos (rede, `5xx`).
- Mutations sem retry.

## Cancelamento de requisições

Services aceitam `signal?: AbortSignal` e o propagam ao Axios (ex.:
`getHealth(signal)`). Quando consumidos via `useQuery`, o TanStack Query já
fornece esse `signal` automaticamente, cancelando a requisição se o
componente desmontar antes da resposta.

## Tipos gerados via OpenAPI

```bash
npm run api:types
```

Gera `src/types/generated/api-types.ts` a partir de
`http://localhost:3110/docs-json` (o backend precisa estar rodando
localmente). O arquivo começa com um comentário indicando que é gerado
automaticamente e nunca deve ser editado manualmente. Ele ainda não é
consumido por nenhum service desta etapa — os tipos manuais em
`src/types/api.ts` e `src/services/health/health.types.ts` bastam para o
único endpoint integrado (`/health`). Deve ser regenerado e adotado
gradualmente conforme novos endpoints forem integrados a partir da Etapa 4.

## Health

`GET /health` → `src/services/health/health.service.ts`, consumido por
`useApiHealth` (`src/features/api-status/use-api-health.ts`) e exibido pelo
`ApiStatusCard` na Home.

## Autenticação

`POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`,
`POST /auth/change-password` e `GET /auth/me` — implementados na Etapa 4
via `src/features/auth/auth.service.ts`. Contrato completo e decisões de
design em [`03-authentication.md`](./03-authentication.md).

## Meta

`GET /meta` **não existe** no backend (confirmado: retorna 404). Por
instrução explícita de não inventar endpoints, `src/services/meta/` não foi
criado. Quando o endpoint existir, criar `meta.service.ts`/`meta.types.ts`
seguindo o mesmo padrão de `health/`.

## Dashboard

6 endpoints reais sob `/dashboard` (`overview`, `requests-over-time`,
`status-distribution`, `top-clients`, `top-routes`, `recent-requests`) —
implementados na Etapa 5 via `src/features/dashboard/dashboard.service.ts`.
Contrato completo, dados que o backend não expõe e a decisão sobre a
seção de auditoria em [`10-dashboard.md`](./10-dashboard.md).

## Usuários

`GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`,
`PATCH /users/:id/role`, `PATCH /users/:id/status`,
`POST /users/:id/reset-password`, `PATCH /users/:id/password-requirement`
e `GET /roles` — implementados na Etapa 6 via
`src/features/users/users.service.ts`. Contrato completo, a ausência de
paginação/busca/filtro no `GET /users` e as regras de permissão em
[`11-users.md`](./11-users.md).

## Fora de escopo nesta etapa

CRUDs de clientes, chaves de API, IPs permitidos, rotas do gateway e
cabeçalhos de rota, além das páginas dedicadas de Audit Logs e Request
Logs (o Dashboard consome `recent-requests` do próprio módulo de
dashboard, que é diferente do módulo `Request Logs`).
