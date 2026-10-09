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

export const usersRepository: UsersRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email }, select: userSelect });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id }, select: userSelect });
  },

  async list(page, pageSize) {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return { data, total };
  },

  create(input: CreateUserInput) {
    return prisma.user.create({ data: input, select: userSelect });
  },

  update(id: string, input: UpdateUserInput) {
    return prisma.user.update({ where: { id }, data: input, select: userSelect });
  },

  async delete(id) {
    await prisma.user.delete({ where: { id } });
  },
};
