const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { logOperation, logException } = require('../middleware/audit');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  try {
    const { type, status } = req.query;
    let sql = 'SELECT * FROM materials WHERE 1=1';
    const params = [];
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    
    const materials = db.prepare(sql).all(...params);
    res.json({ success: true, data: materials });
  } catch (error) {
    logException(null, null, 'get_materials', req.query, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    const { title, type, content, uploaded_by } = req.body;
    const id = `mat_${uuidv4().slice(0, 8)}`;
    
    const file_path = req.file ? req.file.path : null;
    const file_name = req.file ? req.file.originalname : null;
    
    const stmt = db.prepare(`
      INSERT INTO materials (id, title, type, content, file_path, file_name, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, type, content, file_path, file_name, parseInt(uploaded_by) || 1);
    
    logOperation(parseInt(uploaded_by) || 1, 'upload_material', { materialId: id, title, type });
    
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    res.json({ success: true, data: material });
  } catch (error) {
    logException(null, null, 'upload_material', req.body, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, error: '材料不存在' });
    }
    res.json({ success: true, data: material });
  } catch (error) {
    logException(null, null, 'get_material', req.params, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
