import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const total = (db.prepare('SELECT COUNT(*) as count FROM suppliers').get() as any).count;
    const suppliers = db.prepare(
      `SELECT s.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM suppliers s JOIN users u ON s.user_id = u.id
       ORDER BY s.id DESC LIMIT ? OFFSET ?`
    ).all(limit, offset);

    res.json({ success: true, data: { list: suppliers, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取供应商列表失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const supplier = db.prepare(
      `SELECT s.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM suppliers s JOIN users u ON s.user_id = u.id WHERE s.id = ?`
    ).get(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, error: '供应商不存在' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取供应商信息失败' });
  }
});

router.put('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { brand_authorization, batch_qc_reports, categories, description, name, phone, email } = req.body;

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id) as any;
    if (!supplier) {
      return res.status(404).json({ success: false, error: '供应商不存在' });
    }

    db.prepare(
      `UPDATE suppliers SET brand_authorization = ?, batch_qc_reports = ?, categories = ?, description = ? WHERE id = ?`
    ).run(
      brand_authorization ? JSON.stringify(brand_authorization) : supplier.brand_authorization,
      batch_qc_reports ? JSON.stringify(batch_qc_reports) : supplier.batch_qc_reports,
      categories ?? supplier.categories,
      description ?? supplier.description,
      req.params.id
    );

    if (name || phone || email) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(supplier.user_id) as any;
      db.prepare("UPDATE users SET name = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?").run(
        name ?? user.name,
        phone ?? user.phone,
        email ?? user.email,
        supplier.user_id
      );
    }

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新供应商信息失败' });
  }
});

export default router;
