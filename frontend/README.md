# Frontend

A pasta `frontend/react/skills/` é o norte dos agentes que constroem a interface. Antes de criar ou alterar código React, leia a skill correspondente e siga os passos na ordem. O código nasce dessas regras: estrutura de pastas, responsabilidade de cada arquivo e checklist de conclusão.

## Skills

| Skill | Caminho | Uso |
| --- | --- | --- |
| Desenvolvimento de componentes | `frontend/react/skills/component-development/SKILL.md` | Estrutura, componentes, estado, hooks e acessibilidade |
| Estilização com Tailwind | `frontend/react/skills/styling-tailwind/SKILL.md` | Tokens, classes, variantes e primitivos visuais |

Qual skill abrir em cada contexto está em `frontend/FRONTEND.MD`.

## `component-development`

Arquivo: `frontend/react/skills/component-development/SKILL.md`.

A skill ensina o agente a montar um frontend React estruturado. Ela vale ao criar página, feature, componente ou hook, ao extrair JSX e ao revisar UI que mistura busca de dados, regra de negócio e markup.

O arquivo contém:

1. **Quando aplicar** — situações em que a skill é obrigatória antes de escrever código.
2. **Passos obrigatórios** — nomear a responsabilidade, classificar o artefato, escolher a pasta, tipar o contrato, implementar, aplicar o visual com `styling-tailwind`, cobrir carregamento/vazio/erro, garantir acessibilidade e fechar o checklist.
3. **Estrutura de pastas** — árvore `src/app`, `src/components/ui`, `src/components/layout`, `src/features/<feature>`, `src/hooks`, `src/lib` e `src/types`, com a regra de quando o arquivo sobe de nível.
4. **Tipos de componente** — página, feature, UI e layout: o que cada um pode fazer e o que fica fora dele. Features só se importam pela API pública.
5. **Contrato do componente** — um componente por arquivo, `export function`, props em `{Nome}Props`, callbacks `on*`, handlers `handle*`, booleanos `is`/`has`/`can`, sem `any` e sem default export.
6. **Estado e efeitos** — dono do estado (componente, hook da feature ou contexto), dado de servidor sem cópia em `useState`, limite de prop drilling, quando `useEffect` é permitido e quando criar hook.
7. **Composição** — `children` em vez de flags de layout, item de lista extraído, `key` estável, formulário com validação no hook da feature.
8. **Acessibilidade e semântica** — botão, link, label, texto alternativo, headings, foco e diálogo.
9. **Estados de interface** — carregando, vazio, erro e sucesso na feature; `ErrorBoundary` na página ou na raiz da feature.
10. **Design com Tailwind** — aponta para `styling-tailwind`: classes nos primitivos `Button`, `TextField`, `StatusBadge` e no layout; feature importa o primitivo.
11. **Nomeação** — PascalCase, camelCase e kebab-case para componente, hook, arquivo e pasta.
12. **Checklist de conclusão** — lista que o agente percorre antes de encerrar a tarefa.
13. **Limites** — o visual fica em `styling-tailwind`. Biblioteca de fetch, formulário e roteador ficam de fora; o limite é página fina, hook da feature dono dos dados, UI sem endpoint.

## `styling-tailwind`

Arquivo: `frontend/react/skills/styling-tailwind/SKILL.md`.

Cobre o visual Tailwind do frontend. Vale ao escrever `className`, ao definir cor, espaçamento, tipografia ou variante, e ao criar primitivo em `components/ui/` ou layout.

O arquivo contém:

1. **Quando aplicar** — mudanças de classe, token, primitivo visual ou CSS solto.
2. **Passos obrigatórios** — confirmar o tipo do componente, usar token, compor com `cn`, manter variante no primitivo, tratar estado visual e responsivo.
3. **Onde o estilo vive** — `src/styles/globals.css`, `src/lib/cn.ts`, classes no JSX. Sem CSS por componente.
4. **Tokens** — nomes semânticos no `@theme` e a escala padrão do Tailwind para espaço e texto.
5. **Primitivos visuais** — `Button`, `TextField`, `StatusBadge` e layout como donos das classes.
6. **Variantes, layout responsivo e estado visual** — mapa `variant`/`size`, mobile-first, foco, disabled e erro.
7. **Checklist e limites** — o que fechar antes de encerrar e o que permanece em `component-development`.

## Quando usar cada skill

`frontend/FRONTEND.MD` é a entrada. As skills se complementam.

- Estrutura, estado, props e acessibilidade: `component-development`.
- Visual Tailwind: `styling-tailwind`.
- Tela ou componente novo: as duas, nesta ordem.
