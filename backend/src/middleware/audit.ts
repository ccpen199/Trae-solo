import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import db from '../utils/database';

export function auditLog(action: string, tableName?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const oldJson = res.json;
    res.json = function(body: any) {
      const recordId = body?.id || req.params?.id;
      const newValues = ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : null;
      
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user?.id || null,
        action,
        tableName || null,
        recordId ? Number(recordId) : null,
        null,
        newValues,
        req.ip
      );
      
      return oldJson.call(this, body);
    };
    next();
  };
}
