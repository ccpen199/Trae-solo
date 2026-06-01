const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/requirement/:requirementId', (req, res) => {
  const materials = db.prepare(`
    SELECT * FROM materials WHERE requirement_id = ? ORDER BY created_at
  `).all(req.params.requirementId);
  
  res.json(materials);
});

router.post('/:id/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) {
    return res.status(404).json({ error: '材料不存在' });
  }
  
  db.prepare(`
    UPDATE materials SET
      file_path = ?, status = 'pending_review', uploaded_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.file.filename, req.params.id);
  
  const updatedMaterial = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json(updatedMaterial);
});

router.put('/:id/review', (req, res) => {
  const { status, review_comment, reviewed_by } = req.body;
  
  db.prepare(`
    UPDATE materials SET
      status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, review_comment || null, reviewed_by || null, req.params.id);
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json(material);
});

router.put('/:id/confirm', (req, res) => {
  const { confirmed_by } = req.body;
  
  db.prepare(`
    UPDATE materials SET
      status = 'confirmed', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(confirmed_by || null, req.params.id);
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json(material);
});

router.post('/:id/signature', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) {
    return res.status(404).json({ error: '材料不存在' });
  }
  
  const newVersion = material.version + 1;
  
  db.prepare(`
    UPDATE materials SET version = ? WHERE id = ?
  `).run(newVersion, req.params.id);
  
  db.prepare(`
    INSERT INTO signature_documents (material_id, version, file_path)
    VALUES (?, ?, ?)
  `).run(req.params.id, newVersion, req.file.filename);
  
  const signatureDoc = db.prepare('SELECT * FROM signature_documents WHERE material_id = ? AND version = ?').get(req.params.id, newVersion);
  res.status(201).json(signatureDoc);
});

router.get('/:id/signatures', (req, res) => {
  const signatures = db.prepare(`
    SELECT * FROM signature_documents WHERE material_id = ? ORDER BY version DESC
  `).all(req.params.id);
  
  res.json(signatures);
});

module.exports = router;
