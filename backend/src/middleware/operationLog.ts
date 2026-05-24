import { AuthRequest } from './auth';
import { Response, NextFunction } from 'express';
import db from '../db';

export function logOperation(
  operationType: string,
  entityType?: string,
  getEntityId?: (req: AuthRequest) => number | undefined,
  getOldValue?: (req: AuthRequest) => string,
  getNewValue?: (req: AuthRequest) => string
) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json.bind(res);
    
    res.json = function(this: Response, body: any) {
      const status = res.statusCode < 400 ? 'success' : 'error';
      const entityId = getEntityId ? getEntityId(req) : (body?.data?.id || body?.id);
      const oldValue = getOldValue ? getOldValue(req) : undefined;
      const newValue = getNewValue ? getNewValue(req) : JSON.stringify(body);
      
      try {
        const stmt = db.prepare(`
          INSERT INTO operation_logs 
          (user_id, operation_type, entity_type, entity_id, action, old_value, new_value, 
           ip_address, user_agent, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          req.user?.id || null,
          operationType,
          entityType || null,
          entityId || null,
          `${req.method} ${req.path}`,
          oldValue || null,
          newValue || null,
          req.ip,
          req.headers['user-agent'] || null,
          status,
          status === 'error' ? (body?.error || body?.message) : null
        );
      } catch (err) {
        console.error('操作日志记录失败:', err);
      }
      
      return originalSend(body);
    };
    
    next();
  };
}
