---
description: Sobe o ambiente local (banco, API e tela) com Docker
---

Suba o ambiente local para uma pessoa que pode não ser desenvolvedora. Explique em linguagem simples e execute os comandos você mesmo.

1. Rode `docker info`. Se falhar, rode `open -a Docker`, aguarde ~30s e tente de novo. Se o Docker não estiver instalado, oriente a baixar em https://www.docker.com/products/docker-desktop/ e pare.
2. Rode `docker compose up -d --build`.
3. Confira com `docker compose ps` que `db`, `api` e `web` estão rodando (o `db` deve estar `healthy`).
4. Teste `curl -s localhost:4000/health` e confirme que retorna `{"api":"ok","db":"ok"}`.
5. Informe à pessoa:
   - Tela: http://localhost:3000
   - API: http://localhost:4000/health

Se algo falhar:
- Veja o erro com `docker compose logs --tail=100 <serviço>`.
- Porta ocupada: diga qual porta (3000 ou 4000) e, se possível, qual programa a usa. Não pare containers de outros projetos sem pedir confirmação.

Nunca use `docker compose down -v`, `docker volume rm` ou `docker system prune`.
