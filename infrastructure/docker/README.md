# Docker — Golden Path

Guia e skills para agentes containerizarem e rodarem o ambiente local com Docker Compose.

## Propósito

| Artefato | Papel |
|----------|--------|
| [DOCKER.md](DOCKER.md) | Políticas normativas (stack, regras, operações proibidas, checklist) |
| Skills em `skills/` | Procedimentos operacionais que aplicam essas políticas |
| [templates/docker](../../templates/docker) | Arquivos de referência para copiar (compose, `.env.example`, Dockerfiles) |

Fluxo esperado: ler `DOCKER.md` → executar a skill adequada → entregar Dockerfiles/compose no projeto consumidor.

## Skills

Formato [Agent Skills](https://github.com/agentskills/agentskills) (`name` + `description`). Cada skill exige a leitura prévia do [DOCKER.md](DOCKER.md).

| Skill | Caminho | Quando usar |
|-------|---------|-------------|
| **containerization** | [skills/containerization/SKILL.md](skills/containerization/SKILL.md) | Criar ou alterar Dockerfile, compose e `.env.example` |
| **local-environment** | [skills/local-environment/SKILL.md](skills/local-environment/SKILL.md) | Subir, parar, diagnosticar e reiniciar o ambiente local |

## Atalhos

- `/subir-ambiente` — sobe banco, API e tela
- `/parar-ambiente` — para tudo sem apagar dados

## Estrutura

```text
infrastructure/docker/
├── README.md
├── DOCKER.md
└── skills/
    ├── containerization/SKILL.md
    └── local-environment/SKILL.md
```
