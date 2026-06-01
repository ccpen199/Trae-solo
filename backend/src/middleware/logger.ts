import { Request, Response, NextFunction } from 'express';
import db from '../db';

export interface LogRequest extends Request {
  userId?: number;
  userName?: string;
}

export function operationLogger(req: LogRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody: any;
  
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  res.send = function(body: any) {
    if (typeof body === 'string') {
      try {
        responseBody = JSON.parse(body);
      } catch {
        responseBody = body;
      }
    }
    return originalSend.call(this, body);
  };
  
  res.on('finish', () => {
    try {
      const userId = req.userId || 1;
      const userName = req.userName || 'system';
      const action = `${req.method} ${req.path}`;
      const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
      
      let details = '';
      if (Object.keys(req.params || {}).length > 0) {
        details += `Params: ${JSON.stringify(req.params)}; `;
      }
      if (Object.keys(req.query || {}).length > 0) {
        details += `Query: ${JSON.stringify(req.query)}; `;
      }
      if (Object.keys(req.body || {}).length > 0) {
        const bodyToLog = { ...req.body };
        if (bodyToLog.password) delete bodyToLog.password;
        details += `Body: ${JSON.stringify(bodyToLog)}; `;
      }
      if (responseBody && responseBody.message) {
        details += `Result: ${responseBody.success ? 'Success' : 'Failed'} - ${responseBody.message}`;
      } else if (responseBody) {
        details += `Result: ${responseBody.success ? 'Success' : 'Failed'}`;
      }
      
      const duration = Date.now() - startTime;
      details += ` Duration: ${duration}ms`;
      
      db.prepare(`
        INSERT INTO operation_logs (user_id, user_name, action, ip, details)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, userName, action, ip, details);
    } catch (err) {
      console.error('Failed to write operation log:', err);
    }
  });
  
  next();
}

export function logOperation(userId: number, userName: string, action: string, ip: string, details: string) {
  try {
    db.prepare(`
      INSERT INTO operation_logs (user_id, user_name, action, ip, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, userName, action, ip, details);
  } catch (err) {
    console.error('Failed to write operation log:', err);
  }
}
