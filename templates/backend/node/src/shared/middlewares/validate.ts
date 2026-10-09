import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

declare global {
  namespace Express {
    interface Locals {
      validated?: unknown;
    }
  }
}

export const validate = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!parsed.success) {
    next(parsed.error);
    return;
  }

  res.locals.validated = parsed.data;
  next();
};

export const readValidated = <T>(res: Response): T => res.locals.validated as T;
