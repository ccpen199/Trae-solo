import { db } from '../db.js';

export function logAudit(
  userId: number,
  action: string,
  resourceType: string,
  resourceId?: number | null,
  oldValue?: string | null,
  newValue?: string | null
) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, resourceType, resourceId || null, oldValue || null, newValue || null);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export function auditMiddleware(action: string, resourceType: string) {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    const resourceId = req.params.id ? parseInt(req.params.id) : undefined;
    const oldValue = req.body ? JSON.stringify(req.body) : undefined;

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const newValue = body ? JSON.stringify(body) : undefined;
      if (userId) {
        logAudit(userId, action, resourceType, resourceId, oldValue, newValue);
      }
      return originalJson(body);
    };

    next();
  };
}
