# Spec Kit — Golden Path

Todo app ou funcionalidade nova começa por aqui. Quem usa pode não ser desenvolvedor: explique em linguagem simples e conduza as etapas, pedindo aprovação ao fim de cada uma.

Regras do projeto: [.specify/memory/constitution.md](.specify/memory/constitution.md).

## Fluxo obrigatório

| # | Comando | O que gera | A pessoa aprova |
|---|---|---|---|
| 1 | `/speckit-specify` | `specs/<NNN-nome>/spec.md` | O que será construído |
| 2 | `/speckit-plan` | `plan.md` | Como será construído |
| 3 | `/speckit-tasks` | `tasks.md` | A lista de passos |
| 4 | `/speckit-implement` | o código | O resultado rodando |

A constituição (`/speckit-constitution`) é feita uma vez e só muda se as regras do projeto mudarem.

Opcionais, quando a funcionalidade for grande: `/speckit-clarify` (antes do plan), `/speckit-checklist`, `/speckit-analyze` (antes do implement).

## Como o Claude conduz

Os comandos `/speckit-*` só rodam quando digitados. Se a pessoa não os digitou, leia o `SKILL.md` da etapa em `.claude/skills/speckit-<etapa>/` e siga as instruções dele, sem pular etapas.

## Exceção

Correção pequena em algo que já existe (texto, cor, bug simples) não precisa de spec.
