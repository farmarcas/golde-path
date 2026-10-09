# Docker — Golden Path

Políticas para containerizar e rodar o ambiente local (PostgreSQL, API Node e front React) com Docker Compose. Quem usa pode não ser desenvolvedor: explique em linguagem simples e execute os comandos você mesmo.

Use este guia ao criar ou alterar Dockerfile, `docker-compose.yml`, `.env.example`, ou ao subir, parar e diagnosticar o ambiente.

Skills de procedimento (ler depois deste arquivo):

- [containerization](skills/containerization/SKILL.md) — Dockerfiles e Compose
- [local-environment](skills/local-environment/SKILL.md) — subir, parar e diagnosticar

## Stack

- Docker Desktop + Docker Compose (`docker compose`, sem hífen).
- Serviços padrão: `postgres` (`postgres:16-alpine`), `api` (Node 22, TypeScript + Prisma), `web` (React + Vite).
- Alinhado a [database/DATABASE.md](../../database/DATABASE.md): serviço `postgres`, healthcheck, volume nomeado, porta publicada só em desenvolvimento.
- Fonte da verdade: o `docker-compose.yml`, o `.env.example` e os Dockerfiles da raiz e de `backend/node` e `frontend/react`, que rodam de verdade. [templates/docker](../../templates/docker) e [templates/backend/node](../../templates/backend/node) são cópias geradas por `scripts/sync-templates.sh` (a CI barra divergência). Não edite os templates à mão.

## Regras

- Um Dockerfile por serviço, imagem base `node:22-alpine`, `COPY package*.json` antes do código para aproveitar cache e `npm ci` (com `package-lock.json` versionado), nunca `npm install`.
- O Compose usa o alvo `dev` do Dockerfile. O `docker/dev-entrypoint.sh` de cada serviço reinstala dependências sozinho quando `package.json`/`package-lock.json` mudam (o volume `node_modules` não é atualizado pelo rebuild). Nunca peça para apagar volume para resolver dependência.
- Compose com **healthcheck** no banco e `depends_on` com `condition: service_healthy`.
- **Volume nomeado** para os dados do Postgres. Nunca bind mount no diretório de dados.
- Credenciais só em `.env` (fora do git). O repo traz `.env.example`, e o Compose falha com mensagem clara se faltar variável obrigatória.
- Portas configuráveis por variável (`POSTGRES_PORT`, `API_PORT`, `WEB_PORT`) com padrão 5432, 4000 e 3000, **publicadas só em `127.0.0.1`** (`"127.0.0.1:${PORTA:-X}:X"`): a rede local não acessa o banco nem a API.
- Healthcheck também em `api` (`/health/ready`) e `web`; `web` espera `api` ficar saudável.
- O navegador só fala com a `web`: o Vite repassa `/api` e `/health` para `http://api:4000`. Por isso a API não precisa de CORS e nada usa `localhost` entre serviços.
- O Postgres sobe com `POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=C.UTF-8"`.
- A API aplica `prisma migrate deploy` ao iniciar. Testes de integração: `docker compose exec api npm run test:integration` (banco `<POSTGRES_DB>_test`).
- Serviços conversam pelo nome do serviço (`postgres`), nunca por `localhost`.
- Senhas do `.env.example` são só para uso local; nunca usar em produção.

## Operações proibidas sem confirmação explícita

Apagam os dados do banco local:

- `docker compose down -v` / `--volumes`
- `docker volume rm`, `docker volume prune`
- `prisma migrate reset`, `prisma db push --force-reset`, `DROP`/`TRUNCATE` no banco
- `docker system prune`, `docker image prune`

Antes de pedir confirmação, explique o que será perdido. Não pare nem remova containers de outros projetos.

## Checklist final do agente

- [ ] Um Dockerfile por serviço com cache de dependências
- [ ] Compose com healthcheck no `postgres` e `depends_on` por saúde
- [ ] Volume nomeado para os dados do banco
- [ ] `.env.example` presente, `.env` no `.gitignore`
- [ ] Portas por variável, com padrão, publicadas em `127.0.0.1`
- [ ] Healthcheck em `postgres`, `api` e `web`
- [ ] `docker compose up -d --build` sobe tudo e `docker compose ps` mostra os serviços saudáveis
- [ ] Nenhuma operação destrutiva executada sem confirmação
