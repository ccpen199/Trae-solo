const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'patrol-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use(authenticateToken);

router.post('/scan', async (req, res) => {
  const { plan_id, checkpoint_id, qr_code, scan_time, latitude, longitude, location_accuracy, is_offline, check_results, photos } = req.body;

  if (!checkpoint_id && !qr_code) {
    return res.status(400).json({ error: '点位ID或二维码不能为空' });
  }

  let checkpoint;
  if (qr_code) {
    checkpoint = db.prepare('SELECT * FROM checkpoints WHERE qr_code = ?').get(qr_code);
  } else {
    checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(checkpoint_id);
  }

  if (!checkpoint) {
    return res.status(404).json({ error: '点位不存在' });
  }

  let status = 'normal';
  const plan = plan_id ? db.prepare('SELECT * FROM patrol_plans WHERE id = ?').get(plan_id) : null;
  
  if (plan) {
    const scanTime = new Date(scan_time || Date.now());
    const scanHour = scanTime.getHours() + scanTime.getMinutes() / 60;
    const [startHour, startMin] = plan.time_window_start.split(':').map(Number);
    const [endHour, endMin] = plan.time_window_end.split(':').map(Number);
    const windowStart = startHour + startMin / 60;
    const windowEnd = endHour + endMin / 60;

    if (scanHour > windowEnd) {
      status = 'late';
      db.prepare(`
        INSERT INTO alerts (type, related_id, message)
        VALUES ('late_patrol', ?, ?)
      `).run(plan.id, `巡更计划"${plan.name}"点位"${checkpoint.name}"迟巡`);
    }
  }

  const result = db.prepare(`
    INSERT INTO patrol_records (plan_id, checkpoint_id, user_id, scan_time, actual_time, latitude, longitude, location_accuracy, is_offline, status)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
  `).run(
    plan_id || null,
    checkpoint.id,
    req.user.id,
    scan_time || new Date().toISOString(),
    latitude || null,
    longitude || null,
    location_accuracy || null,
    is_offline ? 1 : 0,
    status
  );

  const recordId = result.lastInsertRowid;

  if (check_results && check_results.length > 0) {
    const insertResult = db.prepare(`
      INSERT INTO check_results (patrol_record_id, check_item_id, result, is_abnormal)
      VALUES (?, ?, ?, ?)
    `);
    check_results.forEach(r => {
      insertResult.run(recordId, r.check_item_id, r.result, r.is_abnormal ? 1 : 0);
    });
  }

  const record = db.prepare(`
    SELECT pr.*, c.name as checkpoint_name, c.qr_code, b.name as building_name, u.name as user_name
    FROM patrol_records pr
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    LEFT JOIN users u ON pr.user_id = u.id
    WHERE pr.id = ?
  `).get(recordId);

  record.check_results = db.prepare('SELECT * FROM check_results WHERE patrol_record_id = ?').all(recordId);

  res.status(201).json(record);
});

router.post('/photo', upload.single('photo'), (req, res) => {
  const { patrol_record_id, description } = req.body;

  if (!patrol_record_id) {
    return res.status(400).json({ error: '巡更记录ID不能为空' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '未上传照片' });
  }

  const result = db.prepare(`
    INSERT INTO photos (patrol_record_id, file_path, description)
    VALUES (?, ?, ?)
  `).run(patrol_record_id, req.file.filename, description || '');

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(photo);
});

router.get('/records', (req, res) => {
  const { user_id, plan_id, checkpoint_id, start_date, end_date, status } = req.query;

  let sql = `
    SELECT pr.*, c.name as checkpoint_name, c.qr_code, b.name as building_name, 
           b.area, u.name as user_name, p.name as plan_name
    FROM patrol_records pr
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN patrol_plans p ON pr.plan_id = p.id
  `;

  const params = [];
  const conditions = [];

  if (user_id) {
    conditions.push('pr.user_id = ?');
    params.push(user_id);
  }
  if (plan_id) {
    conditions.push('pr.plan_id = ?');
    params.push(plan_id);
  }
  if (checkpoint_id) {
    conditions.push('pr.checkpoint_id = ?');
    params.push(checkpoint_id);
  }
  if (start_date) {
    conditions.push('DATE(pr.scan_time) >= DATE(?)');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('DATE(pr.scan_time) <= DATE(?)');
    params.push(end_date);
  }
  if (status) {
    conditions.push('pr.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY pr.scan_time DESC';

  const records = db.prepare(sql).all(...params);
  res.json(records);
});

router.get('/records/:id', (req, res) => {
  const record = db.prepare(`
    SELECT pr.*, c.name as checkpoint_name, c.qr_code, c.location as checkpoint_location,
           b.name as building_name, b.area, u.name as user_name, p.name as plan_name
    FROM patrol_records pr
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    LEFT JOIN users u ON pr.user_id = u.id
    LEFT JOIN patrol_plans p ON pr.plan_id = p.id
    WHERE pr.id = ?
  `).get(req.params.id);

  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  record.check_results = db.prepare(`
    SELECT cr.*, ci.name as check_item_name
    FROM check_results cr
    LEFT JOIN check_items ci ON cr.check_item_id = ci.id
    WHERE cr.patrol_record_id = ?
  `).all(req.params.id);

  record.photos = db.prepare('SELECT * FROM photos WHERE patrol_record_id = ?').all(req.params.id);

  record.work_orders = db.prepare(`
    SELECT wo.*, u.name as assigned_user_name
    FROM work_orders wo
    LEFT JOIN users u ON wo.assigned_user_id = u.id
    WHERE wo.patrol_record_id = ?
  `).all(req.params.id);

  res.json(record);
});

router.get('/my-records', (req, res) => {
  const { start_date, end_date } = req.query;

  let sql = `
    SELECT pr.*, c.name as checkpoint_name, b.name as building_name, p.name as plan_name
    FROM patrol_records pr
    LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    LEFT JOIN patrol_plans p ON pr.plan_id = p.id
    WHERE pr.user_id = ?
  `;

  const params = [req.user.id];

  if (start_date) {
    sql += ' AND DATE(pr.scan_time) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(pr.scan_time) <= DATE(?)';
    params.push(end_date);
  }

  sql += ' ORDER BY pr.scan_time DESC LIMIT 100';

  const records = db.prepare(sql).all(...params);
  res.json(records);
});

module.exports = router;
