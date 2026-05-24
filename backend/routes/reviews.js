const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { store_id, staff_id, owner_id, is_repurchase } = req.query;
  let sql = `
    SELECT r.*, a.order_no, p.name as pet_name, s.name as service_name,
           u.name as owner_name, u2.name as staff_name, u3.name as store_name
    FROM reviews r
    LEFT JOIN appointments a ON r.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN users u ON r.owner_id = u.id
    LEFT JOIN users u2 ON r.staff_id = u2.id
    LEFT JOIN users u3 ON r.store_id = u3.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user && req.user.role === 'owner') {
    sql += ' AND r.owner_id = ?';
    params.push(req.user.id);
  }
  
  if (store_id) {
    sql += ' AND r.store_id = ?';
    params.push(store_id);
  }
  if (staff_id) {
    sql += ' AND r.staff_id = ?';
    params.push(staff_id);
  }
  if (owner_id) {
    sql += ' AND r.owner_id = ?';
    params.push(owner_id);
  }
  if (is_repurchase !== undefined) {
    sql += ' AND r.is_repurchase = ?';
    params.push(is_repurchase ? 1 : 0);
  }
  
  sql += ' ORDER BY r.created_at DESC';
  const reviews = db.prepare(sql).all(...params);
  
  res.json(reviews);
});

router.get('/:id', (req, res) => {
  const review = db.prepare(`
    SELECT r.*, a.order_no, a.appointment_date, p.name as pet_name, s.name as service_name,
           u.name as owner_name, u2.name as staff_name, u3.name as store_name
    FROM reviews r
    LEFT JOIN appointments a ON r.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN users u ON r.owner_id = u.id
    LEFT JOIN users u2 ON r.staff_id = u2.id
    LEFT JOIN users u3 ON r.store_id = u3.id
    WHERE r.id = ?
  `).get(req.params.id);
  
  if (!review) {
    return res.status(404).json({ error: '评价不存在' });
  }
  
  res.json(review);
});

router.post('/', authenticateToken, requireRole('owner'), (req, res) => {
  const { appointment_id, rating, content, photos } = req.body;
  
  if (!appointment_id || !rating) {
    return res.status(400).json({ error: '预约ID和评分不能为空' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }
  
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ? AND owner_id = ?').get(appointment_id, req.user.id);
  if (!apt) {
    return res.status(404).json({ error: '预约不存在或无权限评价' });
  }
  
  if (apt.status !== 'completed') {
    return res.status(400).json({ error: '只能评价已完成的服务' });
  }
  
  const existing = db.prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(appointment_id);
  if (existing) {
    return res.status(400).json({ error: '此预约已评价' });
  }
  
  const previousReview = db.prepare(`
    SELECT id FROM reviews 
    WHERE owner_id = ? AND store_id = ? AND id != ?
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id, apt.store_id, 0);
  
  const isRepurchase = !!previousReview;
  
  const info = db.prepare(`
    INSERT INTO reviews (appointment_id, owner_id, store_id, staff_id, rating, content, photos, is_repurchase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(appointment_id, req.user.id, apt.store_id, apt.staff_id, rating, content, photos, isRepurchase ? 1 : 0);
  
  if (isRepurchase) {
    db.prepare('UPDATE reviews SET repurchase_appointment_id = ? WHERE id = ?').run(appointment_id, previousReview.id);
  }
  
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: review });
});

router.post('/:id/repurchase', authenticateToken, requireRole('owner'), (req, res) => {
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) {
    return res.status(404).json({ error: '评价不存在' });
  }
  
  if (review.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限操作此评价' });
  }
  
  if (review.is_repurchase) {
    return res.status(400).json({ error: '此订单已标记为复购' });
  }
  
  db.prepare(`
    UPDATE reviews SET is_repurchase = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

module.exports = router;
