# Database — Golden Path

Guia e skills para agentes construírem bancos relacionais com PostgreSQL em Docker, seguindo políticas compartilhadas do ecossistema.

## Propósito

Esta pasta define **o que** e **como** um agente deve fazer ao criar ou evoluir banco de dados:

| Artefato | Papel |
|----------|--------|
| [DATABASE.md](DATABASE.md) | Políticas normativas (stack, Docker, naming, PK, normalização, LGPD, exclusão lógica) |
| Skills em `postgres/skills/` | Procedimentos operacionais que aplicam essas políticas |

Fluxo esperado: ler `DATABASE.md` → executar a skill adequada → entregar schema/migrations/compose no projeto consumidor.

## DATABASE.md

Documento-pai obrigatório. Use ao criar ou alterar banco, schema, migrations, compose de dados, modelagem com PII ou regras de exclusão/retenção.

Cobre, entre outros:

- PostgreSQL como padrão relacional e Compose local
- Tabelas no plural, boas práticas de schema
- Escolha de PK pelo contexto (`bigint` ou UUIDv7)
- Normalização (3NF), LGPD e exclusão lógica (`deleted_at`)

## Skills

Formato [Agent Skills](https://github.com/agentskills/agentskills) (`name` + `description`), compatível com Claude e Cursor. Cada skill exige a leitura prévia do [DATABASE.md](DATABASE.md).

| Skill | Caminho | Quando usar |
|-------|---------|-------------|
| **schema-design** | [postgres/skills/schema-design/SKILL.md](postgres/skills/schema-design/SKILL.md) | Modelar entidades, tabelas, chaves, índices e revisar schema |
| **migrations** | [postgres/skills/migrations/SKILL.md](postgres/skills/migrations/SKILL.md) | Criar/aplicar migrations SQL versionadas e evoluir o schema |

## Estrutura

```text
database/
├── README.md                 ← este arquivo
├── DATABASE.md               ← políticas
└── postgres/
    └── skills/
        ├── schema-design/
        │   └── SKILL.md
        └── migrations/
            └── SKILL.md
```
