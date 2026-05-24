const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, driver_id, appointment_id } = req.query;
  let sql = `
    SELECT tt.*, a.order_no, a.appointment_date, p.name as pet_name, p.species as pet_species,
           u.name as owner_name, u.phone as owner_phone, u2.name as driver_name
    FROM transport_tasks tt
    LEFT JOIN appointments a ON tt.appointment_id = a.id
    LEFT JOIN pets p ON tt.pet_id = p.id
    LEFT JOIN users u ON tt.owner_id = u.id
    LEFT JOIN users u2 ON tt.driver_id = u2.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'driver') {
    sql += ' AND tt.driver_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'owner') {
    sql += ' AND tt.owner_id = ?';
    params.push(req.user.id);
  }
  
  if (status) {
    sql += ' AND tt.status = ?';
    params.push(status);
  }
  if (driver_id) {
    sql += ' AND tt.driver_id = ?';
    params.push(driver_id);
  }
  if (appointment_id) {
    sql += ' AND tt.appointment_id = ?';
    params.push(appointment_id);
  }
  
  sql += ' ORDER BY tt.scheduled_time DESC';
  const tasks = db.prepare(sql).all(...params);
  
  res.json(tasks);
});

router.get('/:id', authenticateToken, (req, res) => {
  const task = db.prepare(`
    SELECT tt.*, a.order_no, a.appointment_date, p.name as pet_name, p.species as pet_species, p.weight, p.size,
           u.name as owner_name, u.phone as owner_phone, u2.name as driver_name
    FROM transport_tasks tt
    LEFT JOIN appointments a ON tt.appointment_id = a.id
    LEFT JOIN pets p ON tt.pet_id = p.id
    LEFT JOIN users u ON tt.owner_id = u.id
    LEFT JOIN users u2 ON tt.driver_id = u2.id
    WHERE tt.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '接送任务不存在' });
  }
  
  res.json(task);
});

router.put('/:id/assign', authenticateToken, requireRole('store', 'admin', 'staff'), (req, res) => {
  const { driver_id, estimated_arrival } = req.body;
  
  if (!driver_id) {
    return res.status(400).json({ error: '司机ID不能为空' });
  }
  
  const driver = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'driver'").get(driver_id);
  if (!driver) {
    return res.status(404).json({ error: '司机不存在' });
  }
  
  db.prepare(`
    UPDATE transport_tasks SET driver_id = ?, estimated_arrival = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(driver_id, estimated_arrival, req.params.id);
  
  const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: task });
});

router.put('/:id/start', authenticateToken, requireRole('driver', 'admin'), (req, res) => {
  const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (req.user.role === 'driver' && task.driver_id !== req.user.id) {
    return res.status(403).json({ error: '只能开始分配给自己的任务' });
  }
  
  if (task.status !== 'assigned' && task.status !== 'pending') {
    return res.status(400).json({ error: '此任务状态无法开始' });
  }
  
  if (task.task_type === 'pickup') {
    db.prepare(`
      UPDATE transport_tasks SET status = 'en_route_to_pickup', actual_pickup_time = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
  } else {
    db.prepare(`
      UPDATE transport_tasks SET status = 'en_route_to_delivery', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
  }
  
  const updated = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/arrive', authenticateToken, requireRole('driver', 'admin'), (req, res) => {
  const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (req.user.role === 'driver' && task.driver_id !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此任务' });
  }
  
  const { handover_photo, notes } = req.body;
  
  if (task.task_type === 'pickup') {
    db.prepare(`
      UPDATE transport_tasks SET status = 'picked_up', actual_pickup_time = CURRENT_TIMESTAMP,
      handover_photo = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(handover_photo, notes, req.params.id);
    
    db.prepare(`
      UPDATE appointments SET check_in_time = CURRENT_TIMESTAMP, status = 'in_service'
      WHERE id = ?
    `).run(task.appointment_id);
    
    const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(task.appointment_id);
    db.prepare(`
      INSERT INTO service_records (appointment_id, staff_id, service_start_time, status)
      VALUES (?, ?, CURRENT_TIMESTAMP, 'in_progress')
    `).run(task.appointment_id, apt.staff_id || req.user.id);
  } else {
    const scheduled = new Date(task.scheduled_time);
    const actual = new Date();
    const delayMinutes = Math.max(0, Math.floor((actual - scheduled) / (1000 * 60)));
    
    db.prepare(`
      UPDATE transport_tasks SET status = 'delivered', actual_delivery_time = CURRENT_TIMESTAMP,
      handover_photo = ?, notes = ?, delay_minutes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(handover_photo, notes, delayMinutes, req.params.id);
  }
  
  const updated = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/delay', authenticateToken, requireRole('driver', 'admin', 'staff'), (req, res) => {
  const { delay_reason, delay_minutes, estimated_arrival } = req.body;
  
  if (!delay_reason || !delay_minutes) {
    return res.status(400).json({ error: '延迟原因和延迟时间不能为空' });
  }
  
  db.prepare(`
    UPDATE transport_tasks SET status = 'delayed', delay_reason = ?, delay_minutes = delay_minutes + ?,
    estimated_arrival = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(delay_reason, delay_minutes, estimated_arrival, req.params.id);
  
  const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: task });
});

router.put('/:id/complete', authenticateToken, requireRole('driver', 'admin'), (req, res) => {
  const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (req.user.role === 'driver' && task.driver_id !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此任务' });
  }
  
  db.prepare(`
    UPDATE transport_tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const updated = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

module.exports = router;
