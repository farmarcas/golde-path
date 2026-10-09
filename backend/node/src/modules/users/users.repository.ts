import { prisma } from '../../shared/database/prisma.js';
import type { CreateUserInput, UpdateUserInput } from './users.schemas.js';
import type { UsersRepository } from './users.service.js';

const userSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

const active = { deletedAt: null } as const;

export const usersRepository: UsersRepository = {
  findByEmail(email) {
    return prisma.user.findFirst({ where: { email, ...active }, select: userSelect });
  },

  findById(id) {
    return prisma.user.findFirst({ where: { id, ...active }, select: userSelect });
  },

  async list(page, pageSize) {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: active,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: active }),
    ]);

    return { data, total };
  },

  create(input: CreateUserInput) {
    return prisma.user.create({ data: input, select: userSelect });
  },

  update(id: string, input: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data: input, select: userSelect });
  },

  // Exclusão lógica: DELETE físico só em job de retenção/anonimização (database/DATABASE.md).
  async delete(id) {
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
