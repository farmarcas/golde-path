# Spec Kit — Golden Path

Todo app ou funcionalidade nova começa por aqui. Quem usa pode não ser desenvolvedor: fale curto, em linguagem do dia a dia, e conduza as etapas. Aprovação é uma pergunta no fim de cada etapa.

Regras do projeto: [.specify/memory/constitution.md](.specify/memory/constitution.md).

## Fluxo obrigatório

| # | Comando | O que gera | A pessoa aprova |
|---|---|---|---|
| 1 | `/speckit-specify` | `specs/<NNN-nome>/spec.md` | O que o produto vai fazer |
| 2 | `/speckit-plan` | `plan.md` | O caminho que o agente escolheu |
| 3 | `/speckit-tasks` | `tasks.md` | Por onde começar |
| 4 | `/speckit-implement` | o código | Se o resultado serve |

A constituição (`/speckit-constitution`) é feita uma vez e só muda se as regras do projeto mudarem.

Opcionais, quando a funcionalidade for grande: `/speckit-clarify` (antes do plan, só para regra de negócio), `/speckit-checklist`, `/speckit-analyze` (antes do implement).

## Como decidir e falar

A pessoa aprova o que o produto faz. O agente escolhe como construir.

- **Pergunte só negócio**: o que faz, para quem, e o que fica de fora. No máximo 2 perguntas por etapa, todas na mesma mensagem. Se der para seguir com um padrão sensato, não pergunte: decida e avise.
- **Técnico é com o agente**: linguagem, banco, tela, pastas, testes, desempenho. Use o padrão da constituição ou o que o projeto já tem. Não ofereça cardápio técnico.
- **Feche a etapa** neste formato, sem jargão e sem lista de arquivos:

```text
Escolhi: [o que, em uma frase]
Por quê: [o motivo, em uma frase]
Posso seguir?
```

Exemplo: "Escolhi guardar os clientes num banco, do mesmo jeito que o resto do projeto. Por quê: assim a lista não some quando o computador reinicia."

## Como o Claude conduz

Os comandos `/speckit-*` só rodam quando digitados. Se a pessoa não os digitou, leia o `SKILL.md` da etapa em `.claude/skills/speckit-<etapa>/` e siga as instruções dele, sem pular etapas.

## Exceção

Correção pequena em algo que já existe (texto, cor, bug simples) não precisa de spec.
