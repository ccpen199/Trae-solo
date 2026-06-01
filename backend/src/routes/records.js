const express = require('express');
const router = express.Router();
const db = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', (req, res) => {
  const { student_id, dimension_id, type, semester } = req.query;
  let sql = `
    SELECT r.*, s.name as student_name, s.student_no, d.name as dimension_name, u.name as creator_name
    FROM evaluation_records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN evaluation_dimensions d ON r.dimension_id = d.id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (student_id) {
    sql += ' AND r.student_id = ?';
    params.push(student_id);
  }
  if (dimension_id) {
    sql += ' AND r.dimension_id = ?';
    params.push(dimension_id);
  }
  if (type) {
    sql += ' AND r.type = ?';
    params.push(type);
  }
  if (semester) {
    sql += ' AND r.semester = ?';
    params.push(semester);
  }
  
  sql += ' ORDER BY r.created_at DESC';
  
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

router.get('/:id', (req, res) => {
  const record = db.prepare(`
    SELECT r.*, s.name as student_name, s.student_no, d.name as dimension_name, u.name as creator_name
    FROM evaluation_records r
    LEFT JOIN students s ON r.student_id = s.id
    LEFT JOIN evaluation_dimensions d ON r.dimension_id = d.id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE r.id = ?
  `).get(req.params.id);
  res.json(record);
});

router.post('/', (req, res) => {
  const { student_id, dimension_id, indicator_id, type, score, reason, comment, activity_proof, is_sensitive, semester } = req.body;
  const created_by = req.body.created_by || 1;
  const semesterValue = semester || '2024-2025-1';
  
  const stmt = db.prepare('INSERT INTO evaluation_records (student_id, dimension_id, indicator_id, type, score, reason, comment, activity_proof, is_sensitive, created_by, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(student_id, dimension_id, indicator_id, type, score, reason, comment, activity_proof, is_sensitive ? 1 : 0, created_by, semesterValue);
  res.json({ id: result.lastInsertRowid, student_id, type, score, reason });
});

router.put('/:id', (req, res) => {
  const { type, score, reason, comment, activity_proof, is_sensitive } = req.body;
  
  const stmt = db.prepare('UPDATE evaluation_records SET type = ?, score = ?, reason = ?, comment = ?, activity_proof = ?, is_sensitive = ? WHERE id = ?');
  const result = stmt.run(type, score, reason, comment, activity_proof, is_sensitive ? 1 : 0, req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM evaluation_records WHERE id = ?').run(req.params.id);
  res.json({ success: true, changes: result.changes });
});

router.get('/:id/attachments', (req, res) => {
  const attachments = db.prepare('SELECT * FROM record_attachments WHERE record_id = ?').all(req.params.id);
  res.json(attachments);
});

router.post('/:id/attachments', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  
  const record_id = req.params.id;
  const file_name = req.file.originalname;
  const file_path = req.file.filename;
  const file_size = req.file.size;
  const uploaded_by = req.body.uploaded_by || 1;
  
  const stmt = db.prepare('INSERT INTO record_attachments (record_id, file_name, file_path, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(record_id, file_name, file_path, file_size, uploaded_by);
  res.json({ id: result.lastInsertRowid, file_name, file_path, file_size });
});

module.exports = router;
