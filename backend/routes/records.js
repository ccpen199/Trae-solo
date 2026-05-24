const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { appointment_id, staff_id, status } = req.query;
  let sql = `
    SELECT sr.*, a.order_no, p.name as pet_name, s.name as service_name,
           u.name as staff_name, u2.name as owner_name
    FROM service_records sr
    LEFT JOIN appointments a ON sr.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN users u ON sr.staff_id = u.id
    LEFT JOIN users u2 ON a.owner_id = u2.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'staff') {
    sql += ' AND sr.staff_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'owner') {
    sql += ' AND a.owner_id = ?';
    params.push(req.user.id);
  }
  
  if (appointment_id) {
    sql += ' AND sr.appointment_id = ?';
    params.push(appointment_id);
  }
  if (staff_id) {
    sql += ' AND sr.staff_id = ?';
    params.push(staff_id);
  }
  if (status) {
    sql += ' AND sr.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY sr.created_at DESC';
  const records = db.prepare(sql).all(...params);
  
  for (const record of records) {
    record.photos = db.prepare('SELECT * FROM service_photos WHERE record_id = ? ORDER BY created_at').all(record.id);
    record.consumables = db.prepare(`
      SELECT sc.*, c.name as consumable_name, c.unit 
      FROM service_consumables sc 
      LEFT JOIN consumables c ON sc.consumable_id = c.id 
      WHERE sc.record_id = ?
    `).all(record.id);
  }
  
  res.json(records);
});

router.get('/:id', authenticateToken, (req, res) => {
  const record = db.prepare(`
    SELECT sr.*, a.order_no, a.appointment_date, p.*, s.name as service_name, s.category as service_category,
           u.name as staff_name, u2.name as owner_name, u2.phone as owner_phone
    FROM service_records sr
    LEFT JOIN appointments a ON sr.appointment_id = a.id
    LEFT JOIN pets p ON a.pet_id = p.id
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN users u ON sr.staff_id = u.id
    LEFT JOIN users u2 ON a.owner_id = u2.id
    WHERE sr.id = ?
  `).get(req.params.id);
  
  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }
  
  const photos = db.prepare('SELECT * FROM service_photos WHERE record_id = ? ORDER BY created_at').all(req.params.id);
  const consumables = db.prepare(`
    SELECT sc.*, c.name as consumable_name, c.unit 
    FROM service_consumables sc 
    LEFT JOIN consumables c ON sc.consumable_id = c.id 
    WHERE sc.record_id = ?
  `).all(req.params.id);
  
  res.json({ record, photos, consumables });
});

router.put('/:id', authenticateToken, requireRole('staff', 'store', 'admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }
  
  if (req.user.role === 'staff' && record.staff_id !== req.user.id) {
    return res.status(403).json({ error: '只能编辑自己的服务记录' });
  }
  
  const { wash_steps, groom_style, abnormal_findings, stress_reaction, stress_details, notes } = req.body;
  
  db.prepare(`
    UPDATE service_records SET wash_steps = ?, groom_style = ?, abnormal_findings = ?, 
    stress_reaction = ?, stress_details = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(wash_steps, groom_style, abnormal_findings, stress_reaction ? 1 : 0, stress_details, notes, req.params.id);
  
  const updated = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.post('/:id/photos', authenticateToken, requireRole('staff', 'store', 'admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }
  
  const { photo_type, photo_url, description } = req.body;
  
  if (!photo_type || !photo_url) {
    return res.status(400).json({ error: '照片类型和URL不能为空' });
  }
  
  const info = db.prepare(`
    INSERT INTO service_photos (record_id, appointment_id, photo_type, photo_url, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, record.appointment_id, photo_type, photo_url, description);
  
  const photo = db.prepare('SELECT * FROM service_photos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ success: true, data: photo });
});

router.post('/:id/consumables', authenticateToken, requireRole('staff', 'store', 'admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '服务记录不存在' });
  }
  
  const { consumable_id, quantity_used } = req.body;
  
  if (!consumable_id || !quantity_used) {
    return res.status(400).json({ error: '耗材ID和使用量不能为空' });
  }
  
  const consumable = db.prepare('SELECT * FROM consumables WHERE id = ?').get(consumable_id);
  if (!consumable) {
    return res.status(404).json({ error: '耗材不存在' });
  }
  
  if (consumable.stock_quantity < quantity_used) {
    return res.status(400).json({ error: '库存不足' });
  }
  
  const tx = db.transaction(() => {
    const totalCost = quantity_used * consumable.unit_cost;
    
    const info = db.prepare(`
      INSERT INTO service_consumables (record_id, consumable_id, quantity_used, unit_cost, total_cost)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, consumable_id, quantity_used, consumable.unit_cost, totalCost);
    
    db.prepare('UPDATE consumables SET stock_quantity = stock_quantity - ? WHERE id = ?').run(quantity_used, consumable_id);
    
    db.prepare(`
      UPDATE fee_orders SET consumable_fee = consumable_fee + ?, total_amount = total_amount + ?
      WHERE appointment_id = ?
    `).run(totalCost, totalCost, record.appointment_id);
    
    return info.lastInsertRowid;
  });
  
  try {
    const id = tx();
    const sc = db.prepare(`
      SELECT sc.*, c.name as consumable_name, c.unit 
      FROM service_consumables sc 
      LEFT JOIN consumables c ON sc.consumable_id = c.id 
      WHERE sc.id = ?
    `).get(id);
    res.status(201).json({ success: true, data: sc });
  } catch (err) {
    res.status(500).json({ error: '记录耗材失败: ' + err.message });
  }
});

router.delete('/:id/photos/:pid', authenticateToken, requireRole('staff', 'store', 'admin'), (req, res) => {
  db.prepare('DELETE FROM service_photos WHERE id = ? AND record_id = ?').run(req.params.pid, req.params.id);
  res.json({ success: true, message: '照片已删除' });
});

module.exports = router;
