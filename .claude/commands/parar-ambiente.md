---
description: Para o ambiente local sem apagar os dados do banco
---

Pare o ambiente local para uma pessoa que pode não ser desenvolvedora. Explique em linguagem simples e execute os comandos você mesmo.

1. Rode `docker compose down` (sem `-v`, para não apagar os dados do banco).
2. Confirme com `docker compose ps` que nada está rodando.
3. Diga à pessoa que o ambiente foi parado, que os dados do banco foram mantidos e que `/subir-ambiente` liga tudo de novo.

Nunca use `docker compose down -v`, `docker volume rm` ou `docker system prune`: eles apagam os dados do banco. Se a pessoa pedir para apagar os dados, explique o que será perdido e peça confirmação explícita antes.
