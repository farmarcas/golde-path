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

1. **Copie do template.** Parta de [templates/docker](../../../../templates/docker): `docker-compose.yml`, `.env.example`, `node.Dockerfile`, `react.Dockerfile`, `.dockerignore`.
2. **Dockerfile por serviço.** Coloque na pasta do serviço (`backend/node/Dockerfile`, `frontend/react/Dockerfile`). Ordem: `FROM node:20-alpine`, `WORKDIR /app`, `COPY package*.json`, `RUN npm install`, `COPY . .`, `EXPOSE`, `CMD ["npm","run","dev"]`.
3. **`.dockerignore`.** Inclua `node_modules`, `.env` e `.git` em cada serviço.
4. **Compose.**
   - Serviço do banco chamado `postgres`, com healthcheck e volume nomeado.
   - `api` e `web` com `depends_on` (a `api` por `service_healthy`).
   - Código montado por bind mount e `node_modules` em volume nomeado, para o hot reload funcionar sem sobrescrever dependências.
   - Vite com `--host 0.0.0.0` e `usePolling: true` (necessário no Docker).
5. **Variáveis.**
   - Obrigatórias com `${VAR:?mensagem}` (usuário, senha, banco).
   - Portas com padrão: `${POSTGRES_PORT:-5432}`, `${API_PORT:-4000}`, `${WEB_PORT:-3000}`.
   - `DATABASE_URL` usa o host `postgres`, nunca `localhost`.
6. **`.env.example`** com todas as variáveis, sem segredo real. Confirme que `.env` está no `.gitignore`.
7. **Valide.** `docker compose config` sem erro, depois siga a skill `local-environment` para subir e conferir.

## Checklist de conclusão

- [ ] Um Dockerfile e um `.dockerignore` por serviço
- [ ] Healthcheck no `postgres` e `depends_on: service_healthy` na `api`
- [ ] Volume nomeado para dados do banco e para `node_modules`
- [ ] Credenciais obrigatórias via `${VAR:?}`; portas com padrão
- [ ] `.env.example` completo e `.env` no `.gitignore`
- [ ] `docker compose config` e `docker compose up -d --build` funcionam

## Limites

- Subir, parar e diagnosticar ficam em `local-environment`.
- Modelagem e migrations ficam nas skills de `database/`.
- Produção (imagens finais, registry, orquestração) está fora deste guia.
