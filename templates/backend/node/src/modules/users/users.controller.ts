import type { Request, Response } from 'express';
import { readValidated } from '../../shared/middlewares/validate.js';
import type { z } from 'zod';
import type {
  createUserRequestSchema,
  deleteUserRequestSchema,
  getUserRequestSchema,
  listUsersRequestSchema,
  updateUserRequestSchema,
} from './users.schemas.js';
import type { UsersService } from './users.service.js';

export const makeUsersController = (service: UsersService) => ({
  async list(_req: Request, res: Response) {
    const { query } = readValidated<z.infer<typeof listUsersRequestSchema>>(res);
    const result = await service.list(query.page, query.pageSize);
    res.json(result);
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof getUserRequestSchema>>(res);
    const user = await service.getById(params.id);
    res.json(user);
  },

  async create(_req: Request, res: Response) {
    const { body } = readValidated<z.infer<typeof createUserRequestSchema>>(res);
    const user = await service.create(body);
    res.status(201).json(user);
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateUserRequestSchema>>(res);
    const user = await service.update(params.id, body);
    res.json(user);
  },

  async remove(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof deleteUserRequestSchema>>(res);
    await service.remove(params.id);
    res.status(204).send();
  },
});
