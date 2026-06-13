import { Request, Response, NextFunction } from 'express';

export interface AuditEntry {
  method: string;
  path: string;
  userId: string | undefined;
  ip: string | undefined;
  timestamp: string;
  statusCode: number;
  duration: number;
}

export const auditLogs: AuditEntry[] = [];

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const entry: AuditEntry = {
      method: req.method,
      path: req.originalUrl,
      userId: req.userId,
      ip: req.ip || req.headers['x-forwarded-for'] as string | undefined,
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: Date.now() - start,
    };

    auditLogs.push(entry);

    if (auditLogs.length > 10000) {
      auditLogs.splice(0, auditLogs.length - 5000);
    }
  });

  next();
}
