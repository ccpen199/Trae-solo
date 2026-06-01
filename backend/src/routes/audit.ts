import { Router, Response } from 'express';
import { db, rowToAuditLog } from '../db.js';
import { authMiddleware, adminRequired, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, adminRequired, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const action = req.query.action as string;
  const resourceType = req.query.resourceType as string;
  const userId = parseInt(req.query.userId as string);
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (action) {
    whereClause += ' AND a.action = ?';
    params.push(action);
  }

  if (resourceType) {
    whereClause += ' AND a.resource_type = ?';
    params.push(resourceType);
  }

  if (userId) {
    whereClause += ' AND a.user_id = ?';
    params.push(userId);
  }

  params.push(pageSize, offset);

  const rows = db.prepare(`
    SELECT a.*, u.username
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const countParams = params.slice(0, -2);
  const totalRow = db.prepare(`
    SELECT COUNT(*) as count FROM audit_logs a
    ${whereClause}
  `).get(...countParams) as { count: number };

  const items = rows.map(row => ({
    ...rowToAuditLog(row),
    username: row.username
  }));

  res.json({ items, total: totalRow.count, page, pageSize });
});

export default router;
