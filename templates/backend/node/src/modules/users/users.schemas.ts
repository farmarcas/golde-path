import { z } from 'zod';

const MAX_PAGE_SIZE = 100;

const emptyObject = z.object({}).strict();

export const createUserSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: 'Informe ao menos um campo',
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userIdSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
  })
  .strict();

export const listUsersRequestSchema = z.object({
  body: emptyObject.default({}),
  params: emptyObject.default({}),
  query: paginationSchema,
});

export const createUserRequestSchema = z.object({
  body: createUserSchema,
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const getUserRequestSchema = z.object({
  body: emptyObject.default({}),
  params: userIdSchema,
  query: emptyObject.default({}),
});

export const updateUserRequestSchema = z.object({
  body: updateUserSchema,
  params: userIdSchema,
  query: emptyObject.default({}),
});

export const deleteUserRequestSchema = getUserRequestSchema;
