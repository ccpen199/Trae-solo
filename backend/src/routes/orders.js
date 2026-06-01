import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { station_id, status, vehicle_id, page = 1, page_size = 20 } = req.query;
  const pageNum = Number(page);
  const pageSize = Number(page_size);
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (station_id) {
    conditions.push('o.station_id = ?');
    params.push(station_id);
  }
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  if (vehicle_id) {
    conditions.push('o.vehicle_id = ?');
    params.push(vehicle_id);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const { count: total } = db.prepare(
    `SELECT COUNT(*) AS count FROM swap_orders o ${where}`
  ).get(...params);

  const data = db.prepare(
    `SELECT o.*, v.plate_number, v.owner_name, v.member_type
     FROM swap_orders o
     JOIN vehicles v ON o.vehicle_id = v.id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  res.json({ data, total, page: pageNum, page_size: pageSize });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(
    `SELECT o.*,
       v.plate_number, v.owner_name, v.member_type,
       b_out.battery_code AS battery_out_code,
       b_out.soc AS battery_out_soc,
       b_out.soh AS battery_out_soh,
       b_out.status AS battery_out_status,
       b_in.battery_code AS battery_in_code,
       b_in.soc AS battery_in_soc,
       b_in.soh AS battery_in_soh,
       b_in.status AS battery_in_status
     FROM swap_orders o
     JOIN vehicles v ON o.vehicle_id = v.id
     LEFT JOIN batteries b_out ON o.battery_out_id = b_out.id
     LEFT JOIN batteries b_in ON o.battery_in_id = b_in.id
     WHERE o.id = ?`
  ).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

router.post('/', (req, res) => {
  const {
    station_id, vehicle_id, battery_out_id, battery_in_id,
    slot_number, fee, discount_amount, actual_fee,
    member_benefit, operator_id,
  } = req.body;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const orderNo = `SW${Date.now()}`;

  const result = db.prepare(
    `INSERT INTO swap_orders
       (order_no, station_id, vehicle_id, battery_out_id, battery_in_id, slot_number,
        status, fee, discount_amount, actual_fee, member_benefit, operator_id, swap_start_time, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orderNo, station_id, vehicle_id, battery_out_id || null, battery_in_id || null,
    slot_number || null, fee || 0, discount_amount || 0, actual_fee || 0,
    member_benefit || null, operator_id || null, now, now, now
  );

  res.status(201).json({ id: result.lastInsertRowid, order_no: orderNo });
});

router.put('/:id/status', (req, res) => {
  const { status, failure_reason, suspend_reason } = req.body;
  const orderId = req.params.id;

  const order = db.prepare('SELECT * FROM swap_orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (status === 'completed') {
    db.prepare(
      "UPDATE swap_orders SET status = ?, swap_end_time = ?, updated_at = ? WHERE id = ?"
    ).run(status, now, now, orderId);
  } else if (status === 'failed') {
    if (!failure_reason) {
      return res.status(400).json({ error: 'failure_reason is required when status is failed' });
    }
    db.prepare(
      "UPDATE swap_orders SET status = ?, failure_reason = ?, updated_at = ? WHERE id = ?"
    ).run(status, failure_reason, now, orderId);
  } else if (status === 'suspended') {
    db.prepare(
      "UPDATE swap_orders SET status = ?, suspend_reason = ?, updated_at = ? WHERE id = ?"
    ).run(status, suspend_reason || '电池异常暂停', now, orderId);
  } else {
    db.prepare(
      "UPDATE swap_orders SET status = ?, updated_at = ? WHERE id = ?"
    ).run(status, now, orderId);
  }

  res.json({ id: Number(orderId), status });
});

export default router;
