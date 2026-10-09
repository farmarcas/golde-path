import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('x-request-id');
  const id = header && header.length > 0 ? header : randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};
