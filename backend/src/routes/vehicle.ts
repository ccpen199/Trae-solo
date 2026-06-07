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

    if (req.query.vehicle_type) {
      where += ' AND v.vehicle_type = ?';
      params.push(req.query.vehicle_type);
    }
    if (req.query.status) {
      where += ' AND v.status = ?';
      params.push(req.query.status);
    }
    if (req.query.current_province) {
      where += ' AND v.current_province = ?';
      params.push(req.query.current_province);
    }
    if (req.query.current_city) {
      where += ' AND v.current_city = ?';
      params.push(req.query.current_city);
    }
    if (req.query.keyword) {
      where += ' AND (v.plate_number LIKE ? OR v.available_routes LIKE ?)';
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM vehicles v ${where}`).get(...params) as any).count;
    const items = db.prepare(`SELECT v.id, v.user_id, v.plate_number, v.vehicle_type, v.load_capacity, v.volume_capacity, v.temperature_control, v.current_province, v.current_city, v.current_lat, v.current_lng, v.available_routes, v.driver_license, v.status, v.created_at, v.updated_at, u.username as owner_name, u.real_name as owner_real_name, u.phone as owner_phone, u.company_name as owner_company FROM vehicles v LEFT JOIN users u ON v.user_id = u.id ${where} ORDER BY v.created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取车辆列表失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      plate_number, vehicle_type, load_capacity, volume_capacity, temperature_control,
      current_province, current_city, current_lat, current_lng,
      available_routes, driver_license,
    } = req.body;

    if (!plate_number) {
      res.status(400).json({ error: '车牌号为必填项' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO vehicles (user_id, plate_number, vehicle_type, load_capacity, volume_capacity, temperature_control,
        current_province, current_city, current_lat, current_lng, available_routes, driver_license)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user!.userId, plate_number, vehicle_type || 'flatbed',
      load_capacity || 0, volume_capacity || 0, temperature_control || 'none',
      current_province || '', current_city || '', current_lat || 0, current_lng || 0,
      available_routes || '', driver_license || '',
    );

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: '创建车辆失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = db.prepare(`SELECT v.*, u.username as owner_name, u.real_name as owner_real_name, u.phone as owner_phone, u.company_name as owner_company FROM vehicles v LEFT JOIN users u ON v.user_id = u.id WHERE v.id = ?`).get(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: '获取车辆详情失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id) as any;
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }
    if (vehicle.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: '无权修改此车辆' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    const allowedFields = [
      'plate_number', 'vehicle_type', 'load_capacity', 'volume_capacity', 'temperature_control',
      'current_province', 'current_city', 'current_lat', 'current_lng',
      'available_routes', 'driver_license',
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

    db.prepare(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新车辆失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id) as any;
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }
    if (vehicle.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      res.status(403).json({ error: '无权删除此车辆' });
      return;
    }
    db.prepare("UPDATE vehicles SET status = 'offline', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ message: '车辆已下线' });
  } catch (err) {
    res.status(500).json({ error: '删除车辆失败' });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: '状态为必填项' });
      return;
    }
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id) as any;
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }
    db.prepare("UPDATE vehicles SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新状态失败' });
  }
});

export default router;
