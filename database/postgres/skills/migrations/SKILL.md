---
name: migrations
description: Creates and applies versioned PostgreSQL migrations with expand/contract, soft-delete updates, and Docker Compose Postgres. Use when adding or changing schema, writing SQL migrations, evolving tables, or applying database migrations locally.
---

# Migrations (PostgreSQL)

## Pré-requisito

Antes de criar ou aplicar migrations, leia e aplique [DATABASE.md](../../../DATABASE.md). Respeite o tipo de PK já escolhido no schema (não mude o padrão sem migration explícita e justificada).

## Convenção de arquivos

- Pasta sugerida no projeto consumidor: `migrations/` (ou a pasta já usada pela ferramenta do projeto).
- Nome: `YYYYMMDDHHMMSS_descricao_curta.sql` (UTC, `snake_case` na descrição).
- Conteúdo: script **up** obrigatório. Inclua seção/comentário **down** apenas quando a reversão for segura e testável.
- Uma mudança lógica por arquivo (ex.: criar tabela; ou adicionar coluna + índice relacionado).

Exemplo de cabeçalho:

```sql
-- migrate:up
-- PK do schema: bigint (documentado na migration inicial)
CREATE TABLE products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX products_name_active_uidx
  ON products (name)
  WHERE deleted_at IS NULL;

-- migrate:down
-- DROP TABLE IF EXISTS products;
```

## Regras

1. **Não edite** migration já aplicada em ambientes compartilhados; crie uma nova.
2. Prefira **expand/contract**: adicionar colunas nullable → preencher → restringir; evitar rewrites destrutivos em um único passo.
3. Exclusão de domínio: `UPDATE ... SET deleted_at = now()`. Não use `DELETE` físico em tabelas de domínio (exceto jobs de retenção/anonimização).
4. Uniques de negócio com soft delete: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`.
5. Sem secrets, senhas ou dados reais de produção no SQL.
6. FKs e colunas novas devem seguir o tipo de PK já adotado (`bigint` ou `uuid`).
7. Migrations devem ser idempotentes quando a ferramenta do projeto exigir (`IF NOT EXISTS` com cuidado — não mascarar erros de design).

## Aplicar no Postgres do Compose

Com o serviço saudável (`docker compose ps` / healthcheck ok):

```bash
docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f - < migrations/YYYYMMDDHHMMSS_descricao.sql
```

Se o projeto usar ferramenta própria (Flyway, golang-migrate, Knex, Alembic, etc.), use-a e mantenha a mesma convenção de versionamento e as regras deste guia.

## Checklist de aceite

- [ ] `DATABASE.md` lido e aplicado
- [ ] Nome `YYYYMMDDHHMMSS_descricao.sql`
- [ ] Uma mudança lógica; up claro; down só se seguro
- [ ] Tipo de PK/FK consistente com o schema
- [ ] Soft delete via `UPDATE`; uniques parciais quando couber
- [ ] Sem secrets no SQL
- [ ] Testada contra Postgres do Compose (ou pipeline equivalente)
