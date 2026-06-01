const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, ss.school_name, ss.major, ss.deadline, u.name as student_name
    FROM applications a
    JOIN school_schemes ss ON a.scheme_id = ss.id
    JOIN student_profiles sp ON ss.student_id = sp.id
    JOIN users u ON sp.user_id = u.id
    ORDER BY a.updated_at DESC
  `).all();
  res.json(rows);
});

router.get('/scheme/:schemeId', authenticateToken, (req, res) => {
  const row = db.prepare('SELECT * FROM applications WHERE scheme_id = ?').get(req.params.schemeId);
  res.json(row || null);
});

router.post('/', authenticateToken, (req, res) => {
  const { scheme_id, account, submitted_at, application_fee, supplement_items, interview_date, interview_result, scholarship_amount, notes } = req.body;
  
  try {
    if (!scheme_id) {
      return res.status(400).json({ error: '请选择选校方案' });
    }
    
    const scheme = db.prepare('SELECT * FROM school_schemes WHERE id = ?').get(scheme_id);
    if (!scheme) {
      return res.status(404).json({ error: '选校方案不存在' });
    }
    
    const existing = db.prepare('SELECT * FROM applications WHERE scheme_id = ?').get(scheme_id);
    if (existing) {
      return res.status(400).json({ error: '该选校方案已创建申请，请直接编辑现有申请' });
    }
    
    const result = db.prepare(`
      INSERT INTO applications (scheme_id, account, submitted_at, application_fee, supplement_items, interview_date, interview_result, admission_result, scholarship_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?, ?)
    `).run(scheme_id, account, submitted_at, application_fee, supplement_items, interview_date, interview_result, scholarship_amount, notes);
    
    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    console.error('创建申请失败:', error);
    res.status(500).json({ error: '创建失败: ' + error.message });
  }
});

router.put('/:id', authenticateToken, (req, res) => {
  const { account, submitted_at, application_fee, supplement_items, interview_date, interview_result, admission_result, admission_date, scholarship_amount, notes } = req.body;
  
  try {
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!application) {
      return res.status(404).json({ error: '申请记录不存在' });
    }
    
    db.prepare(`
      UPDATE applications 
      SET account = ?, submitted_at = ?, application_fee = ?, supplement_items = ?, 
          interview_date = ?, interview_result = ?, admission_result = ?, 
          admission_date = ?, scholarship_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(account, submitted_at, application_fee, supplement_items, interview_date, interview_result, admission_result, admission_date, scholarship_amount, notes, req.params.id);
    
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新申请失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  }
});

router.get('/dashboard/stats', authenticateToken, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as total FROM applications').get().total;
  const admitted = db.prepare('SELECT COUNT(*) as admitted FROM applications WHERE admission_result = "admitted"').get().admitted;
  const pending = db.prepare('SELECT COUNT(*) as pending FROM applications WHERE admission_result = "pending"').get().pending;
  const byResult = db.prepare('SELECT admission_result, COUNT(*) as count FROM applications GROUP BY admission_result').all();
  const upcomingDeadlines = db.prepare(`
    SELECT DATE(ss.deadline) as date, COUNT(*) as count
    FROM applications a
    JOIN school_schemes ss ON a.scheme_id = ss.id
    WHERE ss.deadline >= DATE('now')
    GROUP BY DATE(ss.deadline)
    ORDER BY ss.deadline ASC
    LIMIT 5
  `).all();
  
  res.json({ total, admitted, pending, byResult, upcomingDeadlines });
});

module.exports = router;
