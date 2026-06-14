const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/logs', auth, (req, res) => {
  const { project_id, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (req.user.role === 'manager') {
    where.push('cl.manager_id = ?');
    params.push(req.user.id);
  }
  if (project_id) { where.push('cl.project_id = ?'); params.push(project_id); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT cl.*, p.title as project_title, u.name as manager_name
    FROM construction_logs cl
    LEFT JOIN projects p ON cl.project_id = p.id
    LEFT JOIN users u ON cl.manager_id = u.id
    ${whereClause}
    ORDER BY cl.log_date DESC, cl.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM construction_logs cl ${whereClause}`).get(...params).count;
  
  const listWithPhotos = list.map(log => {
    const photos = db.prepare('SELECT * FROM log_photos WHERE log_id = ?').all(log.id);
    return { ...log, photos };
  });
  
  res.json({ code: 200, data: { list: listWithPhotos, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.post('/logs', auth, upload.array('photos', 9), (req, res) => {
  const { project_id, log_date, weather, temperature, content, voice_note_url, voice_duration, worker_count, work_content, problem, solution } = req.body;
  
  const result = db.prepare(`
    INSERT INTO construction_logs (project_id, manager_id, log_date, weather, temperature, content, voice_note_url, voice_duration, worker_count, work_content, problem, solution)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project_id, req.user.id, log_date, weather, temperature, content,
    voice_note_url, voice_duration, worker_count, work_content, problem, solution
  );
  
  const logId = result.lastInsertRowid;
  
  if (req.files && req.files.length > 0) {
    const insertPhoto = db.prepare(`
      INSERT INTO log_photos (log_id, photo_url, watermark, gps_lat, gps_lng, taken_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    req.files.forEach((file, index) => {
      const watermark = `${log_date} ${req.user.name} 项目经理`;
      insertPhoto.run(logId, `/uploads/${file.filename}`, watermark, null, null);
    });
  }
  
  res.json({ code: 200, message: '日志提交成功', data: { id: logId } });
});

router.get('/acceptance', auth, (req, res) => {
  const { project_id, status } = req.query;
  
  let where = [];
  let params = [];
  
  if (project_id) { where.push('project_id = ?'); params.push(project_id); }
  if (status) { where.push('status = ?'); params.push(status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT ar.*, p.title as project_title, u.name as checker_name
    FROM acceptance_records ar
    LEFT JOIN projects p ON ar.project_id = p.id
    LEFT JOIN users u ON ar.checker_id = u.id
    ${whereClause}
    ORDER BY ar.check_date DESC
  `).all(...params);
  
  const listWithItems = list.map(record => {
    const items = db.prepare('SELECT * FROM acceptance_items WHERE acceptance_id = ?').all(record.id);
    return { ...record, items };
  });
  
  res.json({ code: 200, data: listWithItems });
});

router.post('/acceptance', auth, (req, res) => {
  const { project_id, stage, task_id, gps_lat, gps_lng, gps_fence_radius, is_in_fence, overall_result, remark, items } = req.body;
  
  const result = db.prepare(`
    INSERT INTO acceptance_records (project_id, stage, task_id, checker_id, check_date, gps_lat, gps_lng, gps_fence_radius, is_in_fence, status, overall_result, remark)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, 'completed', ?, ?)
  `).run(project_id, stage, task_id, req.user.id, gps_lat, gps_lng, gps_fence_radius, is_in_fence, overall_result, remark);
  
  const acceptanceId = result.lastInsertRowid;
  
  if (items && items.length > 0) {
    const insertItem = db.prepare(`
      INSERT INTO acceptance_items (acceptance_id, item_name, check_content, standard, is_passed, remark, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    items.forEach(item => {
      insertItem.run(acceptanceId, item.item_name, item.check_content, item.standard, item.is_passed, item.remark, item.photo_url);
    });
  }
  
  res.json({ code: 200, message: '验收已提交', data: { id: acceptanceId } });
});

router.get('/funds', auth, (req, res) => {
  const { project_id } = req.query;
  
  let where = [];
  let params = [];
  
  if (req.user.role === 'owner') {
    where.push('f.project_id IN (SELECT id FROM projects WHERE owner_id = ?)');
    params.push(req.user.id);
  }
  if (project_id) { where.push('f.project_id = ?'); params.push(project_id); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT f.*, p.title as project_title
    FROM fund_supervision f
    LEFT JOIN projects p ON f.project_id = p.id
    ${whereClause}
    ORDER BY f.id
  `).all(...params);
  
  res.json({ code: 200, data: list });
});

router.post('/funds/:id/release', auth, (req, res) => {
  const { id } = req.params;
  
  db.prepare(`
    UPDATE fund_supervision SET status = 'released', released_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(id);
  
  res.json({ code: 200, message: '款项已释放' });
});

router.get('/disputes', auth, (req, res) => {
  const { project_id, status } = req.query;
  
  let where = [];
  let params = [];
  
  if (req.user.role === 'owner') {
    where.push('complainant_id = ?');
    params.push(req.user.id);
  }
  if (project_id) { where.push('project_id = ?'); params.push(project_id); }
  if (status) { where.push('status = ?'); params.push(status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT d.*, p.title as project_title, u1.name as complainant_name, u2.name as arbitrator_name
    FROM disputes d
    LEFT JOIN projects p ON d.project_id = p.id
    LEFT JOIN users u1 ON d.complainant_id = u1.id
    LEFT JOIN users u2 ON d.arbitrator_id = u2.id
    ${whereClause}
    ORDER BY d.created_at DESC
  `).all(...params);
  
  res.json({ code: 200, data: list });
});

router.post('/disputes', auth, (req, res) => {
  const { project_id, respondent_id, type, title, description, evidence } = req.body;
  
  const result = db.prepare(`
    INSERT INTO disputes (project_id, complainant_id, respondent_id, type, title, description, evidence, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).run(project_id, req.user.id, respondent_id, type, title, description, evidence);
  
  res.json({ code: 200, message: '纠纷已提交', data: { id: result.lastInsertRowid } });
});

module.exports = router;
