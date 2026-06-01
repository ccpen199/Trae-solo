const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const screenshotsDir = path.join(__dirname, '../../data/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, screenshotsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const riskScoreRules = {
  'screen_switch': 15,
  'page_leave': 10,
  'network_disconnect': 5,
  'abnormal_submit': 20,
  'suspicious_behavior': 25,
  'camera_failure': 30,
  'late_entry': 10,
  'multiple_login': 20
};

router.post('/report', authenticateToken, upload.single('screenshot'), (req, res) => {
  const { exam_student_id, type, description } = req.body;

  const examStudent = db.prepare(`
    SELECT * FROM exam_students WHERE id = ?
  `).get(exam_student_id);

  if (!examStudent) {
    return res.status(404).json({ error: '考试记录不存在' });
  }

  const riskScore = riskScoreRules[type] || 0;
  const screenshotPath = req.file ? req.file.filename : null;

  db.prepare(`
    INSERT INTO anomalies (exam_student_id, type, description, screenshot_path, risk_score)
    VALUES (?, ?, ?, ?, ?)
  `).run(exam_student_id, type, description, screenshotPath, riskScore);

  const switchCount = db.prepare(`
    SELECT COUNT(*) as count FROM anomalies 
    WHERE exam_student_id = ? AND type = 'screen_switch'
  `).get(exam_student_id);

  const exam = db.prepare('SELECT max_screen_switches FROM exams WHERE id = ?').get(examStudent.exam_id);

  if (switchCount.count > exam.max_screen_switches) {
    db.prepare(`
      INSERT INTO anomalies (exam_student_id, type, description, risk_score)
      VALUES (?, ?, ?, ?)
    `).run(
      exam_student_id, 
      'suspicious_behavior', 
      `切屏次数超过限制: ${switchCount.count}/${exam.max_screen_switches}`,
      30
    );
  }

  res.json({ message: '异常记录成功' });
});

router.get('/', authenticateToken, requireRole('admin', 'invigilator'), (req, res) => {
  const { exam_id, handled, type } = req.query;
  
  let query = `
    SELECT a.*, es.student_id, u.name as student_name, e.title as exam_title,
      iu.name as handled_by_name
    FROM anomalies a
    JOIN exam_students es ON a.exam_student_id = es.id
    JOIN users u ON es.student_id = u.id
    JOIN exams e ON es.exam_id = e.id
    LEFT JOIN users iu ON a.handled_by = iu.id
    WHERE 1=1
  `;
  const params = [];

  if (exam_id) {
    query += ' AND es.exam_id = ?';
    params.push(exam_id);
  }

  if (handled !== undefined) {
    query += ' AND a.handled = ?';
    params.push(handled === 'true' ? 1 : 0);
  }

  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }

  query += ' ORDER BY a.created_at DESC';

  const anomalies = db.prepare(query).all(...params);
  res.json({ anomalies });
});

router.get('/student/:examStudentId', authenticateToken, (req, res) => {
  const examStudentId = req.params.examStudentId;
  
  const anomalies = db.prepare(`
    SELECT * FROM anomalies 
    WHERE exam_student_id = ?
    ORDER BY created_at DESC
  `).all(examStudentId);

  res.json({ anomalies });
});

router.put('/:id/handle', authenticateToken, requireRole('admin', 'invigilator'), (req, res) => {
  const { handle_note } = req.body;

  const anomaly = db.prepare('SELECT * FROM anomalies WHERE id = ?').get(req.params.id);
  
  if (!anomaly) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  db.prepare(`
    UPDATE anomalies 
    SET handled = 1, handled_by = ?, handle_note = ?
    WHERE id = ?
  `).run(req.user.id, handle_note, req.params.id);

  res.json({ message: '异常处理成功' });
});

router.get('/screenshots/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(screenshotsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: '截图不存在' });
  }
});

router.get('/stats/:examId', authenticateToken, requireRole('admin', 'invigilator'), (req, res) => {
  const examId = req.params.examId;

  const stats = db.prepare(`
    SELECT 
      type,
      COUNT(*) as count,
      SUM(CASE WHEN handled = 0 THEN 1 ELSE 0 END) as unhandled_count
    FROM anomalies a
    JOIN exam_students es ON a.exam_student_id = es.id
    WHERE es.exam_id = ?
    GROUP BY type
  `).all(examId);

  const totalRisk = db.prepare(`
    SELECT SUM(a.risk_score) as total_risk, es.student_id, u.name
    FROM anomalies a
    JOIN exam_students es ON a.exam_student_id = es.id
    JOIN users u ON es.student_id = u.id
    WHERE es.exam_id = ?
    GROUP BY es.id
    ORDER BY total_risk DESC
    LIMIT 10
  `).all(examId);

  res.json({ stats, topRiskStudents: totalRisk });
});

module.exports = router;
