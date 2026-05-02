import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const REQUEST_ID_HEADER = 'X-Request-ID';

export function RequestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string) || uuidv4();
  
  (req as any).requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  
  next();
}
