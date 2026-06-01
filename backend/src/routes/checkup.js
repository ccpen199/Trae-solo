const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/appointment/:appointmentId', authenticateToken, (req, res) => {
  const records = db.prepare(`
    SELECT cr.*, pi.name as item_name, pi.category, pi.reference_range, pi.unit, pi.is_key
    FROM checkup_records cr
    JOIN package_items pi ON cr.package_item_id = pi.id
    WHERE cr.appointment_id = ?
    ORDER BY pi.category, pi.id
  `).all(req.params.appointmentId);
  
  res.json(records);
});

router.post('/:id/sample', authenticateToken, requireRole('lab', 'doctor', 'admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM checkup_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  if (record.status === 'skipped') {
    return res.status(400).json({ error: '该项目已跳过' });
  }
  
  db.prepare(`
    UPDATE checkup_records 
    SET status = 'sampled', sampled_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '采样成功' });
});

router.post('/:id/result', authenticateToken, requireRole('lab', 'doctor', 'admin'), (req, res) => {
  const { result, is_abnormal, doctor_comment } = req.body;
  
  const record = db.prepare('SELECT * FROM checkup_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  if (record.status === 'skipped') {
    return res.status(400).json({ error: '该项目已跳过' });
  }
  
  db.prepare(`
    UPDATE checkup_records 
    SET status = 'completed', result = ?, is_abnormal = ?, doctor_id = ?, doctor_comment = ?, completed_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(result, is_abnormal ? 1 : 0, req.user.id, doctor_comment, req.params.id);
  
  if (is_abnormal) {
    db.prepare(`
      INSERT INTO abnormal_alerts (appointment_id, checkup_record_id, alert_level, message)
      VALUES (?, ?, 'medium', ?)
    `).run(record.appointment_id, req.params.id, `检查结果异常: ${result}`);
  }
  
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(record.appointment_id);
  const pendingRecords = db.prepare(`
    SELECT COUNT(*) as count 
    FROM checkup_records cr
    JOIN package_items pi ON cr.package_item_id = pi.id
    WHERE cr.appointment_id = ? AND cr.status NOT IN ('completed', 'skipped') AND pi.is_key = 1
  `).get(record.appointment_id);
  
  if (pendingRecords.count === 0 && appointment.status === 'checked_in') {
    db.prepare(`
      UPDATE appointments 
      SET status = 'completed', completed_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(record.appointment_id);
  }
  
  res.json({ message: '结果已录入' });
});

router.post('/:id/skip', authenticateToken, requireRole('doctor', 'admin'), (req, res) => {
  const { reason } = req.body;
  
  const record = db.prepare('SELECT * FROM checkup_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  db.prepare(`
    UPDATE checkup_records 
    SET status = 'skipped', skip_reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reason, req.params.id);
  
  res.json({ message: '已标记为漏检' });
});

module.exports = router;
