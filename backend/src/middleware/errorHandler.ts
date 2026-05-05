import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target?.join(', ') || 'record';
      res.status(400).json(error(`Unique constraint failed on: ${target}`, 400));
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json(error('Record not found', 404));
      return;
    }
    res.status(400).json(error(`Database error: ${prismaErr.code}`, 400));
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json(error(`Validation error: ${err.message}`, 400));
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json(error('Unauthorized', 401));
    return;
  }

  res.status(500).json(error('Internal server error', 500));
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  res.status(404).json(error('Route not found', 404));
}
