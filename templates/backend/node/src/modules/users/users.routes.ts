import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { makeUsersController } from './users.controller.js';
import { usersRepository } from './users.repository.js';
import {
  createUserRequestSchema,
  deleteUserRequestSchema,
  getUserRequestSchema,
  listUsersRequestSchema,
  updateUserRequestSchema,
} from './users.schemas.js';
import { makeUsersService, type UsersRepository } from './users.service.js';

export const usersRouter = (repo: UsersRepository = usersRepository) => {
  const controller = makeUsersController(makeUsersService(repo));
  const router = Router();

  router.get('/', validate(listUsersRequestSchema), controller.list);
  router.post('/', validate(createUserRequestSchema), controller.create);
  router.get('/:id', validate(getUserRequestSchema), controller.getById);
  router.patch('/:id', validate(updateUserRequestSchema), controller.update);
  router.delete('/:id', validate(deleteUserRequestSchema), controller.remove);

  return router;
};
