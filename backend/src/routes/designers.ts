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
    const availability = req.query.availability as string;

    let whereClause = '';
    const params: any[] = [];
    if (availability) {
      whereClause = 'WHERE d.availability = ?';
      params.push(availability);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM designers d ${whereClause}`).get(...params) as any).count;
    const designers = db.prepare(
      `SELECT d.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM designers d JOIN users u ON d.user_id = u.id
       ${whereClause}
       ORDER BY d.rating DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({ success: true, data: { list: designers, total, page, limit } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取设计师列表失败' });
  }
});

router.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const designer = db.prepare(
      `SELECT d.*, u.username, u.name, u.phone, u.email, u.avatar
       FROM designers d JOIN users u ON d.user_id = u.id WHERE d.id = ?`
    ).get(req.params.id);
    if (!designer) {
      return res.status(404).json({ success: false, error: '设计师不存在' });
    }
    res.json({ success: true, data: designer });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取设计师信息失败' });
  }
});

router.put('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const { portfolio, certifications, rating, experience_years, specialties, availability, name, phone, email } = req.body;

    const designer = db.prepare('SELECT * FROM designers WHERE id = ?').get(req.params.id) as any;
    if (!designer) {
      return res.status(404).json({ success: false, error: '设计师不存在' });
    }

    db.prepare(
      `UPDATE designers SET portfolio = ?, certifications = ?, rating = ?, experience_years = ?, specialties = ?, availability = ? WHERE id = ?`
    ).run(
      portfolio ? JSON.stringify(portfolio) : designer.portfolio,
      certifications ? JSON.stringify(certifications) : designer.certifications,
      rating ?? designer.rating,
      experience_years ?? designer.experience_years,
      specialties ?? designer.specialties,
      availability ?? designer.availability,
      req.params.id
    );

    if (name || phone || email) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(designer.user_id) as any;
      db.prepare("UPDATE users SET name = ?, phone = ?, email = ?, updated_at = datetime('now') WHERE id = ?").run(
        name ?? user.name,
        phone ?? user.phone,
        email ?? user.email,
        designer.user_id
      );
    }

    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新设计师信息失败' });
  }
});

router.put('/:id/availability', (req: AuthenticatedRequest, res) => {
  try {
    const { availability } = req.body;
    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({ success: false, error: '无效的可用状态' });
    }

    const designer = db.prepare('SELECT * FROM designers WHERE id = ?').get(req.params.id);
    if (!designer) {
      return res.status(404).json({ success: false, error: '设计师不存在' });
    }

    db.prepare('UPDATE designers SET availability = ? WHERE id = ?').run(availability, req.params.id);
    res.json({ success: true, data: { id: req.params.id, availability } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新可用状态失败' });
  }
});

export default router;
