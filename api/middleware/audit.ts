import { Request, Response, NextFunction } from 'express';
import db from '../database';

export function auditMiddleware(action: string, resourceType?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: any;

    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    res.send = function (body: any) {
      if (typeof body === 'object') {
        responseBody = body;
      }
      return originalSend.call(this, body);
    };

    res.on('finish', () => {
      try {
        const userId = req.user?.userId || null;
        const resourceId = req.params.id || null;
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const result = res.statusCode < 400 ? 'success' : 'failed';

        let requestData: string | undefined;
        if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
          const body = { ...req.body };
          if (body.password) body.password = '***';
          if (body.idCardNo) body.idCardNo = maskIdCard(body.idCardNo);
          if (body.phone) body.phone = maskPhone(body.phone);
          requestData = JSON.stringify(body);
        }

        db.prepare(`
          INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, result, request_data, response_data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          action,
          resourceType || null,
          resourceId,
          ipAddress,
          userAgent,
          result,
          requestData || null,
          JSON.stringify(responseBody).substring(0, 2000)
        );
      } catch (error) {
        console.error('审计日志记录失败:', error);
      }
    });

    next();
  };
}

function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.substring(0, 6) + '********' + idCard.substring(14);
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
}
