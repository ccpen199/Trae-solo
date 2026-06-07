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

    const total = (db.prepare('SELECT COUNT(*) as count FROM owners').get() as any).count;
    const owners = db.prepare(
      `SELECT o.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM owners o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    ).all(limit, offset);

    res.json({ success: true, data: { list: owners, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取业主列表失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const owner = db.prepare(
      `SELECT o.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM owners o JOIN users u ON o.user_id = u.id WHERE o.id = ?`
    ).get(req.params.id);
    if (!owner) {
      return res.status(404).json({ success: false, error: '业主不存在' });
    }
    res.json({ success: true, data: owner });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取业主信息失败' });
  }
});

router.put('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { budget_min, budget_max, style_preference, timeline_start, timeline_end, address, name, phone, email } = req.body;

    const owner = db.prepare('SELECT * FROM owners WHERE id = ?').get(req.params.id) as any;
    if (!owner) {
      return res.status(404).json({ success: false, error: '业主不存在' });
    }

    db.prepare(
      `UPDATE owners SET budget_min = ?, budget_max = ?, style_preference = ?, timeline_start = ?, timeline_end = ?, address = ? WHERE id = ?`
    ).run(
      budget_min ?? owner.budget_min,
      budget_max ?? owner.budget_max,
      style_preference ?? owner.style_preference,
      timeline_start ?? owner.timeline_start,
      timeline_end ?? owner.timeline_end,
      address ?? owner.address,
      req.params.id
    );

    if (name || phone || email) {
      db.prepare("UPDATE users SET name = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?").run(
        name ?? owner.name,
        phone ?? owner.phone,
        email ?? owner.email,
        owner.user_id
      );
    }

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新业主信息失败' });
  }
});

router.get('/:id/projects', (req: AuthenticatedRequest, res) => {
  try {
    const projects = db.prepare(
      `SELECT * FROM projects WHERE owner_id = (SELECT user_id FROM owners WHERE id = ?) ORDER BY created_at DESC`
    ).all(req.params.id);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取业主项目列表失败' });
  }
});

export default router;
