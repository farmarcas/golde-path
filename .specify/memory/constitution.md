# Golden Path Constitution

## Core Principles

### I. Spec Kit é obrigatório (NÃO NEGOCIÁVEL)
Toda aplicação nova e toda funcionalidade nova passa pelo fluxo do Spec Kit, na
ordem: constituição → `specify` → `plan` → `tasks` → `implement`. Não se escreve
código de funcionalidade sem `spec.md`, `plan.md` e `tasks.md` aprovados pela
pessoa. Cada etapa termina com a pessoa aprovando antes de seguir.

### II. Tudo roda no Docker
O ambiente local sobe com `docker compose up -d --build`. Nenhuma funcionalidade
pode exigir instalar Node, Postgres ou outra ferramenta direto na máquina.
Portas e credenciais vêm do `.env` (nunca versionado); o `.env.example` traz
valores só para uso local.

### III. Stack padrão
PostgreSQL 16 (serviço `postgres`), API em Node 20 e front em React + Vite com
Tailwind. Trocar ou acrescentar tecnologia exige justificativa escrita no
`plan.md` da funcionalidade. Os serviços conversam pelo nome do serviço,
nunca por `localhost`.

### IV. Banco só muda por migration
Toda alteração de estrutura do banco é uma migration versionada, seguindo
`database/DATABASE.md`. Nunca alterar tabelas manualmente nem editar migration
já aplicada.

### V. Dados locais são protegidos (NÃO NEGOCIÁVEL)
Nunca rodar `docker compose down -v`, `docker volume rm`, `docker volume prune`
ou `docker system prune` sem confirmação explícita da pessoa, explicando antes
o que será perdido. Nunca parar ou remover containers de outros projetos.

### VI. Linguagem simples e execução pelo agente
Quem usa pode não ser desenvolvedor. Explicar sem jargão, em poucas frases, e
executar os comandos em vez de pedir que a pessoa os rode. Em conflito de porta,
mudar a porta no `.env` em vez de parar o outro programa.

### VII. Começar pequeno
Entregar o menor pedaço que funciona (MVP) e só então expandir. Cada
funcionalidade deve poder ser verificada de ponta a ponta com o ambiente de pé
(`docker compose ps` saudável e URL acessível).

### VIII. O agente decide o técnico (NÃO NEGOCIÁVEL)
A pessoa decide o que o produto faz, para quem e o que fica de fora. O agente
decide stack, biblioteca, estrutura, banco, teste e desempenho: padrão desta
constituição ou o que o projeto já usa. Não oferece cardápio técnico.

Perguntas: só de negócio, no máximo 2 por etapa, todas de uma vez. Se houver
padrão sensato, o agente decide e avisa. Cada escolha técnica relevante fecha
com duas linhas — o que foi escolhido e por quê — em linguagem do dia a dia.
Guia curto: `SPECKIT.md`.

## Restrições Adicionais
- Segredos nunca entram no git: nada de senhas reais, chaves ou tokens no repositório.
- Seguir as skills de cada área (`infrastructure/docker`, `database`, `frontend`,
  `backend`) antes de alterar essa área.

## Fluxo de Desenvolvimento
- Aplicação ou funcionalidade nova: `/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`, com aprovação a cada etapa.
- Exceção única: correções pequenas em algo que já existe (texto, cor, bug
  simples) podem ser feitas direto, sem spec.
- Ao concluir, confirmar que o ambiente sobe e informar a URL de acesso.

## Governance
Esta constituição prevalece sobre outras práticas do projeto. Mudanças exigem
atualizar este arquivo e a versão abaixo. Todo `plan.md` deve verificar
conformidade com estes princípios. Guia de uso diário: `CLAUDE.md` e `SPECKIT.md`.

**Version**: 1.1.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-09
