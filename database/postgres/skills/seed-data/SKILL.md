---
name: seed-data
description: Discovers business context via structured questions and creates PostgreSQL seed SQL for local/dev demos—realistic Brazilian sample data, FK order, soft delete samples, UTF-8. Use when seeding the database, generating INSERT fixtures, demo data, or bootstrap rows after schema/migrations exist.
---

# Seed data (PostgreSQL)

## Pré-requisito

Antes de gerar seed, leia e aplique [DATABASE.md](../../../DATABASE.md).

Esta skill **não** substitui `schema-design` nem `migrations`. Exija schema já definido (e de preferência migrations aplicadas no Postgres local). Se o modelo ainda não existir, abra `schema-design` (e `migrations`) antes.

## Quando usar

- A pessoa pedir seed, dados de exemplo, fixtures, massa para demo/teste local.
- Após criar tabelas, para popular o banco e exercitar a aplicação.

**Não use** para dados de produção, dumps reais de clientes ou migração de legado.

## Passos

### 1. Confirmar schema

1. Localize migrations ou DDL do projeto consumidor (tabelas, PKs, FKs, uniques, `deleted_at`).
2. Anote o padrão de PK (`bigint` identity ou `uuid`) e a ordem de inserção exigida pelas FKs.
3. Se o schema estiver incompleto ou ambíguo, pare e resolva com `schema-design` / `migrations` antes de inventar colunas no seed.

### 2. Descoberta de negócio (perguntas)

Faça **uma rodada curta** de perguntas. Explique em linguagem simples. Não entreviste sem fim — se a pessoa não souber, proponha um padrão mínimo e confirme.

Pergunte (adapte ao domínio; pule o que já estiver claro no pedido ou no schema):

| # | Pergunta | Para decidir |
|---|----------|--------------|
| 1 | Qual o domínio em uma frase? (ex.: farmácia, pedidos, agenda) | Vocabulário e entidades centrais |
| 2 | Quais fluxos a demo precisa mostrar? (happy path + 1–2 bordas) | Quais linhas e estados criar |
| 3 | Quantos registros por tabela principal? (padrão: 3–10) | Volume do seed |
| 4 | Precisa de registro logicamente excluído (`deleted_at` preenchido)? | Cobertura de soft delete |
| 5 | Textos devem parecer brasileiros (nomes com acento, cidades, e-mails `.br`)? (padrão: **sim**) | Conteúdo UTF-8 / `pt_br` |
| 6 | Há papéis distintos? (admin, cliente, vendedor…) | Variedade de linhas |
| 7 | Algum valor fixo que a UI/API já espera? (slug, e-mail de login de dev, status) | Estabilidade da demo |

Se a pessoa não responder volume ou bordas, use: **5 ativos** na entidade principal, **1 soft-deleted** quando a tabela tiver `deleted_at`, e FKs coerentes para um único happy path.

### 3. Planejar o seed

1. Liste tabelas na **ordem de inserção** (pais antes de filhos).
2. Para cada tabela: quantas linhas, quais estados de negócio, quais FKs apontam para quê.
3. Defina chaves estáveis quando ajudar a reexecutar ou referenciar no app (e-mails únicos, slugs, UUIDs fixos documentados). Com `bigint` identity, prefira `INSERT ... RETURNING` só em scripts ad hoc; no arquivo versionado, use IDs explícitos **somente** se o projeto já adotar essa convenção — caso contrário, insira sem `id` e referencie por chave natural (`email`, `code`) via subselect.
4. Marque colunas PII: use **dados fictícios óbvios** (nunca CPF/e-mail/telefone reais de pessoas).

### 4. Escrever o arquivo

Convenção no projeto consumidor:

- Pasta: `seeds/` (ou a já usada pelo projeto).
- Nome: `YYYYMMDDHHMMSS_descricao_curta.sql` (UTC, `snake_case` na descrição), espelhando migrations.
- Encoding: **UTF-8 sem BOM** (acentos obrigatórios quando o domínio for BR).
- Cabeçalho com propósito, ambiente (`local`/`dev` apenas) e dependência de schema/migration.

Regras do SQL:

1. **Só DML** de seed (`INSERT` / `UPDATE` pontual). Sem `CREATE TABLE` — isso é migration.
2. Preferir **idempotência**: `ON CONFLICT DO NOTHING` (ou `DO UPDATE` só se o projeto documentar upsert de seed) alinhado aos uniques existentes (inclua a mesma predicado mental dos uniques parciais: não reative linha soft-deleted sem querer).
3. Respeitar `NOT NULL`, checks e FKs; ordem correta de inserts.
4. Timestamps: `created_at` / `updated_at` com `now()` ou instantes fixos se a demo precisar de ordenação previsível.
5. Soft delete: a maioria com `deleted_at IS NULL`; pelo menos um exemplo excluído se a tabela tiver a coluna e o cenário pedir.
6. Textos de pessoa/lugar: português do Brasil com acentuação (`José`, `São Paulo`, `Farmácia`).
7. **Proibido:** senhas reais, tokens, connection strings, dumps de produção, PII de pessoas reais.
8. Senha de usuário de demo, se o schema tiver hash: use hash **documentado como fake** no comentário do seed, ou deixe a coluna de autenticação fora do escopo (auth ainda é lacuna do Golden Path — não invente fluxo de login completo).

### 5. Aplicar no Postgres do Compose

Com o serviço saudável e migrations já aplicadas:

```bash
docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f - < seeds/YYYYMMDDHHMMSS_descricao.sql
```

Se o projeto tiver comando próprio (`npm run seed`, Make, etc.), use-o e mantenha o SQL versionado sob as regras desta skill.

Após aplicar: confira contagens simples (`SELECT count(*) FROM ...`) ou um `SELECT` do happy path. Relate à pessoa o que foi carregado em linguagem simples.

### 6. Entregar

- Arquivo(s) em `seeds/`.
- Resumo: entidades populadas, volume, como reaplicar, restrição a ambiente local/dev.
- Se algo ficou de fora por falta de schema ou lacuna (ex.: auth), diga explicitamente.

## Template mínimo

```sql
-- seed: local/dev only — dados fictícios
-- depende do schema com tabela customers (PK bigint, soft delete)
-- encoding: UTF-8

BEGIN;

INSERT INTO customers (name, email, city, deleted_at, created_at, updated_at)
VALUES
  ('Ana Oliveira', 'ana.oliveira@example.com.br', 'São Paulo', NULL, now(), now()),
  ('José da Silva', 'jose.silva@example.com.br', 'Belo Horizonte', NULL, now(), now()),
  ('Comércio Antigo Ltda', 'legado@example.com.br', 'Curitiba', now(), now(), now())
ON CONFLICT DO NOTHING;

-- Se não houver unique que permita ON CONFLICT, documente e use
-- WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.email = ...).

COMMIT;
```

Ajuste `ON CONFLICT` à constraint/unique real (`ON CONFLICT (email) DO NOTHING` ou índice parcial — nesses casos `WHERE NOT EXISTS` costuma ser mais claro).

### Referência por chave natural (bigint sem id fixo)

```sql
INSERT INTO orders (customer_id, status, deleted_at, created_at, updated_at)
SELECT c.id, 'pending', NULL, now(), now()
FROM customers c
WHERE c.email = 'ana.oliveira@example.com.br'
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.id AND o.status = 'pending' AND o.deleted_at IS NULL
  );
```

## Checklist de aceite

- [ ] `DATABASE.md` lido e aplicado
- [ ] Schema/migrations existentes; seed não cria DDL
- [ ] Descoberta feita (ou padrões mínimos confirmados com a pessoa)
- [ ] Arquivo em `seeds/` com nome `YYYYMMDDHHMMSS_descricao.sql`, UTF-8
- [ ] Ordem de INSERT respeita FKs; tipos de PK/FK corretos
- [ ] Idempotência razoável (`ON CONFLICT` ou `NOT EXISTS`)
- [ ] Dados fictícios; sem secrets nem PII real
- [ ] Textos BR com acento quando o domínio for brasileiro
- [ ] Soft delete coberto quando fizer sentido
- [ ] Aplicado no Postgres local (ou instrução clara se o ambiente não estava no ar)
- [ ] Resumo entregue à pessoa em linguagem simples
