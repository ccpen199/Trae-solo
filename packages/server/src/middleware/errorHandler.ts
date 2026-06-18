import { Request, Response, NextFunction } from 'express';
import { serverError } from '../utils/response';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`${req.method} ${req.path} - ${err.message}`, err.stack);
  serverError(res, err.message || '服务器内部错误');
};

export default errorHandler;
