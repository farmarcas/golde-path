---
name: schema-design
description: Designs PostgreSQL relational schemas following Golden Path rules—plural tables, context-based PK (bigint or UUIDv7), 3NF, soft delete, and LGPD. Use when modeling entities, creating tables, defining keys/indexes, or reviewing database schema design.
---

# Schema design (PostgreSQL)

## Pré-requisito

Antes de modelar, leia e aplique [DATABASE.md](../../../DATABASE.md). Este arquivo é o procedimento; as políticas estão no doc pai.

## Passos

1. Liste entidades, relacionamentos e atributos a partir do domínio.
2. Normalize para **3NF**. Desnormalize só com justificativa documentada.
3. Nomeie tabelas no **plural** e colunas em `snake_case`.
4. **Escolha a PK pelo contexto** (`bigint` identity ou `uuid` UUIDv7) usando a tabela de critérios do `DATABASE.md`. Documente a escolha. Use **um** padrão dominante no schema.
5. Defina FKs no **mesmo tipo** da PK referenciada; adicione índices de FK quando houver joins frequentes.
6. Em tabelas de domínio, inclua soft delete: `deleted_at timestamptz NULL` (e `deleted_by` se necessário).
7. Se houver PII, aplique minimização, classificação e retenção/anonimização conforme LGPD no `DATABASE.md`.
8. Crie uniques de negócio como índices parciais `WHERE deleted_at IS NULL`.
9. Use `timestamptz` para instantes e `created_at` / `updated_at` quando fizer sentido.

## Templates mínimos

### bigint

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

### uuid (UUIDv7)

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

UUIDv7 deve ser gerado na aplicação ou via função/extensão do projeto — não usar UUIDv4 como padrão de PK.

### FK alinhada

```sql
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users (id),
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_user_id_idx ON orders (user_id)
  WHERE deleted_at IS NULL;
```

(Ajuste o tipo de `id` / `user_id` se o schema usar `uuid`.)

## Checklist de aceite

- [ ] `DATABASE.md` lido e aplicado
- [ ] Tabelas no plural; `snake_case`
- [ ] PK escolhida pelo contexto e documentada; FKs do mesmo tipo
- [ ] 3NF (ou desnormalização justificada)
- [ ] `deleted_at` em tabelas de domínio; uniques parciais
- [ ] PII tratado (minimização / retenção) quando aplicável
- [ ] Tipos adequados (`timestamptz`, `numeric` para dinheiro, etc.)
