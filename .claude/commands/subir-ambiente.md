---
description: Sobe o ambiente local (banco, API e tela) com Docker
---

Suba o ambiente local para uma pessoa que pode não ser desenvolvedora. Explique em linguagem simples e execute os comandos você mesmo.

1. Rode `docker info`. Se falhar, rode `open -a Docker`, aguarde ~30s e tente de novo. Se o Docker não estiver instalado, oriente a baixar em https://www.docker.com/products/docker-desktop/ e pare.
2. Se não existir `.env`, rode `cp .env.example .env`.
3. Rode `docker compose up -d --build`.
4. Confira com `docker compose ps` que `postgres`, `api` e `web` estão rodando (o `postgres` deve estar `healthy`).
5. Teste `curl -s localhost:4000/health` e confirme que retorna `{"api":"ok","db":"ok"}`.
6. Informe à pessoa:
   - Tela: http://localhost:3000
   - API: http://localhost:4000/health

Se algo falhar:
- Veja o erro com `docker compose logs --tail=100 <serviço>`.
- Porta ocupada: diga qual porta e qual programa a usa, e mude a porta no `.env` (`POSTGRES_PORT`, `API_PORT`, `WEB_PORT`). Não pare containers de outros projetos sem pedir confirmação.

Nunca use `docker compose down -v`, `docker volume rm` ou `docker system prune`.
