import { Router } from 'express';
import { getDb } from '../database';
import { success, error } from '../utils/response';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  try {
    const db = getDb();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const userRole = req.query.user_role as string;
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];
    if (userRole) {
      whereClause = 'WHERE user_role = ?';
      params.push(userRole);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).get(...params) as any;
    const list = db.prepare(`
      SELECT * FROM audit_logs ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    success(res, { list, total: total.count, page, pageSize });
  } catch (e: any) {
    error(res, e.message, 500, 500);
  }
});

export default router;
