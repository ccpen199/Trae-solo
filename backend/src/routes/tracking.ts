import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.status) {
      where += ' AND tt.status = ?';
      params.push(req.query.status);
    }
    if (req.query.shipper_id) {
      where += ' AND tt.shipper_id = ?';
      params.push(req.query.shipper_id);
    }
    if (req.query.driver_id) {
      where += ' AND tt.driver_id = ?';
      params.push(req.query.driver_id);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM transport_tasks tt ${where}`).get(...params) as any).count;
    const items = db.prepare(`
      SELECT tt.*,
        c.cargo_name, c.origin_city, c.dest_city,
        v.plate_number, v.vehicle_type,
        su.real_name as shipper_name, du.real_name as driver_name
      FROM transport_tasks tt
      LEFT JOIN cargo c ON tt.cargo_id = c.id
      LEFT JOIN vehicles v ON tt.vehicle_id = v.id
      LEFT JOIN users su ON tt.shipper_id = su.id
      LEFT JOIN users du ON tt.driver_id = du.id
      ${where}
      ORDER BY tt.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取运输任务列表失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { cargo_id, vehicle_id, contract_id, driver_id } = req.body;

    if (!cargo_id || !vehicle_id) {
      res.status(400).json({ error: '货源ID和车辆ID为必填项' });
      return;
    }

    const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(cargo_id) as any;
    if (!cargo) {
      res.status(404).json({ error: '货源不存在' });
      return;
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id) as any;
    if (!vehicle) {
      res.status(404).json({ error: '车辆不存在' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO transport_tasks (cargo_id, vehicle_id, contract_id, shipper_id, driver_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending_loading')
    `).run(cargo_id, vehicle_id, contract_id || null, cargo.user_id, driver_id || vehicle.user_id);

    db.prepare("UPDATE cargo SET status = 'transporting', updated_at = datetime('now') WHERE id = ?").run(cargo_id);
    db.prepare("UPDATE vehicles SET status = 'transporting', updated_at = datetime('now') WHERE id = ?").run(vehicle_id);

    const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: '创建运输任务失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const task = db.prepare(`
      SELECT tt.*,
        c.cargo_name, c.cargo_type, c.weight, c.volume, c.origin_city, c.dest_city,
        c.origin_lat, c.origin_lng, c.dest_lat, c.dest_lng,
        v.plate_number, v.vehicle_type, v.temperature_control,
        su.real_name as shipper_name, su.phone as shipper_phone,
        du.real_name as driver_name, du.phone as driver_phone
      FROM transport_tasks tt
      LEFT JOIN cargo c ON tt.cargo_id = c.id
      LEFT JOIN vehicles v ON tt.vehicle_id = v.id
      LEFT JOIN users su ON tt.shipper_id = su.id
      LEFT JOIN users du ON tt.driver_id = du.id
      WHERE tt.id = ?
    `).get(req.params.id);

    if (!task) {
      res.status(404).json({ error: '运输任务不存在' });
      return;
    }

    const checkins = db.prepare('SELECT * FROM checkin_records WHERE task_id = ? ORDER BY checkin_time ASC').all(req.params.id);
    res.json({ ...(task as any), checkins });
  } catch (err) {
    res.status(500).json({ error: '获取运输任务详情失败' });
  }
});

router.post('/:id/checkin', async (req: Request, res: Response) => {
  try {
    const { checkin_type, latitude, longitude, address, notes, photo_url } = req.body;

    if (!checkin_type) {
      res.status(400).json({ error: '打卡类型为必填项' });
      return;
    }

    const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id) as any;
    if (!task) {
      res.status(404).json({ error: '运输任务不存在' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO checkin_records (task_id, user_id, checkin_type, latitude, longitude, address, photo_url, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id, req.user!.userId, checkin_type,
      latitude || 0, longitude || 0, address || '', photo_url || '', notes || '',
    );

    if (checkin_type === 'loading') {
      db.prepare("UPDATE transport_tasks SET status = 'loading', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    } else if (checkin_type === 'in_transit') {
      db.prepare("UPDATE transport_tasks SET status = 'in_transit', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    } else if (checkin_type === 'unloading') {
      db.prepare("UPDATE transport_tasks SET status = 'unloading', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    }

    const checkin = db.prepare('SELECT * FROM checkin_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(checkin);
  } catch (err) {
    res.status(500).json({ error: '创建打卡记录失败' });
  }
});

router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      res.status(404).json({ error: '运输任务不存在' });
      return;
    }

    const checkins = db.prepare('SELECT * FROM checkin_records WHERE task_id = ? ORDER BY checkin_time ASC').all(req.params.id);
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: '获取打卡记录失败' });
  }
});

export default router;
