import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
    return;
  }
  const status = (err as AppError).statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ success: false, message });
}
