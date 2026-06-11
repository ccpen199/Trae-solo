import { Router } from 'express';
import { getDb } from '../database';
import { success, error } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const branches = db.prepare(`
      SELECT b.*, u.name as manager_name
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      ORDER BY b.id
    `).all();
    branches.forEach((b: any) => {
      b.brand_partners = JSON.parse(b.brand_partners || '[]');
    });
    success(res, branches);
  } catch (e: any) {
    error(res, e.message, 500, 500);
  }
});

router.put('/:id/brands', authMiddleware, (req, res) => {
  try {
    const { role } = (req as any).user;
    if (role !== 'admin' && role !== 'platform') {
      return error(res, '角色无权限', 1004, 403);
    }
    const db = getDb();
    const { brand_partners } = req.body;
    db.prepare('UPDATE branches SET brand_partners = ? WHERE id = ?').run(
      JSON.stringify(brand_partners), req.params.id,
    );
    success(res, null, '更新成功');
  } catch (e: any) {
    error(res, e.message, 500, 500);
  }
});

export default router;
