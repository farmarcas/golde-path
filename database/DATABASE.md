# DATABASE.md — Golden Path de banco de dados

Instruções normativas para agentes construírem e evoluirem bancos de dados relacionais neste ecossistema.

## Quando aplicar

Leia e aplique este documento ao:

- criar ou alterar banco, schema, migrations, seeds ou compose de dados;
- modelar entidades com dados pessoais;
- definir exclusão, retenção ou anonimização;
- garantir suporte a texto em português (acentos, cedilha e ordenação);
- popular o banco local/dev com dados de exemplo alinhados ao negócio.

Skills de procedimento (ler depois deste arquivo):

- [schema-design](postgres/skills/schema-design/SKILL.md)
- [migrations](postgres/skills/migrations/SKILL.md)
- [seed-data](postgres/skills/seed-data/SKILL.md)

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
      # UTF8 obrigatório para nomes/endereços com acento (José, São Paulo, etc.)
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C.UTF-8"
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

`POSTGRES_INITDB_ARGS` só vale na **primeira** criação do volume. Cluster já existente sem UTF8 exige recriar o volume (com confirmação explícita — apaga dados locais) ou migrar dados.

### Exemplo de `.env.example`

```env
POSTGRES_USER=app
POSTGRES_PASSWORD=change_me
POSTGRES_DB=app
POSTGRES_PORT=5432
```

## Encoding e texto em português (Brasil)

Dados brasileiros incluem acentos e cedilha (`á`, `ã`, `ç`, `é`, `ó`, `ü`, etc.). O banco deve gravar, ler e ordenar esse texto sem perda ou substituição.

### Regras

- Encoding do banco: **UTF8** (obrigatório). Proibido `SQL_ASCII` ou Latin1 como encoding do cluster.
- Conferir após subir: `SHOW server_encoding;` e `SHOW client_encoding;` devem retornar `UTF8`.
- Migrations, seeds e dumps versionados: arquivos em **UTF-8** (sem BOM).
- Conexão da aplicação: UTF-8 (padrão nos drivers atuais). Não forçar `WIN1252`, `LATIN1` ou equivalente na connection string.
- Colunas de nome, endereço, cidade e texto livre: tipo `text` (ou `varchar` com limite de negócio) — não `bytea`.
- Ordenação/comparação sensível a português (listagens de nomes, cidades): collation **ICU** `pt-BR` (disponível na imagem oficial sem depender de locale `pt_BR` do SO — adequado ao `postgres:16-alpine`).
- Busca “ignorar acento” (José ≈ Jose) **não** é comportamento padrão. Só adotar com requisito explícito e estratégia documentada (`unaccent`, coluna normalizada ou índice dedicado).

### Collation ICU para português

Criar uma vez (migration inicial ou bootstrap) e reutilizar em colunas de texto amigável a humanos:

```sql
CREATE COLLATION IF NOT EXISTS pt_br (
  provider = icu,
  locale = 'pt-BR',
  deterministic = true
);

CREATE TABLE customers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL COLLATE pt_br,
  city text NULL COLLATE pt_br,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Alternativa inline, sem collation nomeada: `name text NOT NULL COLLATE "pt-BR-x-icu"`.

E-mails, códigos e identificadores técnicos podem permanecer na collation padrão do banco (`C` / `C.UTF-8`); acento importa sobretudo em campos apresentados a pessoas.

## Boas práticas de construção

- Naming: `snake_case` em tabelas, colunas, índices e constraints.
- Tabelas no **plural** (`users`, `orders`, `order_items`).
- Constraints explícitas: `NOT NULL`, `CHECK`, `UNIQUE`, FKs nomeadas.
- Tipos: `timestamptz` para instantes; `numeric` para valores monetários/decimais precisos; `text` em vez de `varchar(n)` sem limite de negócio.
- Texto com acento: UTF8 + collation `pt_br` / `"pt-BR-x-icu"` onde a ordenação em português importar (ver seção acima).
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

## Seeds (dados de exemplo)

Seeds populam o banco **local/dev** para demo e teste manual. Não substituem migration nem vão para produção.

### Regras

- Somente depois do schema existir (via `schema-design` + `migrations`).
- Pasta versionada `seeds/`; arquivos SQL em **UTF-8** (sem BOM), nome `YYYYMMDDHHMMSS_descricao.sql`.
- Só DML (`INSERT` / `UPDATE` pontual). Sem DDL no seed.
- Dados **fictícios**; proibido PII real, dumps de produção, senhas ou tokens verdadeiros.
- Preferir idempotência (`ON CONFLICT` ou `NOT EXISTS`) alinhada aos uniques do schema.
- Domínio brasileiro: nomes/cidades com acentuação; respeitar collation/encoding deste guia.
- Procedimento (perguntas de negócio, ordem de FK, aplicação no Compose): skill [seed-data](postgres/skills/seed-data/SKILL.md).

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
- Init com UTF8 (`POSTGRES_INITDB_ARGS` ou equivalente documentado).
- `.env.example` com variáveis Postgres (sem segredos reais).
- Pasta de migrations versionadas (arquivos UTF-8).
- Pasta `seeds/` quando houver dados de exemplo (UTF-8, só local/dev, sem PII real).
- Collation `pt_br` (ou `"pt-BR-x-icu"`) em colunas de texto apresentadas a usuários, quando houver listagem/ordenação.
- Decisão de PK documentada.
- Instruções mínimas de como subir o banco (`docker compose up -d postgres`).

## Checklist final do agente

- [ ] PostgreSQL em Docker Compose com healthcheck e volume
- [ ] Credenciais só via env / secrets; `.env.example` presente
- [ ] Encoding UTF8 no banco; `POSTGRES_INITDB_ARGS` (ou equivalente) na primeira init
- [ ] Migrations/seeds em UTF-8; texto com acento gravável sem perda
- [ ] Collation ICU `pt_br` / `"pt-BR-x-icu"` em colunas de nome/endereço quando a ordenação importar
- [ ] Tabelas no plural, `snake_case`, tipos adequados
- [ ] PK escolhida pelo contexto e documentada; FKs alinhadas
- [ ] Schema em 3NF (ou desnormalização justificada)
- [ ] Soft delete (`deleted_at`) e uniques parciais onde couber
- [ ] LGPD considerada para PII (minimização, retenção, anonimização)
- [ ] Mudanças via migrations; skill `schema-design` / `migrations` aplicadas
- [ ] Seeds (se pedidos): skill `seed-data`; fictícios; idempotentes; só local/dev
