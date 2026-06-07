import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || parseInt(req.query.page_size as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.cargo_type) {
      where += ' AND c.cargo_type = ?';
      params.push(req.query.cargo_type);
    }
    if (req.query.status) {
      where += ' AND c.status = ?';
      params.push(req.query.status);
    }
    if (req.query.origin_province) {
      where += ' AND c.origin_province = ?';
      params.push(req.query.origin_province);
    }
    if (req.query.origin_city) {
      where += ' AND c.origin_city = ?';
      params.push(req.query.origin_city);
    }
    if (req.query.dest_province) {
      where += ' AND c.dest_province = ?';
      params.push(req.query.dest_province);
    }
    if (req.query.dest_city) {
      where += ' AND c.dest_city = ?';
      params.push(req.query.dest_city);
    }
    if (req.query.keyword) {
      where += ' AND (c.cargo_name LIKE ? OR c.description LIKE ?)';
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM cargo c ${where}`).get(...params) as any).count;
    const items = db.prepare(`SELECT c.id, c.user_id, c.cargo_name, c.cargo_type, c.weight, c.volume, c.temperature_control, c.loading_method, c.origin_province, c.origin_city, c.origin_district, c.dest_province, c.dest_city, c.dest_district, c.origin_lat, c.origin_lng, c.dest_lat, c.dest_lng, c.route_preference, c.expected_loading_date, c.expected_delivery_date, c.budget, c.description, c.status, c.created_at, c.updated_at, u.username as publisher_name, u.real_name as publisher_real_name, u.phone as publisher_phone, u.company_name as publisher_company FROM cargo c LEFT JOIN users u ON c.user_id = u.id ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取货源列表失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      cargo_name, cargo_type, weight, volume, temperature_control, loading_method,
      origin_province, origin_city, origin_district,
      dest_province, dest_city, dest_district,
      origin_lat, origin_lng, dest_lat, dest_lng,
      route_preference, expected_loading_date, expected_delivery_date,
      budget, description,
    } = req.body;

    if (!cargo_name) {
      res.status(400).json({ error: '货物名称为必填项' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO cargo (user_id, cargo_name, cargo_type, weight, volume, temperature_control, loading_method,
        origin_province, origin_city, origin_district, dest_province, dest_city, dest_district,
        origin_lat, origin_lng, dest_lat, dest_lng, route_preference,
        expected_loading_date, expected_delivery_date, budget, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user!.userId, cargo_name, cargo_type || 'general', weight || 0, volume || 0,
      temperature_control || 'none', loading_method || 'manual',
      origin_province || '', origin_city || '', origin_district || '',
      dest_province || '', dest_city || '', dest_district || '',
      origin_lat || 0, origin_lng || 0, dest_lat || 0, dest_lng || 0,
      route_preference || 'shortest',
      expected_loading_date || null, expected_delivery_date || null,
      budget || 0, description || '',
    );

    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(cargo);
  } catch (err) {
    res.status(500).json({ error: '创建货源失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cargo = db.prepare(`SELECT c.*, u.username as publisher_name, u.real_name as publisher_real_name, u.phone as publisher_phone, u.company_name as publisher_company FROM cargo c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?`).get(req.params.id);
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }
    res.json(cargo);
  } catch (err) {
    res.status(500).json({ error: '获取货源详情失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(req.params.id) as any;
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }
    if (cargo.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: '无权修改此货源' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    const allowedFields = [
      'cargo_name', 'cargo_type', 'weight', 'volume', 'temperature_control', 'loading_method',
      'origin_province', 'origin_city', 'origin_district',
      'dest_province', 'dest_city', 'dest_district',
      'origin_lat', 'origin_lng', 'dest_lat', 'dest_lng',
      'route_preference', 'expected_loading_date', 'expected_delivery_date',
      'budget', 'description',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: '没有要更新的字段' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE cargo SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM cargo WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新货源失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(req.params.id) as any;
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }
    if (cargo.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: '无权删除此货源' });
      return;
    }
    db.prepare("UPDATE cargo SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ message: '货源已取消' });
  } catch (err) {
    res.status(500).json({ error: '删除货源失败' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: '状态为必填项' });
      return;
    }
    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(req.params.id) as any;
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }
    db.prepare("UPDATE cargo SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM cargo WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新状态失败' });
  }
});

export default router;
