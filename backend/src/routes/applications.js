const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const JWT_SECRET = 'gd-gov-service-2024-secret-key';

function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

function generateApplicationNo() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  return 'APP' + dateStr + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

router.post('/', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: '请先登录' });
  }

  const { serviceItemId, serviceName, formData } = req.body;
  
  if (!serviceItemId || !serviceName) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const applicationNo = generateApplicationNo();
  const now = new Date().toISOString();
  const deadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO applications (
      application_no, user_id, service_item_id, service_name,
      form_data, submit_time, handling_deadline, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicationNo, userId, serviceItemId, serviceName,
    JSON.stringify(formData || {}), now, deadline, 'pending'
  );

  db.prepare(`
    INSERT INTO application_logs (application_id, action, operator, remark)
    VALUES (?, ?, ?, ?)
  `).run(result.lastInsertRowid, 'submit', '用户', '用户在线提交申请');

  db.prepare(`
    INSERT INTO trusted_evidence (user_id, evidence_type, evidence_hash, evidence_data)
    VALUES (?, ?, ?, ?)
  `).run(
    userId,
    'application_submit',
    require('crypto').createHash('sha256').update(applicationNo + now).digest('hex'),
    JSON.stringify({ applicationNo, serviceName, submittedAt: now })
  );

  res.json({
    success: true,
    applicationId: result.lastInsertRowid,
    applicationNo
  });
});

router.get('/my', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: '请先登录' });
  }

  const { status } = req.query;
  let sql = 'SELECT * FROM applications WHERE user_id = ?';
  const params = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const applications = db.prepare(sql).all(...params);
  res.json(applications);
});

router.get('/:id', (req, res) => {
  const userId = getUserId(req);
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  if (userId && application.user_id !== userId) {
    return res.status(403).json({ error: '无权查看此申请' });
  }

  const logs = db.prepare('SELECT * FROM application_logs WHERE application_id = ? ORDER BY created_at').all(req.params.id);
  
  res.json({
    ...application,
    formData: JSON.parse(application.form_data || '{}'),
    logs
  });
});

router.post('/:id/cancel', (req, res) => {
  const userId = getUserId(req);
  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  if (userId && application.user_id !== userId) {
    return res.status(403).json({ error: '无权操作此申请' });
  }

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  
  db.prepare(`
    INSERT INTO application_logs (application_id, action, operator, remark)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, 'cancel', '用户', '用户主动撤销申请');

  res.json({ success: true });
});

module.exports = router;
