const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT r.*, a.appointment_no, c.name as customer_name, c.phone,
           p.name as package_name, u.name as doctor_name
    FROM reports r
    JOIN appointments a ON r.appointment_id = a.id
    JOIN customers c ON a.customer_id = c.id
    JOIN packages p ON a.package_id = p.id
    LEFT JOIN users u ON r.doctor_id = u.id
    WHERE 1=1
  `;
  let params = [];
  
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY r.created_at DESC';
  const reports = db.prepare(query).all(...params);
  res.json(reports);
});

router.get('/appointment/:appointmentId', authenticateToken, (req, res) => {
  const report = db.prepare(`
    SELECT r.*, a.appointment_no, c.name as customer_name, c.phone, c.gender, c.age,
           p.name as package_name, u.name as doctor_name
    FROM reports r
    JOIN appointments a ON r.appointment_id = a.id
    JOIN customers c ON a.customer_id = c.id
    JOIN packages p ON a.package_id = p.id
    LEFT JOIN users u ON r.doctor_id = u.id
    WHERE r.appointment_id = ?
  `).get(req.params.appointmentId);
  
  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }
  
  const records = db.prepare(`
    SELECT cr.*, pi.name as item_name, pi.category, pi.reference_range, pi.unit, pi.is_key
    FROM checkup_records cr
    JOIN package_items pi ON cr.package_item_id = pi.id
    WHERE cr.appointment_id = ?
    ORDER BY pi.category, pi.id
  `).all(req.params.appointmentId);
  
  const history = db.prepare(`
    SELECT r.id, r.report_no, r.finalized_at, a.appointment_no, p.name as package_name
    FROM reports r
    JOIN appointments a ON r.appointment_id = a.id
    JOIN packages p ON a.package_id = p.id
    JOIN customers c ON a.customer_id = c.id
    WHERE c.id = (SELECT customer_id FROM appointments WHERE id = ?) 
      AND r.status = 'final' AND r.appointment_id != ?
    ORDER BY r.finalized_at DESC
    LIMIT 5
  `).all(req.params.appointmentId, req.params.appointmentId);
  
  const abnormalCount = records.filter(r => r.is_abnormal).length;
  
  res.json({ ...report, records, history, abnormal_count: abnormalCount });
});

router.get('/customer/:phone', authenticateToken, (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, a.appointment_no, c.name as customer_name,
           p.name as package_name
    FROM reports r
    JOIN appointments a ON r.appointment_id = a.id
    JOIN customers c ON a.customer_id = c.id
    JOIN packages p ON a.package_id = p.id
    WHERE c.phone = ? AND r.status = 'final'
    ORDER BY r.finalized_at DESC
  `).all(req.params.phone);
  
  res.json(reports);
});

router.post('/generate/:appointmentId', authenticateToken, requireRole('doctor', 'admin'), (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.appointmentId);
  
  if (!appointment) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const pendingRecords = db.prepare(`
    SELECT COUNT(*) as count 
    FROM checkup_records cr
    JOIN package_items pi ON cr.package_item_id = pi.id
    WHERE cr.appointment_id = ? AND cr.status != 'completed' AND pi.is_key = 1
  `).get(req.params.appointmentId);
  
  if (pendingRecords.count > 0) {
    return res.status(400).json({ error: '关键项目未完成，无法生成完整报告' });
  }
  
  const existingReport = db.prepare('SELECT * FROM reports WHERE appointment_id = ?').get(req.params.appointmentId);
  
  if (existingReport) {
    return res.status(400).json({ error: '报告已存在' });
  }
  
  const reportNo = 'R' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  db.prepare(`
    INSERT INTO reports (appointment_id, report_no, status, doctor_id, generated_at)
    VALUES (?, ?, 'draft', ?, CURRENT_TIMESTAMP)
  `).run(req.params.appointmentId, reportNo, req.user.id);
  
  res.json({ report_no: reportNo, message: '报告已生成' });
});

router.put('/:id', authenticateToken, requireRole('doctor', 'admin'), (req, res) => {
  const { overall_conclusion, recommendations } = req.body;
  
  db.prepare(`
    UPDATE reports 
    SET overall_conclusion = ?, recommendations = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(overall_conclusion, recommendations, req.params.id);
  
  res.json({ message: '报告已更新' });
});

router.post('/:id/submit', authenticateToken, requireRole('doctor', 'admin'), (req, res) => {
  db.prepare(`
    UPDATE reports 
    SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: '报告已提交审核' });
});

router.post('/:id/reject', authenticateToken, requireRole('admin'), (req, res) => {
  const { review_comment } = req.body;
  
  db.prepare(`
    UPDATE reports 
    SET status = 'rejected', reviewed_by = ?, review_comment = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, review_comment, req.params.id);
  
  res.json({ message: '报告已退回修改' });
});

router.post('/:id/approve', authenticateToken, requireRole('admin'), (req, res) => {
  db.prepare(`
    UPDATE reports 
    SET status = 'final', reviewed_by = ?, finalized_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, req.params.id);
  
  res.json({ message: '报告已审核通过' });
});

router.get('/alerts', authenticateToken, (req, res) => {
  const alerts = db.prepare(`
    SELECT aa.*, a.appointment_no, c.name as customer_name, pi.name as item_name
    FROM abnormal_alerts aa
    JOIN appointments a ON aa.appointment_id = a.id
    JOIN customers c ON a.customer_id = c.id
    JOIN package_items pi ON aa.checkup_record_id = pi.id
    ORDER BY aa.created_at DESC
    LIMIT 50
  `).all();
  
  res.json(alerts);
});

router.post('/alerts/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE abnormal_alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '已标记为已读' });
});

router.get('/dashboard/stats', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const todayAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments a
    JOIN time_slots ts ON a.time_slot_id = ts.id
    WHERE ts.date = ?
  `).get(today).count;
  
  const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status IN ('draft', 'pending_review')").get().count;
  
  const abnormalAlerts = db.prepare('SELECT COUNT(*) as count FROM abnormal_alerts WHERE is_read = 0').get().count;
  
  const revenue = db.prepare(`
    SELECT COALESCE(SUM(payment_amount), 0) as total 
    FROM appointments 
    WHERE payment_status = 'paid'
  `).get().total;
  
  res.json({
    today_appointments: todayAppointments,
    pending_reports: pendingReports,
    abnormal_alerts: abnormalAlerts,
    revenue: revenue
  });
});

module.exports = router;
