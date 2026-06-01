import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { station_id, status, fault_code, page = 1, page_size = 20 } = req.query;
  const pageNum = Number(page);
  const pageSize = Number(page_size);
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (fault_code) {
    conditions.push('fault_code = ?');
    params.push(fault_code);
  }
  if (station_id) {
    conditions.push('station_id = ?');
    params.push(station_id);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const { count: total } = db.prepare(
    `SELECT COUNT(*) AS count FROM batteries ${where}`
  ).get(...params);

  const data = db.prepare(
    `SELECT * FROM batteries ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  res.json({ data, total, page: pageNum, page_size: pageSize });
});

router.get('/:id', (req, res) => {
  const battery = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id);
  if (!battery) {
    return res.status(404).json({ error: 'Battery not found' });
  }
  res.json(battery);
});

router.post('/', (req, res) => {
  const { battery_code, model, soc, soh, cycle_count, temperature, voltage, status, fault_code, station_id } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const result = db.prepare(
    `INSERT INTO batteries (battery_code, model, soc, soh, cycle_count, temperature, voltage, status, fault_code, station_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    battery_code,
    model || 'standard',
    soc ?? 0,
    soh ?? 100,
    cycle_count ?? 0,
    temperature ?? 25.0,
    voltage ?? 72.0,
    status || 'available',
    fault_code || null,
    station_id || 1,
    now,
    now
  );

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const battery = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id);
  if (!battery) {
    return res.status(404).json({ error: 'Battery not found' });
  }

  const fields = [];
  const params = [];

  const { soc, soh, cycle_count, temperature, voltage, fault_code, status, station_id, last_maintenance_date } = req.body;

  if (soc !== undefined) { fields.push('soc = ?'); params.push(soc); }
  if (soh !== undefined) { fields.push('soh = ?'); params.push(soh); }
  if (cycle_count !== undefined) { fields.push('cycle_count = ?'); params.push(cycle_count); }
  if (temperature !== undefined) { fields.push('temperature = ?'); params.push(temperature); }
  if (voltage !== undefined) { fields.push('voltage = ?'); params.push(voltage); }
  if (fault_code !== undefined) { fields.push('fault_code = ?'); params.push(fault_code); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (station_id !== undefined) { fields.push('station_id = ?'); params.push(station_id); }
  if (last_maintenance_date !== undefined) { fields.push('last_maintenance_date = ?'); params.push(last_maintenance_date); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  fields.push('updated_at = ?');
  params.push(new Date().toISOString().replace('T', ' ').slice(0, 19));
  params.push(req.params.id);

  db.prepare(`UPDATE batteries SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ id: Number(req.params.id) });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;

  const battery = db.prepare('SELECT * FROM batteries WHERE id = ?').get(req.params.id);
  if (!battery) {
    return res.status(404).json({ error: 'Battery not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(
    "UPDATE batteries SET status = ?, updated_at = ? WHERE id = ?"
  ).run(status, now, req.params.id);

  res.json({ id: Number(req.params.id), status });
});

export default router;
