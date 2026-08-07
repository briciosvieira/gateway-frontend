# Visão do produto

## Objetivo do frontend

O Gateway Hub LF Frontend é a interface administrativa usada para configurar,
monitorar e auditar o Gateway Hub LF. Ele expõe, de forma visual, as
capacidades administrativas já disponíveis no backend: gestão de clientes,
chaves de API, IPs permitidos, rotas do gateway, cabeçalhos de rota e logs de
auditoria e de requisições.

## Público-alvo

- Administradores responsáveis pela configuração do gateway.
- Operadores que acompanham o funcionamento das integrações no dia a dia.
- Auditores que precisam consultar logs de acesso e de auditoria.

## Relação com o backend

O frontend consome exclusivamente a API administrativa do backend Gateway Hub
LF, disponível localmente em `http://localhost:3110`, sob o prefixo
`/api/v1`. Toda a lógica de negócio, validação e persistência é
responsabilidade do backend; o frontend é uma camada de apresentação e
interação.

## Módulos administrativos futuros

- Autenticação e gestão de sessão.
- Dashboard com indicadores gerais.
- Gestão de usuários e permissões (perfis ADMIN, OPERATOR, VIEWER, AUDITOR).
- Gestão de clientes.
- Gestão de chaves de API.
- Gestão de IPs permitidos.
- Gestão de rotas do gateway e de cabeçalhos de rota.
- Consulta de logs de auditoria e de requisições.
- Perfil do usuário autenticado.

## Escopo atual (Etapa 1)

Esta etapa entrega apenas a fundação técnica do frontend:

- Projeto React + Vite + TypeScript criado e organizado.
- Estrutura de pastas definida.
- Roteamento inicial com página inicial provisória e página 404.
- Alias de import `@/`.
- Variáveis de ambiente tipadas.
- ESLint e Prettier configurados.
- Documentação inicial do projeto.

## Itens fora desta etapa

- TailwindCSS e Shadcn UI.
- Tela de login e autenticação.
- Axios e integração com o backend.
- Dashboard e CRUDs administrativos.
- Rotas protegidas e controle de permissões.
- Layout administrativo (sidebar, header).
- Testes automatizados.
- Docker, Nginx e deploy.

Esses itens estão planejados para etapas futuras, descritas em
[`09-roadmap.md`](./09-roadmap.md).
