const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', (req, res) => {
  const { status, customer_id } = req.query;
  let query = 'SELECT m.*, c.name as customer_name, c.customer_no FROM materials m LEFT JOIN customers c ON m.customer_id = c.id WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND m.status = ?';
    params.push(status);
  }
  if (customer_id) {
    query += ' AND m.customer_id = ?';
    params.push(customer_id);
  }
  
  query += ' ORDER BY m.submitted_at DESC';
  const materials = db.prepare(query).all(...params);
  res.json(materials);
});

router.post('/:id/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  
  db.prepare('UPDATE materials SET file_path = ?, status = ? WHERE id = ?')
    .run(req.file.filename, 'submitted', req.params.id);
  
  res.json({ success: true, filename: req.file.filename });
});

router.put('/:id/audit', (req, res) => {
  const { status, audit_remark } = req.body;
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  
  if (!material) return res.status(404).json({ error: '材料不存在' });
  
  db.prepare('UPDATE materials SET status = ?, audit_remark = ?, audit_by = ?, audit_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, audit_remark, 1, req.params.id);
  
  if (status === 'rejected') {
    db.prepare('INSERT INTO todo_items (customer_id, type, title, description) VALUES (?, ?, ?, ?)')
      .run(material.customer_id, 'material', '材料补正', `${material.material_name}审核不通过: ${audit_remark}`);
  }
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
