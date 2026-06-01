import { Router, Response } from 'express';
import { db, rowToApiLog } from '../db.js';
import { authMiddleware, adminRequired, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, adminRequired, (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const method = req.query.method as string;
  const userId = parseInt(req.query.userId as string);
  const statusCode = parseInt(req.query.statusCode as string);
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (method) {
    whereClause += ' AND l.method = ?';
    params.push(method);
  }

  if (userId) {
    whereClause += ' AND l.user_id = ?';
    params.push(userId);
  }

  if (statusCode) {
    whereClause += ' AND l.status_code = ?';
    params.push(statusCode);
  }

  params.push(pageSize, offset);

  const rows = db.prepare(`
    SELECT l.*, u.username
    FROM api_logs l
    LEFT JOIN users u ON l.user_id = u.id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params) as any[];

  const countParams = params.slice(0, -2);
  const totalRow = db.prepare(`
    SELECT COUNT(*) as count FROM api_logs l
    ${whereClause}
  `).get(...countParams) as { count: number };

  const items = rows.map(row => ({
    ...rowToApiLog(row),
    username: row.username
  }));

  res.json({ items, total: totalRow.count, page, pageSize });
});

export default router;
