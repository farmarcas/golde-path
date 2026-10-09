# Golden Path — ambiente local via Docker

Quem usa este projeto pode não ser desenvolvedor. Explique em linguagem simples, sem jargão, e faça você mesmo os comandos em vez de pedir que a pessoa rode no terminal.

## Pré-requisito
- Docker Desktop instalado e aberto.

## Antes de qualquer coisa
1. Rode `docker info`.
2. Se falhar, o Docker Desktop não está aberto: rode `open -a Docker` (macOS), aguarde ~30s e tente `docker info` de novo.
3. Se o Docker não estiver instalado, oriente a pessoa a baixar em https://www.docker.com/products/docker-desktop/ e pare por aí.

## Subir o ambiente
- `docker compose up -d --build`
- Confira com `docker compose ps` que todos os serviços estão `running`/`healthy`.
- Informe à pessoa a URL de acesso (ex.: http://localhost:3000).

## Problemas comuns
- Ver erros: `docker compose logs --tail=100 <serviço>`
- Reiniciar: `docker compose restart <serviço>`
- Parar tudo: `docker compose down`
- Porta ocupada: avise qual porta e qual programa pode estar usando.

## Nunca faça sem pedir confirmação explícita
- `docker compose down -v`, `docker volume rm`, `docker system prune` — apagam dados do banco local.
