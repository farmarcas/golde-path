---
name: node-unit-testing
description: Regras de teste unitário com Vitest para backend Node.js + TypeScript no golden path. Use ao criar ou alterar service, regra de negócio, helper puro, ou quando o usuário pedir teste unitário, TDD, spec ou cobertura de service.
---

# Testes unitários (Node.js)

Teste unitário cobre **regra de negócio isolada**. Sem banco, sem HTTP, sem Docker, sem arquivo real. Integração de rota (Supertest) fica fora desta skill.

Stack fixa: **Vitest**. Não trocar por Jest, Mocha ou node:test.

## O que testar

| Testar | Não testar aqui |
|--------|-----------------|
| `*.service.ts` | `*.repository.ts` (Prisma) |
| Função pura em `shared/` | `*.routes.ts` e `*.controller.ts` (só traduzem HTTP) |
| Mapeamento de erro de domínio | Schema Zod sozinho, se não houver regra |
| | Prisma, Express, Pino, `env.ts` |

Controller e repository não ganham teste unitário. Lógica que nascer neles desce para o service.

## Onde fica o arquivo

Ao lado do código, nome espelhado:

```
src/modules/users/users.service.ts
src/modules/users/users.service.test.ts
```

Um arquivo de teste por arquivo de produção. Vários `describe` se o service tiver mais de um método.

## TDD

Sem código de produção novo sem teste falhando antes.

1. Escrever o `it` mínimo do comportamento.
2. Rodar e confirmar falha pelo motivo certo (comportamento ausente, não erro de import ou typo).
3. Código mínimo no service até passar.
4. Próximo comportamento. Limpar só com a suíte verde.

## Estrutura de cada teste

Arrange-Act-Assert, um comportamento por `it`.

Nome: `` deve <resultado> quando <cenário> ``

```ts
import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { makeUsersService, type UsersRepository } from './users.service.js';

describe('makeUsersService.create', () => {
  it('deve lançar ConflictError quando e-mail já existe', async () => {
    const repo: Pick<UsersRepository, 'findByEmail' | 'create'> = {
      findByEmail: vi.fn().mockResolvedValue({ id: '1' }),
      create: vi.fn(),
    };
    const service = makeUsersService(repo);

    await expect(service.create({ name: 'Ana', email: 'a@a.com' })).rejects.toBeInstanceOf(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
```

- **Arrange**: mocks e SUT dentro do `it`. Sem estado compartilhado entre testes.
- **Act**: uma chamada.
- **Assert**: o resultado (retorno ou erro) e o efeito que importa (método do repo chamado ou não).

`beforeEach` só quando o arrange é idêntico e não acumula mock. Preferir arrange local.

## Mocks

Mockar só dependência externa do service: repository, cliente HTTP, relógio.

- Injetar pela factory (`makeUsersService(repo)`). Proibido `vi.mock` do módulo do Prisma para teste de service.
- Tipar o double com `Pick<Repo, 'metodo'>`. Sem `any`.
- `mockResolvedValue` / `mockRejectedValue` para async. Sem `.then`.
- Não assertar ordem de chamada, quantidade exata de `toHaveBeenCalledTimes`, nem argumento irrelevante. Assertar o que a regra exige (`not.toHaveBeenCalled`, `toHaveBeenCalledWith` do input que a regra monta).

## O que cada método de service cobre

Mínimo por método público:

- Caminho feliz: retorna o que a regra promete e chama o repo com o input certo.
- Cada erro de domínio (`NotFoundError`, `ConflictError`, …): tipo do erro e o efeito que **não** pode acontecer (ex.: `create` não roda).
- Borda que muda a regra: lista vazia, valor no limite, campo opcional ausente.

Não criar caso para o que o Zod já rejeita na borda HTTP. O service recebe input já validado.

Erro de domínio: `rejects.toBeInstanceOf(ConflictError)`. Se a mensagem faz parte do contrato, assertar `rejects.toThrow('E-mail já cadastrado')` também. Não assertar stack.

## Vitest

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

Imports explícitos de `vitest` (`describe`, `it`, `expect`, `vi`). Sem globals.

| Comando | Quando |
|---------|--------|
| `npx vitest run src/modules/users/users.service.test.ts` | um arquivo, durante o TDD |
| `npm test` | suíte inteira, antes de entregar |

`npm test` executa `vitest run` (uma vez, sem watch). Tarefa só termina com `npm test` verde.

## Proibido no teste unitário

- Banco, `PrismaClient`, docker-compose, `fetch`, servidor HTTP, `fs`, `.env` real.
- `setTimeout` para esperar. Async resolve com o mock.
- Snapshot.
- Teste que só espelha o código (`expect(true).toBe(true)`, assertar que a função existe).
- `console.log`.
- Comentar teste em vez de apagar ou corrigir.
- Depender de ordem entre `it`.

## Checklist

- [ ] Teste do service ao lado do arquivo, nome `deve … quando …`
- [ ] Arrange-Act-Assert, um comportamento por `it`
- [ ] Repository (ou cliente externo) injetado e tipado, sem Prisma real
- [ ] Feliz + cada erro de domínio + borda da regra
- [ ] `npm test` verde
