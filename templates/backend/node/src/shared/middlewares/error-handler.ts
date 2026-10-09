import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger.js';
import { toErrorResponse } from '../errors/to-error-response.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const mapped = toErrorResponse(error);
  const payload = { err: error, requestId: req.id };

  if (mapped.level === 'error') logger.error(payload, mapped.body.error.message);
  else logger.warn(payload, mapped.body.error.message);

  res.status(mapped.statusCode).json(mapped.body);
};
