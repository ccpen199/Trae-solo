import type { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import type { AuthRequest } from './auth';

export function auditLog(action: string, resourceType: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const originalSend = res.json.bind(res);
    
    res.json = ((body: unknown) => {
      try {
        const db = getDatabase();
        const resourceId = req.params.id ? parseInt(req.params.id) : undefined;
        const details = JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          query: req.query,
          responseStatus: res.statusCode,
        });
        
        const ip = (req.headers['x-forwarded-for'] as string) || 
                   req.socket.remoteAddress || 
                   '127.0.0.1';

        db.prepare(`
          INSERT INTO operation_logs (user_id, action, resource_type, resource_id, details, ip_address)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          req.userId,
          action,
          resourceType,
          resourceId,
          details,
          ip
        );
      } catch (err) {
        console.error('Audit log error:', err);
      }
      
      return originalSend(body);
    }) as typeof res.json;
    
    next();
  };
}
