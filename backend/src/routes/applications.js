const express = require('express');
const { getDb } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { status } = req.query;
  const db = getDb();
  
  let sql = 'SELECT * FROM applications WHERE user_id = ?';
  const params = [req.user.id];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const applications = db.prepare(sql).all(...params);
  res.json(applications);
});

router.post('/', authMiddleware, (req, res) => {
  const { serviceId, formData, materials } = req.body;
  const db = getDb();
  
  const service = db.prepare('SELECT * FROM service_items WHERE id = ?').get(serviceId);
  
  if (!service) {
    return res.status(404).json({ error: '服务不存在' });
  }
  
  const applicationNo = `BZ${Date.now()}${Math.random().toString().substring(2, 6)}`;
  
  const result = db.prepare(`
    INSERT INTO applications (user_id, service_id, service_name, application_no, form_data, materials, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, 
    serviceId, 
    service.name, 
    applicationNo,
    JSON.stringify(formData || {}),
    JSON.stringify(materials || []),
    'submitted'
  );

  const steps = [
    { stepNo: 1, stepName: '提交申请', status: 'completed', handleTime: new Date().toISOString() },
    { stepNo: 2, stepName: '材料审核', status: 'pending' },
    { stepNo: 3, stepName: '业务办理', status: 'pending' },
    { stepNo: 4, stepName: '办结', status: 'pending' }
  ];

  const insertStep = db.prepare(`
    INSERT INTO application_steps (application_id, step_no, step_name, status, handle_time)
    VALUES (?, ?, ?, ?, ?)
  `);

  steps.forEach(step => {
    insertStep.run(result.lastInsertRowid, step.stepNo, step.stepName, step.status, step.handleTime || null);
  });

  res.json({
    id: result.lastInsertRowid,
    applicationNo,
    serviceName: service.name
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const application = db.prepare(`
    SELECT * FROM applications 
    WHERE id = ? AND user_id = ?
  `).get(req.params.id, req.user.id);
  
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  const steps = db.prepare(`
    SELECT * FROM application_steps 
    WHERE application_id = ? 
    ORDER BY step_no ASC
  `).all(req.params.id);
  
  res.json({ ...application, steps });
});

router.post('/:id/rating', authMiddleware, (req, res) => {
  const { rating, feedback } = req.body;
  const db = getDb();
  
  db.prepare(`
    UPDATE applications 
    SET rating = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(rating, feedback, req.params.id, req.user.id);
  
  res.json({ success: true });
});

module.exports = router;
