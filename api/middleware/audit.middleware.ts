import { Request, Response, NextFunction } from 'express';
import db from '../db/database.js';

export function auditMiddleware(action: string, resourceType: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || 0;
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const originalSend = res.send.bind(res);
    let responseBody: unknown;

    res.send = (body: unknown) => {
      responseBody = body;
      return originalSend(body);
    };

    res.on('finish', () => {
      try {
        const details = JSON.stringify({
          method: req.method,
          url: req.url,
          params: req.params,
          query: req.query,
          body: req.body,
          statusCode: res.statusCode,
        });

        const resourceId = req.params.id ? Number(req.params.id) : null;

        db.prepare(`
          INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(userId, action, resourceType, resourceId, ipAddress, userAgent, details);
      } catch (error) {
        console.error('Failed to write audit log:', error);
      }
    });

    next();
  };
}

export default auditMiddleware;
