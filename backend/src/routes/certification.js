import express from 'express';
import db from '../database.js';
import crypto from 'crypto';

const router = express.Router();

function hashData(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

router.post('/ocr', (req, res) => {
  const { id_card, name } = req.body;
  
  const person = db.prepare('SELECT * FROM insured_persons WHERE id_card = ?').get(id_card);
  
  if (person) {
    db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
      .run('ocr_verify', 'certification', `ID: ${id_card}, Name: ${name}`);
    
    res.json({
      success: true,
      data: {
        id: person.id,
        id_card: person.id_card,
        name: person.name,
        gender: person.gender,
        birthday: person.birthday,
        region: person.region
      }
    });
  } else {
    res.json({ success: false, message: '未找到参保人信息' });
  }
});

router.post('/liveness', (req, res) => {
  const { person_id, liveness_data, location, device_info } = req.body;
  
  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
  if (!person) {
    return res.json({ success: false, message: '参保人不存在' });
  }

  const livenessSuccess = Math.random() > 0.1;
  
  const taskResult = db.prepare(`
    INSERT INTO certification_tasks 
    (insured_person_id, task_type, status, result, location, device_info, blockchain_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    person_id,
    'liveness',
    livenessSuccess ? 'success' : 'failed',
    livenessSuccess ? '活体检测通过' : '活体检测失败',
    location || '未知',
    device_info || '未知',
    livenessSuccess ? hashData({ person_id, time: Date.now() }) : null
  );

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('liveness_detection', 'certification', `Person: ${person_id}, Result: ${livenessSuccess}`);

  if (livenessSuccess) {
    const crossProvince = !person.region?.includes(location?.substring(0, 2));
    if (crossProvince && location) {
      db.prepare(`
        INSERT INTO abnormal_alerts (alert_type, insured_person_id, description, severity, location)
        VALUES (?, ?, ?, ?, ?)
      `).run('cross_province_cert', person_id, '异地认证预警', 'warning', location);
    }
  }

  res.json({
    success: livenessSuccess,
    task_id: taskResult.lastInsertRowid,
    message: livenessSuccess ? '活体检测通过' : '活体检测失败，请重试'
  });
});

router.post('/complete', (req, res) => {
  const { task_id } = req.body;
  
  const task = db.prepare('SELECT * FROM certification_tasks WHERE id = ?').get(task_id);
  if (!task) {
    return res.json({ success: false, message: '任务不存在' });
  }

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  db.prepare(`
    UPDATE certification_tasks 
    SET status = 'completed', valid_until = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(validUntil.toISOString(), task_id);

  db.prepare('INSERT INTO audit_logs (action, module, details) VALUES (?, ?, ?)')
    .run('certification_complete', 'certification', `Task: ${task_id}`);

  res.json({
    success: true,
    message: '认证完成',
    valid_until: validUntil.toISOString()
  });
});

router.get('/history/:person_id', (req, res) => {
  const { person_id } = req.params;
  
  const tasks = db.prepare(`
    SELECT * FROM certification_tasks 
    WHERE insured_person_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(person_id);

  res.json({ success: true, data: tasks });
});

router.get('/offline-package/:region', (req, res) => {
  const { region } = req.params;
  
  const pkg = db.prepare('SELECT * FROM offline_packages WHERE region_code = ? ORDER BY created_at DESC LIMIT 1')
    .get(region);

  res.json({
    success: true,
    data: pkg || { version: '1.0.0', checksum: 'mock_checksum_' + Date.now() }
  });
});

export default router;
