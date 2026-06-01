const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  const { point_id, status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT rt.*, mp.name as point_name, mp.device_code, mp.responsible_unit,
           a.alert_type, a.description as alert_description
    FROM rectification_tasks rt
    LEFT JOIN monitoring_points mp ON rt.point_id = mp.id
    LEFT JOIN alerts a ON rt.alert_id = a.id
    WHERE 1=1
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM rectification_tasks WHERE 1=1';
  const params = [];
  const countParams = [];
  
  if (point_id) {
    query += ' AND rt.point_id = ?';
    countQuery += ' AND point_id = ?';
    params.push(point_id);
    countParams.push(point_id);
  }
  
  if (status) {
    query += ' AND rt.status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  
  query += ' ORDER BY rt.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const tasks = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data: tasks, total });
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT rt.*, mp.name as point_name, mp.device_code, mp.responsible_unit,
           a.alert_type, a.description as alert_description, a.parameter, a.value, a.threshold
    FROM rectification_tasks rt
    LEFT JOIN monitoring_points mp ON rt.point_id = mp.id
    LEFT JOIN alerts a ON rt.alert_id = a.id
    WHERE rt.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  res.json(task);
});

router.post('/', (req, res) => {
  const { alert_id, point_id } = req.body;
  
  const taskNo = 'RG' + Date.now().toString().slice(-8);
  
  try {
    const result = db.prepare(`
      INSERT INTO rectification_tasks (alert_id, point_id, task_no, status)
      VALUES (?, ?, ?, 'pending')
    `).run(alert_id, point_id, taskNo);
    
    db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run('processing', alert_id);
    
    res.json({ id: result.lastInsertRowid, task_no: taskNo, message: '整改任务创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { sprinkler_activated, work_stopped, measures } = req.body;
  
  const result = db.prepare(`
    UPDATE rectification_tasks 
    SET sprinkler_activated = ?, work_stopped = ?, measures = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(sprinkler_activated ? 1 : 0, work_stopped ? 1 : 0, measures, 'processing', req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (sprinkler_activated) {
    db.prepare(`
      INSERT INTO sprinkler_logs (point_id, task_id, action, remark)
      SELECT point_id, ?, 'activate', ?
      FROM rectification_tasks WHERE id = ?
    `).run(req.params.id, measures || '整改喷淋开启', req.params.id);
  }
  
  res.json({ message: '更新成功' });
});

router.post('/:id/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  
  const photoUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE rectification_tasks SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(photoUrl, req.params.id);
  
  res.json({ photo_url: photoUrl, message: '上传成功' });
});

router.post('/:id/review', (req, res) => {
  const { review_result, review_remark } = req.body;
  
  const result = db.prepare(`
    UPDATE rectification_tasks 
    SET review_result = ?, review_remark = ?, reviewed_at = CURRENT_TIMESTAMP, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(review_result, review_remark, review_result === 'pass' ? 'completed' : 'rejected', req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  if (review_result === 'pass') {
    db.prepare(`
      UPDATE alerts SET status = 'resolved' 
      WHERE id = (SELECT alert_id FROM rectification_tasks WHERE id = ?)
    `).run(req.params.id);
  }
  
  res.json({ message: '复核完成' });
});

module.exports = router;
