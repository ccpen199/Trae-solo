const express = require('express');
const crypto = require('crypto');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { app_id, status } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (app_id) {
    whereClause += ' AND v.app_id = ?';
    params.push(app_id);
  }
  if (status) {
    whereClause += ' AND v.status = ?';
    params.push(status);
  }

  const versions = db.prepare(`
    SELECT v.*, a.app_name, creator.name as creator_name, approver.name as approver_name
    FROM migration_versions v
    LEFT JOIN applications a ON v.app_id = a.id
    LEFT JOIN users creator ON v.created_by = creator.id
    LEFT JOIN users approver ON v.approved_by = approver.id
    ${whereClause}
    ORDER BY v.created_at DESC
  `).all(...params);

  res.json(versions);
});

router.post('/', (req, res) => {
  const { app_id, version, description, script_content } = req.body;

  const script_hash = crypto.createHash('sha256').update(script_content).digest('hex');

  try {
    const result = db.prepare(`
      INSERT INTO migration_versions (app_id, version, description, script_content, script_hash, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(app_id, version, description || '', script_content, script_hash, req.user.id);

    db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
      .run(req.user.id, 'create_version', 'versions', JSON.stringify({ app_id, version }));

    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '该应用下版本号已存在' });
    }
    throw error;
  }
});

router.post('/:id/approve', (req, res) => {
  const versionId = req.params.id;

  db.prepare(`
    UPDATE migration_versions 
    SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, versionId);

  res.json({ message: '审核通过' });
});

module.exports = router;
