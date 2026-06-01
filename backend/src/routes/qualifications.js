const express = require('express');

function createQualificationsRouter(db, auth, requirePermission) {
  const router = express.Router();

  router.get('/', auth, (req, res) => {
    try {
      const { type, status, page = 1, pageSize = 20 } = req.query;
      
      let whereClause = ['1=1'];
      let params = [];

      if (type) { whereClause.push('type = ?'); params.push(type); }
      if (status) { whereClause.push('status = ?'); params.push(status); }

      const offset = (page - 1) * pageSize;
      params.push(parseInt(pageSize), offset);

      const qualifications = db.prepare(`
        SELECT q.*, u.real_name as creator_name
        FROM qualifications q
        LEFT JOIN users u ON q.created_by = u.id
        WHERE ${whereClause.join(' AND ')}
        ORDER BY q.created_at DESC
        LIMIT ? OFFSET ?
      `).all(...params);

      const total = db.prepare(`
        SELECT COUNT(*) as count FROM qualifications WHERE ${whereClause.join(' AND ')}
      `).get(...params.slice(0, -2));

      res.json({ list: qualifications, total: total.count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', auth, (req, res) => {
    try {
      const qualification = db.prepare(`
        SELECT q.*, u.real_name as creator_name
        FROM qualifications q
        LEFT JOIN users u ON q.created_by = u.id
        WHERE q.id = ?
      `).get(req.params.id);

      if (!qualification) {
        return res.status(404).json({ error: '资质不存在' });
      }

      res.json(qualification);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', auth, (req, res) => {
    try {
      const { name, type, level, certificate_no, issuing_authority, issue_date, expiry_date } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: '名称和类型必填' });
      }

      const result = db.prepare(`
        INSERT INTO qualifications (name, type, level, certificate_no, issuing_authority, issue_date, expiry_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, type, level || null, certificate_no || null, issuing_authority || null, 
             issue_date || null, expiry_date || null, req.user.id);

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:id', auth, (req, res) => {
    try {
      const { name, type, level, certificate_no, issuing_authority, issue_date, expiry_date, status } = req.body;

      db.prepare(`
        UPDATE qualifications 
        SET name = ?, type = ?, level = ?, certificate_no = ?, issuing_authority = ?, 
            issue_date = ?, expiry_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, type, level || null, certificate_no || null, issuing_authority || null,
             issue_date || null, expiry_date || null, status || 'valid', req.params.id);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createQualificationsRouter;
