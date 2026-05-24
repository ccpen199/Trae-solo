const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateOrderNo } = require('../utils/validation');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, owner_id, store_id, complaint_type } = req.query;
  let sql = `
    SELECT c.*, a.order_no, p.name as pet_name, u.name as owner_name, 
           u2.name as store_name, u3.name as handler_name
    FROM complaints c
    LEFT JOIN appointments a ON c.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN users u ON c.owner_id = u.id
    LEFT JOIN users u2 ON c.store_id = u2.id
    LEFT JOIN users u3 ON c.handler_id = u3.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'owner') {
    sql += ' AND c.owner_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'store') {
    sql += ' AND c.store_id = ?';
    params.push(req.user.id);
  }
  
  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }
  if (owner_id) {
    sql += ' AND c.owner_id = ?';
    params.push(owner_id);
  }
  if (store_id) {
    sql += ' AND c.store_id = ?';
    params.push(store_id);
  }
  if (complaint_type) {
    sql += ' AND c.complaint_type = ?';
    params.push(complaint_type);
  }
  
  sql += ' ORDER BY c.created_at DESC';
  const complaints = db.prepare(sql).all(...params);
  
  res.json(complaints);
});

router.get('/:id', authenticateToken, (req, res) => {
  const complaint = db.prepare(`
    SELECT c.*, a.order_no, a.appointment_date, p.name as pet_name, 
           u.name as owner_name, u.phone as owner_phone, u2.name as store_name, 
           u3.name as handler_name
    FROM complaints c
    LEFT JOIN appointments a ON c.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN users u ON c.owner_id = u.id
    LEFT JOIN users u2 ON c.store_id = u2.id
    LEFT JOIN users u3 ON c.handler_id = u3.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!complaint) {
    return res.status(404).json({ error: '投诉不存在' });
  }
  
  if (req.user.role === 'owner' && complaint.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限访问此投诉' });
  }
  
  res.json(complaint);
});

router.post('/', authenticateToken, requireRole('owner', 'customer_service', 'admin'), (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user.id : req.body.owner_id;
  const { appointment_id, store_id, complaint_type, description, photos } = req.body;
  
  if (!ownerId || !complaint_type || !description) {
    return res.status(400).json({ error: '投诉人、类型和描述不能为空' });
  }
  
  const complaintNo = generateOrderNo('CMP');
  
  const info = db.prepare(`
    INSERT INTO complaints (complaint_no, appointment_id, owner_id, store_id, complaint_type, description, photos, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(complaintNo, appointment_id, ownerId, store_id, complaint_type, description, photos);
  
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: complaint });
});

router.put('/:id/handle', authenticateToken, requireRole('customer_service', 'admin', 'store'), (req, res) => {
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: '投诉不存在' });
  }
  
  if (complaint.status !== 'pending') {
    return res.status(400).json({ error: '此投诉已处理' });
  }
  
  const { handle_result, compensation_amount } = req.body;
  
  if (!handle_result) {
    return res.status(400).json({ error: '处理结果不能为空' });
  }
  
  db.prepare(`
    UPDATE complaints SET status = 'resolved', handler_id = ?, handle_result = ?, 
    compensation_amount = ?, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, handle_result, compensation_amount || 0, req.params.id);
  
  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/close', authenticateToken, requireRole('customer_service', 'admin'), (req, res) => {
  db.prepare(`
    UPDATE complaints SET status = 'closed', handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

module.exports = router;
