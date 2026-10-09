# Docker — Golden Path

Políticas para containerizar e rodar o ambiente local (PostgreSQL, API Node e front React) com Docker Compose. Quem usa pode não ser desenvolvedor: explique em linguagem simples e execute os comandos você mesmo.

Use este guia ao criar ou alterar Dockerfile, `docker-compose.yml`, `.env.example`, ou ao subir, parar e diagnosticar o ambiente.

Skills de procedimento (ler depois deste arquivo):

- [containerization](skills/containerization/SKILL.md) — Dockerfiles e Compose
- [local-environment](skills/local-environment/SKILL.md) — subir, parar e diagnosticar

## Stack

- Docker Desktop + Docker Compose (`docker compose`, sem hífen).
- Serviços padrão: `postgres` (`postgres:16-alpine`), `api` (Node 20), `web` (React + Vite).
- Alinhado a [database/DATABASE.md](../../database/DATABASE.md): serviço `postgres`, healthcheck, volume nomeado, porta publicada só em desenvolvimento.
- Arquivos de referência para copiar: [templates/docker](../../templates/docker). O `docker-compose.yml` da raiz do repo é um exemplo funcional, cópia do template.

## Regras

- Um Dockerfile por serviço, imagem base `node:20-alpine`, `COPY package*.json` antes do código para aproveitar cache.
- Compose com **healthcheck** no banco e `depends_on` com `condition: service_healthy`.
- **Volume nomeado** para os dados do Postgres. Nunca bind mount no diretório de dados.
- Credenciais só em `.env` (fora do git). O repo traz `.env.example`, e o Compose falha com mensagem clara se faltar variável obrigatória.
- Portas configuráveis por variável (`POSTGRES_PORT`, `API_PORT`, `WEB_PORT`) com padrão 5432, 4000 e 3000.
- Serviços conversam pelo nome do serviço (`postgres`), nunca por `localhost`.
- Senhas do `.env.example` são só para uso local; nunca usar em produção.

## Operações proibidas sem confirmação explícita

Apagam os dados do banco local:

- `docker compose down -v` / `--volumes`
- `docker volume rm`, `docker volume prune`
- `docker system prune`, `docker image prune`

Antes de pedir confirmação, explique o que será perdido. Não pare nem remova containers de outros projetos.

## Checklist final do agente

- [ ] Um Dockerfile por serviço com cache de dependências
- [ ] Compose com healthcheck no `postgres` e `depends_on` por saúde
- [ ] Volume nomeado para os dados do banco
- [ ] `.env.example` presente, `.env` no `.gitignore`
- [ ] Portas por variável, com padrão
- [ ] `docker compose up -d --build` sobe tudo e `docker compose ps` mostra os serviços saudáveis
- [ ] Nenhuma operação destrutiva executada sem confirmação
