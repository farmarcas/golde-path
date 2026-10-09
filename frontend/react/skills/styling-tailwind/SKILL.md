---
name: styling-tailwind
description: >-
  Define tokens, classes Tailwind e variantes visuais do frontend React.
  Use ao estilizar página, layout ou componente, ao escrever className, ou ao
  criar um primitivo de UI com cor, espaçamento, tipografia ou variante.
---

# Estilização com Tailwind

Esta skill cobre o visual. Estrutura, props, estado e acessibilidade ficam em `frontend/react/skills/component-development/SKILL.md`. Leia aquela skill antes desta quando a tarefa também cria ou altera o componente.

Padrão do repositório: Tailwind 4, configuração no CSS, tokens semânticos. Classes de cor e raio saem desses tokens.

## Quando aplicar

Leia esta skill antes de:

- escrever ou alterar `className`;
- definir cor, espaçamento, tipografia, raio, sombra ou breakpoint;
- criar ou ajustar um primitivo em `components/ui/` ou um layout em `components/layout/`;
- revisar `style` inline, CSS por componente ou `@apply` fora do CSS global.

## Passos obrigatórios

1. Confirme o tipo do componente na skill `component-development` (página, feature, UI ou layout).
2. Use um token semântico já definido. Token novo entra em `@theme` antes de aparecer no JSX.
3. Monte classes condicionais com `cn`.
4. Variante visual (`variant`, `size`) existe só no primitivo de UI, mapeada para classes no mesmo arquivo.
5. Estado interativo usa variante Tailwind (`hover:`, `focus-visible:`, `disabled:`, `aria-invalid:`).
6. Layout nasce no breakpoint menor e ganha `sm:`, `md:` e `lg:` quando a região muda.
7. Percorra o checklist antes de encerrar.

## Onde o estilo vive

```text
src/styles/globals.css    # @import "tailwindcss" e @theme
src/lib/cn.ts             # clsx + tailwind-merge
```

- Classes ficam no JSX do componente.
- Sem arquivo CSS por componente.
- Sem `style` para cor, espaçamento, tipografia ou layout.
- `@apply` só em `globals.css`, para base do documento (`body`). Componente não usa `@apply`.
- Dependências: `tailwindcss`, `clsx`, `tailwind-merge`.

`src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Tokens

Valores de cor e raio existem só em `src/styles/globals.css`. Componente usa o nome semântico, nunca a escala crua (`bg-white`, `text-gray-500`, `bg-blue-600`).

```css
@import "tailwindcss";

@theme {
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-primary: #171717;
  --color-primary-foreground: #fafafa;
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  --color-destructive: #dc2626;
  --color-destructive-foreground: #fafafa;
  --color-border: #e5e5e5;
  --color-ring: #171717;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

Nomes obrigatórios: `background`, `foreground`, `primary`, `primary-foreground`, `muted`, `muted-foreground`, `destructive`, `destructive-foreground`, `border`, `ring`, `radius-sm`, `radius-md`, `radius-lg`.

No JSX: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-destructive`, `border-border`, `ring-ring`, `rounded-md`.

Espaçamento, tamanho de texto e sombra usam a escala padrão do Tailwind (`gap-2`, `p-4`, `text-sm`). Valor arbitrário (`p-[13px]`, `text-[#112233]`) só entra se o token não existir e o valor for único daquele caso. Cor nova é token novo, não arbitrário.

Tema escuro, quando existir, redefine os mesmos tokens. O componente continua com `bg-background`.

## Primitivos visuais

O desenho recorrente mora em `components/ui/`. Feature e página consomem o primitivo; não copiam a string de classes.

| Papel | Componente | Dono das classes |
| --- | --- | --- |
| Ação | `Button` | `components/ui/Button.tsx` |
| Campo de texto | `TextField` | `components/ui/TextField.tsx` |
| Estado de domínio | `StatusBadge` | `components/ui/StatusBadge.tsx` |
| Casca da página | layout em `components/layout/` | o próprio layout |

Crie o primitivo na primeira tela que precisar do papel. A segunda tela importa o mesmo arquivo.

`className` no primitivo serve para ajuste de layout do pai (`w-full`, `mt-4`), passado por `cn` no fim. Recolorir o primitivo por `className` no caller indica variante que falta no mapa.

## Variantes

Mapa de classes no primitivo. `variant` e `size` são uniões de strings, com default.

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const buttonVariant = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  ghost: "hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
} as const;

type ButtonProps = {
  variant?: keyof typeof buttonVariant;
  className?: string;
  children: ReactNode;
};

export function Button({ variant = "primary", className, children }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        buttonVariant[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
```

Ordem dentro do `cn`: layout, espaçamento, tipografia, cor, borda, estado, variante, `className` do pai.

## Layout responsivo

- Classe sem prefixo vale para o viewport menor.
- `sm:`, `md:` e `lg:` só onde o arranjo muda.
- Região de página usa `flex` ou `grid` com `gap` da escala.
- Largura fixa só em peça que tem medida real (ícone, avatar, sidebar fechada). Conteúdo flui com `min-w-0` e `max-w-*`.

## Estado visual

- Foco com `focus-visible:ring-2` e `ring-ring`. Não remova o anel sem substituto.
- `disabled` no elemento e classes `disabled:pointer-events-none disabled:opacity-50`.
- Erro de campo com `aria-invalid:` no controle e `text-destructive` na mensagem.
- Cor acompanha texto ou ícone. O significado não fica só na cor.
- Carregando, vazio e erro, definidos na skill de componentes, usam os tokens `muted` e `destructive`. Não crie cor avulsa para esses estados.

## Checklist de conclusão

- [ ] Cores e raios vêm dos tokens de `@theme`.
- [ ] Não há `style` inline nem CSS de componente para layout ou cor.
- [ ] Classes condicionais passam por `cn`.
- [ ] `variant` e `size` estão no primitivo de UI, não na feature.
- [ ] Feature não reimplementa botão, campo, badge ou casca com classes copiadas.
- [ ] Foco visível, disabled e erro usam as variantes acima.
- [ ] Responsivo é mobile-first, sem largura fixa em conteúdo fluido.

## Limites desta skill

- Pasta, props, estado, hook e semântica HTML: `frontend/react/skills/component-development/SKILL.md`.
- Esta skill não escolhe biblioteca de componentes pronta. O primitivo do repositório é o dono do visual.
