# DATABASE.md — Golden Path de banco de dados

Instruções normativas para agentes construírem e evoluirem bancos de dados relacionais neste ecossistema.

## Quando aplicar

Leia e aplique este documento ao:

- criar ou alterar banco, schema, migrations ou compose de dados;
- modelar entidades com dados pessoais;
- definir exclusão, retenção ou anonimização.

Skills de procedimento (ler depois deste arquivo):

- [schema-design](postgres/skills/schema-design/SKILL.md)
- [migrations](postgres/skills/migrations/SKILL.md)

## Stack obrigatória

- Banco relacional: **sempre PostgreSQL**.
- Imagem de referência local: `postgres:16-alpine`.
- Ambiente local: **Docker Compose** (serviço `postgres`).
- Bancos não relacionais só quando o requisito for explicitamente não relacional (fora do escopo deste guia).

## Banco em Docker

### Regras

- Subir Postgres via Compose com **healthcheck**, **volume nomeado** e porta publicada apenas em desenvolvimento.
- Credenciais em `.env` / secrets; **nunca** commit de senhas.
- Versionar schema por **migrations** (preferível a scripts ad hoc). Init via `docker-entrypoint-initdb.d` só para bootstrap mínimo, se necessário.
- Runtime Docker alinhado a `infrastructure/docker` e `templates/docker` quando existirem artefatos no projeto consumidor.

### Exemplo mínimo de Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

### Exemplo de `.env.example`

```env
POSTGRES_USER=app
POSTGRES_PASSWORD=change_me
POSTGRES_DB=app
POSTGRES_PORT=5432
```

## Boas práticas de construção

- Naming: `snake_case` em tabelas, colunas, índices e constraints.
- Tabelas no **plural** (`users`, `orders`, `order_items`).
- Constraints explícitas: `NOT NULL`, `CHECK`, `UNIQUE`, FKs nomeadas.
- Tipos: `timestamptz` para instantes; `numeric` para valores monetários/decimais precisos; `text` em vez de `varchar(n)` sem limite de negócio.
- Índices alinhados a filtros e joins reais; unique parcial com soft delete (ver abaixo).
- Roles mínimos: app (DML limitado), migration (DDL), admin (ops). Sem superuser na aplicação.
- Alterações de schema só via migrations versionadas; sem DDL manual em produção.

### Chave primária (decisão por contexto)

Escolha **um** padrão dominante por schema e **documente** a decisão (README do banco ou comentário na migration inicial). FKs devem usar o **mesmo tipo** da PK referenciada. Evite misturar `bigint` e `uuid` sem justificativa.

| Usar `bigint` identity | Usar UUIDv7 (`uuid`) |
|------------------------|----------------------|
| App monolítico / IDs gerados só no banco | IDs gerados no app ou em vários serviços |
| Prioridade a tamanho, índice e joins | ID em API pública sem enumeração sequencial |
| Operação interna, sem sync offline | Offline-first, merge entre ambientes, microsserviços |

#### Exemplo com `bigint`

```sql
CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_active_uidx
  ON users (email)
  WHERE deleted_at IS NULL;
```

#### Exemplo com `uuid` (UUIDv7)

Gerar UUIDv7 na aplicação ou via função/extensão adotada pelo projeto. Não usar UUIDv4 como padrão de PK (pior localidade de índice).

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_active_uidx
  ON users (email)
  WHERE deleted_at IS NULL;
```

## Normalização

- Alvo padrão: **3NF**.
- 1NF: valores atômicos; sem listas/JSON como substituto de entidade sem justificativa.
- 2NF: sem dependência parcial de chave composta.
- 3NF: sem dependência transitiva (atributos de outra entidade em tabela alheia).
- Desnormalização só com justificativa documentada de leitura/performance (e plano de consistência).

### Exemplo

Evitar:

```text
orders (id, customer_name, customer_email, customer_city, ...)
```

Preferir:

```text
customers (id, name, email, ...)
addresses (id, customer_id, city, ...)
orders (id, customer_id, ...)
```

## Conformidade com LGPD

No que o schema e a operação do banco controlam:

- **Minimização:** coletar e persistir só o necessário à finalidade.
- **Classificação:** identificar colunas com dados pessoais e sensíveis.
- **Base legal / consentimento:** modelar campos quando o domínio exigir (ex.: `consent_granted_at`, finalidade).
- **Retenção:** definir prazo ou critério; prever purge/anonimização (`retained_until` ou job documentado).
- **Direito ao esquecimento:** soft delete **não** basta sozinho — prever anonimização ou hard delete após retenção legal.
- **Segurança:** segredos fora do repositório; TLS em ambientes não-dev; roles mínimos; auditar acesso a PII quando o risco exigir.
- Antes de merge de schema com PII, validar o checklist LGPD abaixo.

### Checklist LGPD (schema)

- [ ] Dados pessoais/sensíveis identificados
- [ ] Campos desnecessários removidos (minimização)
- [ ] Retenção / anonimização previstas quando aplicável
- [ ] Soft delete não confundido com atendimento de exclusão definitiva
- [ ] Segredos e credenciais fora do código versionado

## Exclusão lógica

Padrão para tabelas de domínio:

- Colunas: `deleted_at timestamptz NULL`; opcionalmente `deleted_by` (mesmo tipo da PK de `users`/ator).
- Leituras padrão: `WHERE deleted_at IS NULL`.
- Uniques de negócio: índice único **parcial** `WHERE deleted_at IS NULL`.
- Exclusão de domínio: `UPDATE ... SET deleted_at = now()` — não `DELETE` físico.
- `DELETE` físico apenas em jobs de retenção/anonimização ou tabelas técnicas sem soft delete.
- FKs: decidir e documentar se registros logicamente excluídos permanecem referenciáveis; evitar `ON DELETE CASCADE` físico que ignore soft delete.

## Artefatos esperados no projeto consumidor

- Serviço `postgres` no Compose (ou compose dedicado) com healthcheck e volume.
- `.env.example` com variáveis Postgres (sem segredos reais).
- Pasta de migrations versionadas.
- Decisão de PK documentada.
- Instruções mínimas de como subir o banco (`docker compose up -d postgres`).

## Checklist final do agente

- [ ] PostgreSQL em Docker Compose com healthcheck e volume
- [ ] Credenciais só via env / secrets; `.env.example` presente
- [ ] Tabelas no plural, `snake_case`, tipos adequados
- [ ] PK escolhida pelo contexto e documentada; FKs alinhadas
- [ ] Schema em 3NF (ou desnormalização justificada)
- [ ] Soft delete (`deleted_at`) e uniques parciais onde couber
- [ ] LGPD considerada para PII (minimização, retenção, anonimização)
- [ ] Mudanças via migrations; skill `schema-design` / `migrations` aplicadas
