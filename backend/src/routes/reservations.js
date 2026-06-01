import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { station_id, status } = req.query;
  const conditions = [];
  const params = [];

  if (station_id) {
    conditions.push('r.station_id = ?');
    params.push(station_id);
  }
  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const rows = db.prepare(`
    SELECT r.*, v.plate_number, v.owner_name
    FROM reservations r
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    ${where}
    ORDER BY r.created_at ASC
  `).all(...params);

  res.json({ data: rows, total: rows.length });
});

router.post('/', (req, res) => {
  const { station_id, vehicle_id, plate_number } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const result = db.prepare(
    `INSERT INTO reservations (station_id, vehicle_id, plate_number, status, created_at, updated_at)
     VALUES (?, ?, ?, 'waiting', ?, ?)`
  ).run(station_id || 1, vehicle_id || null, plate_number || '', now, now);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { status, action_by, action_note } = req.body;
  const validStatuses = ['waiting', 'swapped', 'cancelled', 'requeued'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const operator = action_by || '值班员';
  const note = action_note || '';

  if (status === 'cancelled') {
    db.prepare(
      'UPDATE reservations SET status = ?, action_by = ?, action_at = ?, action_note = ?, updated_at = ? WHERE id = ?'
    ).run(status, operator, now, note || `取消预约，原状态: ${existing.status}`, now, req.params.id);
  } else if (status === 'requeued') {
    db.prepare(
      'UPDATE reservations SET status = ?, action_by = ?, action_at = ?, action_note = ?, updated_at = ? WHERE id = ?'
    ).run(status, operator, now, note || `重新排队，原排队时间: ${existing.created_at}`, now, req.params.id);
  } else {
    db.prepare('UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
