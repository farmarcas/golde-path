# Direcionamento de ferramentas — Backend

Use este arquivo como roteador. Antes de alterar backend, identifique runtime e tipo de tarefa. Depois carregue somente as skills aplicáveis.

## Escolha do runtime

- Projeto existente: preserve runtime e stack encontrados no repositório.
- Projeto novo com runtime informado: use runtime pedido.
- Projeto novo sem runtime informado: use **Node.js**.
- Não misture Node.js e Python no mesmo serviço.
- Só ofereça alternativas de stack quando usuário pedir comparação.

## Skills disponíveis

### `node-api-development`

Arquivo: [`node/skills/api-development/SKILL.md`](node/skills/api-development/SKILL.md)

Use quando tarefa envolver backend Node.js/TypeScript:

- criar ou alterar API REST, endpoint, CRUD ou módulo;
- criar route, controller, service, repository ou schema Zod;
- integrar PostgreSQL via Prisma;
- configurar env, logs, tratamento de erros, paginação ou health checks;
- criar Dockerfile ou docker-compose do serviço;
- escrever teste de integração HTTP com Supertest.

Não use para:

- backend Python;
- teste unitário isolado sem mudança na API: use `node-unit-testing`;
- migration, DDL ou alteração de `schema.prisma`;
- autenticação, JWT, CORS, rate limit ou auditoria de dependências.

### `node-unit-testing`

Arquivo: [`node/skills/testing/SKILL.md`](node/skills/testing/SKILL.md)

Use quando tarefa envolver Node.js e:

- criar ou alterar regra de negócio em service;
- criar teste unitário com Vitest;
- aplicar TDD;
- testar helper puro;
- testar erros de domínio e edge cases.

Use junto com `node-api-development` quando endpoint ou CRUD tiver regra de negócio.

Não use para:

- repository Prisma;
- route ou controller sem lógica;
- schema Zod sem regra adicional;
- teste HTTP com Supertest;
- banco, Docker ou teste de integração.

### `python-api-development`

Arquivo: [`python/skills/api-development/SKILL.md`](python/skills/api-development/SKILL.md)

Use quando tarefa envolver backend Python:

- criar ou alterar API REST, endpoint, CRUD ou módulo;
- criar router, service, repository ou schema Pydantic;
- integrar PostgreSQL via SQLAlchemy async;
- integrar API externa via httpx;
- configurar settings, logs, erros, paginação ou health checks;
- criar Dockerfile ou docker-compose;
- criar ou alterar teste unitário de service com pytest.

Não use para:

- backend Node.js;
- Flask, Django, `requests` ou Pydantic v1;
- migration, DDL ou Alembic;
- teste de rota com TestClient e banco;
- autenticação, JWT, CORS, rate limit ou auditoria de dependências.

## Matriz rápida

| Pedido | Ferramenta |
|---|---|
| Novo backend sem stack definida | `node-api-development` |
| Endpoint ou CRUD Node | `node-api-development` + `node-unit-testing` |
| Regra de negócio Node | `node-unit-testing` |
| Teste unitário Node | `node-unit-testing` |
| Teste de integração HTTP Node | `node-api-development` |
| Prisma, repository ou Docker Node | `node-api-development` |
| Endpoint ou CRUD Python | `python-api-development` |
| Regra ou teste unitário Python | `python-api-development` |
| SQLAlchemy, httpx ou Docker Python | `python-api-development` |
| Migration ou alteração de schema do banco | Nenhuma destas skills; usar ferramenta de banco |
| Auth, JWT ou segurança HTTP | Nenhuma destas skills; aguardar skill específica |

## Regras de combinação

1. Carregue skill de API para definir arquitetura, contrato HTTP e stack.
2. Em Node, carregue também skill de testes ao alterar comportamento testável.
3. Em Python, regras de teste já estão em `python-api-development`.
4. Aplique TDD: teste falhando antes do código de produção.
5. Não use skill de outro runtime como complemento.
6. Se pedido ultrapassar escopo da skill, não improvise padrão: use ferramenta específica ou informe lacuna.

## Contrato comum

Independentemente do runtime:

- recursos REST em `/api/v1`, plural e kebab-case;
- entrada validada na borda;
- regra de negócio no service;
- banco acessado somente pelo repository;
- erros no formato `{ "error": { "code": "...", "message": "...", "details": [] } }`;
- listagens paginadas;
- datas em ISO 8601 UTC;
- `/health` e `/health/ready`;
- logs estruturados com `x-request-id`;
- Docker multi-stage e usuário não-root;
- entrega somente com lint, checagem de tipos e testes verdes.
