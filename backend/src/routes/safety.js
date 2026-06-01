import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const RESTRICT_ALERT_TYPES = ['high_temperature', 'leakage'];

router.get('/alerts', (req, res) => {
  const { station_id, alert_type, severity, status, page = 1, page_size = 20 } = req.query;
  const pageNum = Number(page);
  const pageSize = Number(page_size);
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (station_id) {
    conditions.push('station_id = ?');
    params.push(station_id);
  }
  if (alert_type) {
    conditions.push('alert_type = ?');
    params.push(alert_type);
  }
  if (severity) {
    conditions.push('severity = ?');
    params.push(severity);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const { count: total } = db.prepare(
    `SELECT COUNT(*) AS count FROM safety_alerts ${where}`
  ).get(...params);

  const data = db.prepare(
    `SELECT * FROM safety_alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  res.json({ data, total, page: pageNum, page_size: pageSize });
});

router.post('/alerts', (req, res) => {
  const { station_id, battery_id, alert_type, severity, description } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const result = db.prepare(
    `INSERT INTO safety_alerts (station_id, battery_id, alert_type, severity, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`
  ).run(station_id, battery_id || null, alert_type, severity || 'medium', description, now, now);

  if (RESTRICT_ALERT_TYPES.includes(alert_type) && battery_id) {
    db.prepare(
      "UPDATE batteries SET status = 'abnormal', updated_at = ? WHERE id = ?"
    ).run(now, battery_id);
  }

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/alerts/:id', (req, res) => {
  const { status } = req.body;
  const alertId = req.params.id;

  const alert = db.prepare('SELECT * FROM safety_alerts WHERE id = ?').get(alertId);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(
    "UPDATE safety_alerts SET status = ?, updated_at = ? WHERE id = ?"
  ).run(status, now, alertId);

  res.json({ id: Number(alertId), status });
});

router.get('/work-orders', (req, res) => {
  const { station_id, type, status, page = 1, page_size = 20 } = req.query;
  const pageNum = Number(page);
  const pageSize = Number(page_size);
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];

  if (station_id) {
    conditions.push('station_id = ?');
    params.push(station_id);
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const { count: total } = db.prepare(
    `SELECT COUNT(*) AS count FROM work_orders ${where}`
  ).get(...params);

  const data = db.prepare(
    `SELECT * FROM work_orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  res.json({ data, total, page: pageNum, page_size: pageSize });
});

router.post('/work-orders', (req, res) => {
  const { alert_id, station_id, battery_id, type, description, assigned_to } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const result = db.prepare(
    `INSERT INTO work_orders (alert_id, station_id, battery_id, type, description, assigned_to, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(alert_id || null, station_id, battery_id || null, type, description, assigned_to || null, now, now);

  if (alert_id) {
    db.prepare(
      "UPDATE safety_alerts SET status = 'processing', updated_at = ? WHERE id = ?"
    ).run(now, alert_id);
  }

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/work-orders/:id', (req, res) => {
  const { status, assigned_to, resolution } = req.body;
  const workOrderId = req.params.id;

  const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(workOrderId);
  if (!workOrder) {
    return res.status(404).json({ error: 'Work order not found' });
  }

  const fields = [];
  const params = [];

  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (assigned_to !== undefined) { fields.push('assigned_to = ?'); params.push(assigned_to); }
  if (resolution !== undefined) { fields.push('resolution = ?'); params.push(resolution); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  fields.push('updated_at = ?');
  params.push(now);
  params.push(workOrderId);

  db.prepare(`UPDATE work_orders SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  if (status === 'completed' && workOrder.alert_id) {
    db.prepare(
      "UPDATE safety_alerts SET status = 'resolved', updated_at = ? WHERE id = ?"
    ).run(now, workOrder.alert_id);
  }

  res.json({ id: Number(workOrderId), status });
});

export default router;
