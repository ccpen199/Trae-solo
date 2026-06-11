import { Response, NextFunction } from 'express';
import db from '../database/index.js';
import { AuthRequest } from './auth.js';

export function operationLog(module: string, operation: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id;
    const userName = req.user?.username || 'anonymous';
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    
    const originalSend = res.json;
    res.json = function(body: any) {
      let detail = '';
      try {
        if (req.method !== 'GET') {
          detail = JSON.stringify({
            body: req.body,
            query: req.query,
            params: req.params,
            responseCode: body?.code,
          });
        }
      } catch (e) {
        detail = '无法序列化请求数据';
      }
      
      if (userId) {
        db.prepare(`
          INSERT INTO operation_logs (user_id, user_name, operation, module, ip, user_agent, detail)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(userId, userName, operation, module, ip, userAgent, detail);
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}
