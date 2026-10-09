---
name: node-api-development
description: Boas práticas e padrão obrigatório para criar e evoluir APIs REST em Node.js + TypeScript (Express, Zod, Prisma, PostgreSQL, Vitest, Docker) no golden path. Use ao criar endpoints, CRUDs, services, validações, integração com Postgres, testes ou Dockerfile de backend Node, ou quando o usuário pedir "criar API", "novo endpoint", "backend em Node".
---

# Desenvolvimento de API Node.js (Golden Path)

Esqueleto pensado para vibecode: quem pede pode ser leigo, então **o agente decide pela stack padrão abaixo e não oferece alternativas**. Só fugir do padrão se o usuário pedir explicitamente.

## Stack padrão (não trocar)

| Camada | Escolha |
|--------|---------|
| Runtime | Node.js LTS (versão fixada em `.nvmrc` e `engines`) |
| Linguagem | TypeScript `strict: true` |
| HTTP | Express 5 |
| Validação | Zod (body, params, query e env) |
| Banco | PostgreSQL via Prisma |
| Logs | Pino (`pino-http`) em JSON |
| Testes | Vitest + Supertest |
| Qualidade | ESLint + Prettier |
| Execução | Docker + docker-compose |

## Estrutura de pastas

Organizar por **módulo de domínio** (feature), não por tipo de arquivo:

```
src/
├── app.ts                 # cria o Express, middlewares, rotas (sem listen)
├── server.ts              # sobe o servidor, graceful shutdown
├── config/
│   └── env.ts             # leitura e validação das variáveis de ambiente
├── shared/
│   ├── errors/            # AppError, NotFoundError, ValidationError...
│   ├── middlewares/       # errorHandler, validate, requestId
│   ├── database/prisma.ts # instância única do PrismaClient
│   └── logger.ts
└── modules/
    └── users/
        ├── users.routes.ts      # só mapeia rota -> controller
        ├── users.controller.ts  # HTTP: lê req, chama service, devolve res
        ├── users.service.ts     # regra de negócio
        ├── users.repository.ts  # acesso ao banco (Prisma)
        ├── users.schemas.ts     # schemas Zod + tipos inferidos
        └── users.test.ts
```

Novo recurso = nova pasta em `modules/` com os mesmos 6 arquivos.

## Responsabilidade de cada camada

- **routes**: liga verbo + caminho + middleware de validação + controller. Zero lógica.
- **controller**: traduz HTTP. Não acessa banco, não tem regra de negócio.
- **service**: regras de negócio. Não conhece `req`/`res`. Lança erros de domínio (`NotFoundError`, `ConflictError`).
- **repository**: única camada que importa Prisma. Retorna objetos simples.
- **schemas**: contrato de entrada/saída. Tipos TS vêm de `z.infer`, nunca duplicados à mão.

Dependências recebidas por parâmetro (factory/constructor) para facilitar teste:

```ts
export const makeUsersService = (repo: UsersRepository) => ({
  async create(input: CreateUserInput) {
    if (await repo.findByEmail(input.email)) throw new ConflictError('E-mail já cadastrado');
    return repo.create(input);
  },
});
```

## Configuração e variáveis de ambiente

- Toda env passa por `src/config/env.ts` com Zod. App **não sobe** se faltar variável.
- Proibido `process.env.X` fora de `env.ts`.
- `.env` no `.gitignore`; manter `.env.example` atualizado com todas as chaves (sem valores reais).

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
});
export const env = envSchema.parse(process.env);
```

## Validação de entrada

- Todo endpoint valida `body`, `params` e `query` com Zod via middleware `validate(schema)`.
- Nunca confiar em dado do cliente; nunca repassar `req.body` direto pro banco.
- Usar `.strict()` em objetos de body para rejeitar campos desconhecidos.

```ts
export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
}).strict();
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

## Tratamento de erros

- Um único `errorHandler` registrado por último no `app.ts`.
- Erros de domínio estendem `AppError` com `statusCode` e `code`.
- Erro desconhecido: logar com stack, responder 500 genérico (nunca vazar stack/SQL ao cliente).
- Express 5 já propaga rejeição de handler `async`; não usar `try/catch` só para repassar `next(err)`.

Formato padrão de erro (sempre o mesmo):

```json
{ "error": { "code": "USER_NOT_FOUND", "message": "Usuário não encontrado", "details": [] } }
```

Mapeamento: Zod -> 400 `VALIDATION_ERROR` · não encontrado -> 404 · duplicado (Prisma `P2002`) -> 409.

## Padrão REST

- Recursos no plural, kebab-case: `/api/v1/users`, `/api/v1/order-items`.
- Versionar com prefixo `/api/v1`.
- Verbos: `GET` lista/detalhe, `POST` cria (201 + recurso), `PUT`/`PATCH` atualiza (200), `DELETE` remove (204).
- Listagens sempre paginadas: `?page=1&pageSize=20` (máx. 100), resposta `{ data, meta: { page, pageSize, total } }`.
- JSON em camelCase. Datas em ISO 8601 UTC.
- `GET /health` (liveness) e `GET /health/ready` (checa banco) obrigatórios.

## Banco de dados (Prisma + Postgres)

Schema, tabelas e migrations ficam com a base de conhecimento do banco. Esta skill não cria migration, não roda `prisma migrate` e não altera `schema.prisma`.

- Uma única instância de `PrismaClient` (`shared/database/prisma.ts`).
- Operações que alteram várias tabelas: `prisma.$transaction`.
- Selecionar só campos necessários (`select`).
- Evitar N+1: usar `include`/`select` aninhado em vez de query dentro de loop.
- SQL cru só com `$queryRaw` + template tag (parametrizado). Proibido `$queryRawUnsafe` com input do usuário.

## Fora de escopo agora

Auth, JWT, senha, helmet, CORS, rate limit e auditoria de dependências ficam para uma skill futura. Não adicionar isso por conta própria.

## Logs e observabilidade

- Usar `logger` (Pino), nunca `console.log`.
- `pino-http` com `requestId` (header `x-request-id` ou UUID gerado) em todo log.
- Níveis: `error` falha inesperada · `warn` situação anômala tratada · `info` eventos de negócio · `debug` só local.

## Código TypeScript

- `strict: true`, sem `any` (usar `unknown` + narrowing). `noUncheckedIndexedAccess` ligado.
- ES Modules (`"type": "module"`).
- `async/await` sempre; nada de callback ou `.then` encadeado.
- Funções pequenas, um propósito, nomes descritivos em inglês (`findUserByEmail`).
- Sem números/strings mágicos: constantes nomeadas.
- Sem código comentado ou morto.
- Nunca bloquear o event loop (sem `fs.*Sync` ou loops pesados em request).

## Testes

Testes unitários: seguir a skill [testing](../testing/SKILL.md).

Rotas: teste de integração com Supertest sobre `app` (sem `listen`), banco de teste real, dentro do Docker: `docker compose exec api npm run test:integration` (usa o banco `<POSTGRES_DB>_test`, criado pelo Prisma, nunca o de desenvolvimento). Cobrir caminho feliz, validação (400), não encontrado (404) e conflito (409).

## Scripts do package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "lint": "eslint . && prettier --check .",
    "test": "vitest run",
    "test:integration": "DATABASE_URL=\"$TEST_DATABASE_URL\" NODE_ENV=test prisma migrate deploy && vitest run --config vitest.integration.config.ts"
  }
}
```

## Docker

- Multi-stage: `dev` (usado pelo Compose local: hot reload, código por bind mount) -> `build` (instala tudo, compila) -> `runtime` (só `dependencies` + `dist`; último estágio = padrão de `docker build`).
- O Compose usa `target: dev` e inicia por `docker/dev-entrypoint.sh`: reinstala dependências só se `package.json`/`package-lock.json` mudaram, roda `prisma generate`, aplica `prisma migrate deploy` e sobe `npm run dev`.
- Fonte da verdade: [`backend/node/Dockerfile`](../../Dockerfile). Não reescreva de cabeça; copie.
- Imagem `node:<lts>-alpine`, `NODE_ENV=production`, `npm ci --omit=dev`.
- Rodar como usuário não-root (`USER node`).
- `HEALTHCHECK` batendo em `/health/ready`.
- `.dockerignore` com `node_modules`, `.env`, `dist`, `.git`.
- `server.ts` trata `SIGTERM`/`SIGINT`: para de aceitar conexões, fecha Prisma, sai.

Veja o arquivo completo em [`backend/node/Dockerfile`](../../Dockerfile) (porta `4000`, healthcheck em `/health/ready`).

## Fluxo para criar um novo endpoint/recurso

```
- [ ] 1. Schemas Zod em <modulo>.schemas.ts
- [ ] 2. Repository (Prisma) em cima do schema já existente; tabelas de domínio usam exclusão lógica (`deletedAt`), nunca `delete` físico
- [ ] 3. Teste do service falhando (RED)
- [ ] 4. Service com a regra de negócio (GREEN)
- [ ] 5. Controller + routes com validate(schema); registrar rota no app.ts
- [ ] 6. Teste de integração da rota (feliz, 400, 404/409)
- [ ] 7. `npm run lint` e `npm test` verdes
- [ ] 8. Atualizar .env.example se surgiu variável nova
```

## Checklist antes de entregar

- [ ] Toda entrada validada com Zod
- [ ] Erros no formato padrão, sem stack para o cliente
- [ ] Nenhum `any`, `console.log` ou `process.env` fora de `env.ts`
- [ ] Listagens paginadas
- [ ] Testes cobrindo feliz + erros, `npm test` verde
- [ ] `docker compose up` sobe API e banco sem passos manuais
