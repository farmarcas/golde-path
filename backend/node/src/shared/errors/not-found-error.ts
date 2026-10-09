import { AppError } from './app-error.js';

export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}
