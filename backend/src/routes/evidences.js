import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
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
  const { assessment_id } = req.query;
  
  let query = 'SELECT * FROM evidences WHERE 1=1';
  const params = [];

  if (assessment_id) {
    query += ' AND assessment_id = ?';
    params.push(assessment_id);
  }

  query += ' ORDER BY uploaded_at DESC';

  const evidences = db.prepare(query).all(...params);
  res.json(evidences);
});

router.get('/:id', (req, res) => {
  const evidence = db.prepare('SELECT * FROM evidences WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ error: '证据不存在' });
  }
  res.json(evidence);
});

router.post('/', upload.single('file'), (req, res) => {
  const { assessment_id, question_id, type } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }

  const result = db.prepare(`
    INSERT INTO evidences (assessment_id, question_id, type, file_name, file_path, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(assessment_id, question_id || null, type, req.file.originalname, req.file.path);

  db.prepare(`
    UPDATE assessment_answers SET has_evidence = 1
    WHERE assessment_id = ? AND question_id = ?
  `).run(assessment_id, question_id);

  const evidence = db.prepare('SELECT * FROM evidences WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(evidence);
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;

  db.prepare(`
    UPDATE evidences SET status = ? WHERE id = ?
  `).run(status, req.params.id);

  const evidence = db.prepare('SELECT * FROM evidences WHERE id = ?').get(req.params.id);
  res.json(evidence);
});

router.delete('/:id', (req, res) => {
  const evidence = db.prepare('SELECT * FROM evidences WHERE id = ?').get(req.params.id);
  
  if (evidence && fs.existsSync(evidence.file_path)) {
    fs.unlinkSync(evidence.file_path);
  }

  db.prepare('DELETE FROM evidences WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

export default router;
