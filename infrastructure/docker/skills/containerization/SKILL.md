---
name: containerization
description: Cria e altera Dockerfiles, docker-compose.yml e .env.example para PostgreSQL, API Node e front React. Use ao containerizar um serviço, adicionar serviço ao Compose, ajustar portas, volumes, healthcheck ou variáveis de ambiente.
---

# Containerization

## Pré-requisito

Leia [DOCKER.md](../../DOCKER.md). Se mexer no banco, leia também [database/DATABASE.md](../../../../database/DATABASE.md).

## Quando aplicar

- Containerizar um serviço novo (API ou front).
- Adicionar ou alterar serviço, porta, volume ou variável no Compose.
- Criar o `.env.example` de um projeto.

## Passos obrigatórios

1. **Copie do template.** Parta de [templates/docker](../../../../templates/docker): `docker-compose.yml`, `.env.example`, `node.Dockerfile`, `node.dev-entrypoint.sh`, `react.Dockerfile`, `react.dev-entrypoint.sh`, `.dockerignore`. A API completa (TypeScript + Prisma) está em [templates/backend/node](../../../../templates/backend/node).
2. **Dockerfile por serviço.** Coloque na pasta do serviço (`backend/node/Dockerfile`, `frontend/react/Dockerfile`) e o script em `docker/dev-entrypoint.sh` do serviço. Estágio `dev`: `FROM node:22-alpine AS dev`, `WORKDIR /app`, `COPY package.json package-lock.json`, `RUN npm ci` (e grava o hash das dependências), `COPY . .`, `EXPOSE`, `CMD ["sh","docker/dev-entrypoint.sh"]`. A API tem ainda os estágios `build` e `runtime` (produção). O Compose usa `target: dev`.
3. **`.dockerignore`.** Inclua `node_modules`, `.env` e `.git` em cada serviço.
4. **Compose.**
   - Serviço do banco chamado `postgres`, com healthcheck e volume nomeado.
   - `api` e `web` com `depends_on` (a `api` por `service_healthy`).
   - Código montado por bind mount e `node_modules` em volume nomeado, para o hot reload funcionar sem sobrescrever dependências.
   - Vite com `--host 0.0.0.0` e `usePolling: true` (necessário no Docker).
5. **Variáveis.**
   - Obrigatórias com `${VAR:?mensagem}` (usuário, senha, banco).
   - Portas com padrão: `${POSTGRES_PORT:-5432}`, `${API_PORT:-4000}`, `${WEB_PORT:-3000}`, sempre publicadas como `"127.0.0.1:${PORTA:-X}:X"`.
   - `api` define `DATABASE_URL` e `TEST_DATABASE_URL`; `web` define `API_PROXY_TARGET=http://api:4000` (sem `VITE_API_URL`, sem CORS).
   - `DATABASE_URL` usa o host `postgres`, nunca `localhost`.
6. **`.env.example`** com todas as variáveis, sem segredo real. Confirme que `.env` está no `.gitignore`.
7. **Valide.** `docker compose config` sem erro, depois siga a skill `local-environment` para subir e conferir.

## Checklist de conclusão

- [ ] Um Dockerfile, um `.dockerignore` e um `docker/dev-entrypoint.sh` por serviço
- [ ] Healthcheck em `postgres`, `api` e `web`; `depends_on: service_healthy` na `api` e na `web`
- [ ] Portas em `127.0.0.1`
- [ ] Volume nomeado para dados do banco e para `node_modules`
- [ ] Credenciais obrigatórias via `${VAR:?}`; portas com padrão
- [ ] `.env.example` completo e `.env` no `.gitignore`
- [ ] `docker compose config` e `docker compose up -d --build` funcionam

## Limites

- Subir, parar e diagnosticar ficam em `local-environment`.
- Modelagem e migrations ficam nas skills de `database/`.
- Produção (imagens finais, registry, orquestração) está fora deste guia.
