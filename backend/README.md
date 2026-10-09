# Backend — Golden Path

Esta pasta **não é uma API**. É a base de conhecimento que o agente segue para criar e evoluir backends. Quem pede pode ser leigo: o agente escolhe a stack padrão e não oferece alternativa. Só sai do padrão se o pedido for explícito.

Dois runtimes, **um contrato HTTP**. Front não distingue se quem respondeu foi Node ou Python.

## O que tem aqui

```
backend/
├── node/skills/
│   ├── api-development/SKILL.md   # como construir a API Node
│   └── testing/SKILL.md           # teste unitário com Vitest
└── python/skills/
    ├── api-development/SKILL.md   # como construir a API Python
    └── testing/SKILL.md           # vazio
```

| Skill | Quando usar |
|-------|-------------|
| `node-api-development` | Criar endpoint, CRUD, service, validação, Postgres, Dockerfile em Node |
| `node-unit-testing` | Testar regra de negócio isolada (service) em Node |
| `python-api-development` | Mesmo trabalho, em Python |
| skill de teste Python | Ainda sem conteúdo |

## Contrato HTTP (igual nos dois)

- Prefixo `/api/v1`. Recurso no plural, kebab-case: `/api/v1/users`, `/api/v1/order-items`.
- `GET` lista ou detalhe. `POST` cria (201). `PUT`/`PATCH` atualiza (200). `DELETE` remove (204).
- Lista sempre paginada: `?page=1&pageSize=20` (máx. 100). Corpo `{ data, meta: { page, pageSize, total } }`.
- JSON em camelCase. Data em ISO 8601 UTC.
- Erro sempre no mesmo formato:

```json
{ "error": { "code": "USER_NOT_FOUND", "message": "Usuário não encontrado", "details": [] } }
```

- Validação inválida → 400 `VALIDATION_ERROR`. Não encontrado → 404. Duplicado → 409.
- `GET /health` (processo vivo) e `GET /health/ready` (banco responde). Ficam fora de `/api/v1`.

Erro desconhecido vira 500 genérico. Stack, SQL e DSN nunca voltam para o cliente.

## Arquitetura

Código organizado por **módulo de domínio**, não por tipo de arquivo. Recurso novo = pasta nova em `modules/` com os mesmos arquivos.

Camadas, de fora para dentro:

| Camada | Faz | Não faz |
|--------|-----|---------|
| rota / router | Liga verbo, caminho, validação e controller | Regra de negócio, banco |
| controller / router | Traduz HTTP | Banco, regra |
| service | Regra de negócio. Lança erro de domínio | `req`/`res`, FastAPI, Prisma, SQLAlchemy |
| repository | Único acesso ao banco. Devolve objeto simples | Regra de negócio |
| schema | Contrato de entrada e saída | Tipo duplicado à mão |

Dependência entra por factory (Node) ou construtor (Python), para o teste injetar um fake.

## Stacks

### Node

| Camada | Escolha |
|--------|---------|
| Runtime | Node.js LTS, fixado em `.nvmrc` e `engines` |
| Linguagem | TypeScript `strict` |
| HTTP | Express 5 |
| Validação | Zod (body, params, query, env) |
| Banco | PostgreSQL via Prisma |
| Logs | Pino (`pino-http`) em JSON |
| Testes | Vitest + Supertest |
| Qualidade | ESLint + Prettier |
| Execução | Docker + docker-compose |

Arquivos de um módulo: `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schemas.ts`, `*.test.ts`.

App sobe em `server.ts`. `app.ts` monta Express sem `listen`. Toda env passa por `src/config/env.ts` com Zod. App não sobe se faltar variável. `process.env` fora desse arquivo é proibido.

### Python

| Camada | Escolha |
|--------|---------|
| Runtime | Python 3.12 |
| HTTP | FastAPI |
| Validação | Pydantic v2 |
| Config | pydantic-settings |
| Banco | PostgreSQL via SQLAlchemy 2 (async) |
| HTTP externo | httpx |
| Logs | structlog em JSON |
| Testes | pytest + pytest-asyncio |
| Qualidade | Ruff + Pyright `strict` |
| Pacotes | uv |
| Execução | Docker + docker-compose |

Arquivos de um módulo: `router.py`, `schemas.py`, `service.py`, `repository.py`, `test_service.py`.

`main.py` cria o FastAPI. `uvicorn` sobe só no Docker ou no comando de dev. Toda env passa por `app/config/settings.py`. `os.environ` fora desse arquivo é proibido.

Proibido nesta stack: Flask, Django, `requests`, SQL concatenado, `print`, Pydantic v1.

## Banco

Schema, tabela e migration **não nascem nestas skills**. Ficam na base de conhecimento do banco.

- Node: uma instância de `PrismaClient`. Transação quando muda mais de uma tabela. Sem `$queryRawUnsafe` com input do usuário.
- Python: uma engine no processo, sessão async por request. Commit no fim da request. SQL cru só com `text()` e parâmetro nomeado.

Selecionar só o campo necessário. Sem N+1 (query dentro de loop).

## Testes

Dois níveis:

1. **Unitário do service** — regra isolada. Sem banco, sem HTTP, sem Docker. Repository entra como fake. TDD: teste falha antes do código de produção.
2. **Integração de rota** — Node cobre com Supertest em cima do `app` (sem `listen`) e Postgres de teste. Python deixa teste de rota (TestClient + banco) fora da skill de API.

Nome do caso:

- Node: `deve <resultado> quando <cenário>`
- Python: `test_deve_<resultado>_quando_<cenario>`

Cada método público cobre caminho feliz, cada erro de domínio e a borda que muda a regra. O que Zod/Pydantic já rejeita na borda HTTP não se repete no service.

Entrega só com suíte verde: `npm test` (Node) ou `uv run pytest` (Python).

## Logs

Logger da stack (Pino ou structlog). Nunca `console.log` nem `print`.

Cada request carrega `x-request-id` (header ou id gerado). Esse id entra em todo log da request.

- `error` — falha inesperada
- `warn` / `warning` — anomalia já tratada
- `info` — evento de negócio
- `debug` — só local

## Docker

Imagem multi-stage, usuário não-root, `HEALTHCHECK` em `/health/ready`. `docker compose up` sobe API e banco sem passo manual (a API aplica as migrations pendentes ao iniciar). Processo trata shutdown: para de aceitar conexão e fecha Prisma ou a engine.

## Fora de escopo

Auth, JWT, senha, CORS, rate limit, helmet e auditoria de dependência ficam para skill futura. Não entram por conta própria.
