import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import type { CreateUserInput, UpdateUserInput } from './users.schemas.js';

const USER_NOT_FOUND = 'Usuário não encontrado';
const EMAIL_ALREADY_EXISTS = 'E-mail já cadastrado';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UsersRepository = {
  findByEmail: (email: string) => Promise<UserRecord | null>;
  findById: (id: string) => Promise<UserRecord | null>;
  list: (page: number, pageSize: number) => Promise<{ data: UserRecord[]; total: number }>;
  create: (input: CreateUserInput) => Promise<UserRecord>;
  update: (id: string, input: UpdateUserInput) => Promise<UserRecord>;
  delete: (id: string) => Promise<void>;
};

export const makeUsersService = (repo: UsersRepository) => ({
  async list(page: number, pageSize: number) {
    const { data, total } = await repo.list(page, pageSize);
    return { data, meta: { page, pageSize, total } };
  },

  async getById(id: string) {
    const user = await repo.findById(id);
    if (!user) throw new NotFoundError(USER_NOT_FOUND, 'USER_NOT_FOUND');
    return user;
  },

  async create(input: CreateUserInput) {
    if (await repo.findByEmail(input.email)) {
      throw new ConflictError(EMAIL_ALREADY_EXISTS, 'EMAIL_ALREADY_EXISTS');
    }
    return repo.create(input);
  },

  async update(id: string, input: UpdateUserInput) {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError(USER_NOT_FOUND, 'USER_NOT_FOUND');

    if (input.email && input.email !== current.email) {
      const existing = await repo.findByEmail(input.email);
      if (existing) throw new ConflictError(EMAIL_ALREADY_EXISTS, 'EMAIL_ALREADY_EXISTS');
    }

    return repo.update(id, input);
  },

  async remove(id: string) {
    const current = await repo.findById(id);
    if (!current) throw new NotFoundError(USER_NOT_FOUND, 'USER_NOT_FOUND');
    await repo.delete(id);
  },
});

export type UsersService = ReturnType<typeof makeUsersService>;
