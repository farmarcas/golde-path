---
name: local-environment
description: Sobe, para, reinicia e diagnostica o ambiente local com Docker Compose (postgres, api, web). Use quando pedirem para rodar o projeto, ver logs, corrigir porta ocupada, reiniciar um serviço ou parar tudo, inclusive para pessoas não técnicas.
---

# Local environment

## Pré-requisito

Leia [DOCKER.md](../../DOCKER.md). Explique em linguagem simples e execute os comandos você mesmo.

## Quando aplicar

- "Sobe o projeto", "roda o ambiente", "para tudo".
- Erro ao subir, serviço fora do ar, porta ocupada.

## Passos obrigatórios

### Subir
1. Rode `docker info`. Se falhar, rode `open -a Docker`, aguarde ~30s e tente de novo. Se o Docker não estiver instalado, oriente a baixar em https://www.docker.com/products/docker-desktop/ e pare.
2. Se não existir `.env`, rode `cp .env.example .env`.
3. Rode `docker compose up -d --build`.
4. Confira com `docker compose ps` que `postgres` está `healthy` e `api` e `web` estão `running`.
5. Teste `curl -s localhost:${API_PORT:-4000}/health`. O esperado é `{"api":"ok","db":"ok"}`.
6. Informe as URLs: tela em `http://localhost:3000` e API em `http://localhost:4000/health` (ajuste se as portas do `.env` forem outras).

### Parar
- Rode `docker compose down` (sem `-v`) e confirme com `docker compose ps`. Informe que os dados foram mantidos.

### Diagnosticar
- Logs: `docker compose logs --tail=100 <serviço>`.
- Reiniciar um serviço: `docker compose restart <serviço>`.
- **Porta ocupada** (`port is already allocated`): descubra quem usa com `docker ps` e `lsof -nP -iTCP:<porta> -sTCP:LISTEN`. Em vez de parar o outro programa, mude a porta no `.env` (`POSTGRES_PORT`, `API_PORT` ou `WEB_PORT`) e suba de novo. Só pare containers de outros projetos com confirmação explícita.
- Variável faltando: o Compose mostra qual; complete no `.env` a partir do `.env.example`.

## Nunca sem confirmação explícita

`docker compose down -v`, `docker volume rm`, `docker volume prune`, `docker system prune`, `docker image prune`: apagam os dados do banco local. Explique o que será perdido antes de perguntar.

## Checklist de conclusão

- [ ] Docker aberto e `.env` presente
- [ ] `postgres` saudável, `api` e `web` rodando
- [ ] `/health` retornando `api: ok` e `db: ok`
- [ ] URLs informadas à pessoa
- [ ] Nenhum dado ou container de outro projeto afetado

## Limites

- Alterar Dockerfile ou Compose fica em `containerization`.
