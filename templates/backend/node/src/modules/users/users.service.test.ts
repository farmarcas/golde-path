import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { makeUsersService, type UserRecord, type UsersRepository } from './users.service.js';

const user = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: '1',
  name: 'Ana',
  email: 'a@a.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const makeRepo = (overrides: Partial<UsersRepository> = {}): UsersRepository => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  ...overrides,
});

describe('makeUsersService.create', () => {
  it('deve lançar ConflictError quando e-mail já existe', async () => {
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(user()),
      create: vi.fn(),
    });
    const service = makeUsersService(repo);

    await expect(service.create({ name: 'Ana', email: 'a@a.com' })).rejects.toBeInstanceOf(ConflictError);
    await expect(service.create({ name: 'Ana', email: 'a@a.com' })).rejects.toThrow('E-mail já cadastrado');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve criar usuário quando e-mail não existe', async () => {
    const created = user();
    const repo = makeRepo({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(created),
    });
    const service = makeUsersService(repo);

    await expect(service.create({ name: 'Ana', email: 'a@a.com' })).resolves.toEqual(created);
    expect(repo.create).toHaveBeenCalledWith({ name: 'Ana', email: 'a@a.com' });
  });
});

describe('makeUsersService.getById', () => {
  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = makeUsersService(repo);

    await expect(service.getById('1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deve retornar usuário quando id existe', async () => {
    const found = user();
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(found) });
    const service = makeUsersService(repo);

    await expect(service.getById('1')).resolves.toEqual(found);
  });
});

describe('makeUsersService.update', () => {
  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = makeUsersService(repo);

    await expect(service.update('1', { name: 'Ana' })).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('deve lançar ConflictError quando e-mail pertence a outro usuário', async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(user()),
      findByEmail: vi.fn().mockResolvedValue(user({ id: '2', email: 'b@b.com' })),
    });
    const service = makeUsersService(repo);

    await expect(service.update('1', { email: 'b@b.com' })).rejects.toBeInstanceOf(ConflictError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('deve atualizar usuário quando e-mail permanece o mesmo', async () => {
    const updated = user({ name: 'Ana Maria' });
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(user()),
      update: vi.fn().mockResolvedValue(updated),
    });
    const service = makeUsersService(repo);

    await expect(service.update('1', { name: 'Ana Maria' })).resolves.toEqual(updated);
    expect(repo.findByEmail).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('1', { name: 'Ana Maria' });
  });
});

describe('makeUsersService.remove', () => {
  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = makeUsersService(repo);

    await expect(service.remove('1')).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deve remover usuário quando id existe', async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(user()),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    const service = makeUsersService(repo);

    await expect(service.remove('1')).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith('1');
  });
});

describe('makeUsersService.list', () => {
  it('deve retornar lista vazia quando não há usuários', async () => {
    const repo = makeRepo({
      list: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    });
    const service = makeUsersService(repo);

    await expect(service.list(1, 20)).resolves.toEqual({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0 },
    });
  });
});
