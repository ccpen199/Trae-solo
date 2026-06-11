import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { waybillId, handled, level, type, page = 1, pageSize = 10 } = req.query;

  let sql = `
    SELECT
      e.*,
      w.waybill_no,
      c.cargo_name,
      d.name as driver_name,
      d.phone as driver_phone,
      v.plate_no
    FROM exception_records e
    LEFT JOIN waybills w ON e.waybill_id = w.id
    LEFT JOIN cargo c ON w.cargo_id = c.id
    LEFT JOIN drivers d ON w.driver_id = d.id
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (waybillId) {
    sql += ' AND e.waybill_id = ?';
    params.push(waybillId);
  }
  if (handled !== undefined) {
    sql += ' AND e.handled = ?';
    params.push(handled === 'true' ? 1 : 0);
  }
  if (level) {
    sql += ' AND e.level = ?';
    params.push(level);
  }
  if (type) {
    sql += ' AND e.type = ?';
    params.push(type);
  }

  const countSql = sql.replace('SELECT e.*, w.waybill_no, c.cargo_name, d.name as driver_name, d.phone as driver_phone, v.plate_no', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY e.timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    waybillId: row.waybill_id,
    waybillNo: row.waybill_no,
    cargoName: row.cargo_name,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    plateNo: row.plate_no,
    type: row.type,
    level: row.level,
    location: JSON.parse(row.location),
    timestamp: row.timestamp,
    description: row.description,
    handled: !!row.handled,
    handledBy: row.handled_by,
    handledAt: row.handled_at,
    handleRemark: row.handle_remark,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const row = db.prepare(`
    SELECT
      e.*,
      w.waybill_no,
      w.status as waybill_status,
      c.cargo_name,
      c.start_city,
      c.end_city,
      d.name as driver_name,
      d.phone as driver_phone,
      v.plate_no,
      v.vehicle_type
    FROM exception_records e
    LEFT JOIN waybills w ON e.waybill_id = w.id
    LEFT JOIN cargo c ON w.cargo_id = c.id
    LEFT JOIN drivers d ON w.driver_id = d.id
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    WHERE e.id = ?
  `).get(id) as any;

  if (!row) {
    return res.error('异常记录不存在', 404);
  }

  const exception = {
    id: row.id,
    waybill: {
      id: row.waybill_id,
      waybillNo: row.waybill_no,
      status: row.waybill_status,
    },
    cargo: {
      name: row.cargo_name,
      startCity: row.start_city,
      endCity: row.end_city,
    },
    driver: {
      name: row.driver_name,
      phone: row.driver_phone,
    },
    vehicle: {
      plateNo: row.plate_no,
      type: row.vehicle_type,
    },
    type: row.type,
    level: row.level,
    location: JSON.parse(row.location),
    timestamp: row.timestamp,
    description: row.description,
    handled: !!row.handled,
    handledBy: row.handled_by,
    handledAt: row.handled_at,
    handleRemark: row.handle_remark,
  };

  res.success(exception, '获取成功');
});

router.post('/', authMiddleware, roleMiddleware(['driver', 'operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { waybillId, type, level, location, description } = req.body;

  if (!waybillId || !type || !level || !location) {
    return res.error('请填写完整信息', 400);
  }

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(waybillId) as any;
  if (!waybill) {
    return res.error('运单不存在', 404);
  }

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO exception_records (
      id, waybill_id, type, level, location, timestamp, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    waybillId,
    type,
    level,
    JSON.stringify(location),
    timestamp,
    description || null
  );

  db.prepare('UPDATE waybills SET status = ? WHERE id = ?').run('exception', waybillId);

  res.success({ id, timestamp }, '异常记录创建成功');
});

router.post('/:id/handle', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.error('未授权访问', 401);
  }

  const { id } = req.params;
  const { handleRemark } = req.body;

  const exception = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(id) as any;
  if (!exception) {
    return res.error('异常记录不存在', 404);
  }

  if (exception.handled) {
    return res.error('该异常已处理', 400);
  }

  const handledAt = new Date().toISOString();

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE exception_records SET
        handled = 1, handled_by = ?, handled_at = ?, handle_remark = ?
      WHERE id = ?
    `).run(req.user.id, handledAt, handleRemark || null, id);

    db.prepare(`
      UPDATE waybills SET status = 'in_transit', updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'exception'
    `).run(exception.waybill_id);
  });

  transaction();

  res.success({
    id,
    handled: true,
    handledAt,
  }, '异常处理完成');
});

export default router;
