import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware(), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 10, city, keyword } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (city) {
    where.push('e.city = ?');
    params.push(city);
  }
  if (keyword) {
    where.push('(e.name LIKE ? OR e.phone LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM employers e ${whereSql}`).get(...params) as any;
  const list = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM orders o WHERE o.employer_id = e.id) as total_orders,
      (SELECT COUNT(*) FROM orders o WHERE o.employer_id = e.id AND o.status = 'completed') as completed_orders
    FROM employers e
    ${whereSql}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

router.get('/:id', authMiddleware(), (req: AuthRequest, res: Response) => {
  const employer = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM orders o WHERE o.employer_id = e.id) as total_orders,
      (SELECT COUNT(*) FROM orders o WHERE o.employer_id = e.id AND o.status = 'completed') as completed_orders
    FROM employers e WHERE e.id = ?
  `).get(req.params.id) as any;

  if (!employer) {
    return res.status(404).json({ error: '雇主不存在' });
  }

  const orders = db.prepare(`
    SELECT o.*, w.name as worker_name
    FROM orders o
    LEFT JOIN workers w ON o.worker_id = w.id
    WHERE o.employer_id = ?
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({
    employer: {
      ...employer,
      special_requirements_data: (() => {
        if (!employer.special_requirements) return [];
        try {
          const parsed = JSON.parse(employer.special_requirements);
          return Array.isArray(parsed) ? parsed : [employer.special_requirements];
        } catch (e) {
          return [employer.special_requirements];
        }
      })(),
    },
    orders,
  });
});

router.post('/', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { name, phone, address, city, district, longitude, latitude, family_members, special_requirements } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: '必填项不能为空' });
  }

  const userId = uuidv4();
  const employerId = uuidv4();

  const tx = db.transaction(() => {
    const hashedPassword = require('bcryptjs').hashSync('employer123', 10);
    db.prepare('INSERT INTO users (id, username, password, role, phone) VALUES (?, ?, ?, ?, ?)')
      .run(userId, phone, hashedPassword, 'employer', phone);

    db.prepare(`
      INSERT INTO employers (id, user_id, name, phone, address, city, district, longitude, latitude, family_members, special_requirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employerId, userId, name, phone, address || '', city || '', district || '',
      longitude || 0, latitude || 0, family_members || 1,
      special_requirements ? JSON.stringify(special_requirements) : null
    );
  });

  try {
    tx();
    res.json({ success: true, id: employerId, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.put('/:id', authMiddleware(['admin', 'employer']), (req: AuthRequest, res: Response) => {
  const employerId = req.params.id;
  const existing = db.prepare('SELECT * FROM employers WHERE id = ?').get(employerId) as any;
  if (!existing) {
    return res.status(404).json({ error: '雇主不存在' });
  }

  if (req.user!.role === 'employer' && existing.user_id !== req.user!.id) {
    return res.status(403).json({ error: '无权限修改' });
  }

  const { name, phone, address, city, district, longitude, latitude, family_members, special_requirements } = req.body;

  db.prepare(`
    UPDATE employers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      city = COALESCE(?, city),
      district = COALESCE(?, district),
      longitude = COALESCE(?, longitude),
      latitude = COALESCE(?, latitude),
      family_members = COALESCE(?, family_members),
      special_requirements = COALESCE(?, special_requirements),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name, phone, address, city, district, longitude, latitude, family_members,
    special_requirements ? JSON.stringify(special_requirements) : existing.special_requirements,
    employerId
  );

  res.json({ success: true, message: '更新成功' });
});

export default router;
