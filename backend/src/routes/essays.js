const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/scheme/:schemeId', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM essays WHERE scheme_id = ?').all(req.params.schemeId);
  res.json(rows);
});

router.post('/', authenticateToken, (req, res) => {
  const { scheme_id, title, word_limit } = req.body;
  
  const result = db.prepare('INSERT INTO essays (scheme_id, title, word_limit) VALUES (?, ?, ?)')
    .run(scheme_id, title, word_limit);
  
  db.prepare('INSERT INTO essay_versions (essay_id, version_number, submitted_by) VALUES (?, 1, ?)')
    .run(result.lastInsertRowid, req.user.id);
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.get('/:id/versions', authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT ev.*, u.name as submitter_name
    FROM essay_versions ev
    LEFT JOIN users u ON ev.submitted_by = u.id
    WHERE essay_id = ?
    ORDER BY version_number DESC
  `).all(req.params.id);
  res.json(rows);
});

router.post('/:id/versions', authenticateToken, (req, res) => {
  const { content, comments } = req.body;
  const essayId = req.params.id;
  
  const maxVersion = db.prepare('SELECT MAX(version_number) as max_version FROM essay_versions WHERE essay_id = ?')
    .get(essayId);
  const newVersion = (maxVersion.max_version || 0) + 1;
  
  db.prepare('INSERT INTO essay_versions (essay_id, version_number, content, comments, submitted_by) VALUES (?, ?, ?, ?, ?)')
    .run(essayId, newVersion, content, comments, req.user.id);
  
  db.prepare('UPDATE essays SET current_version = ?, status = "reviewing", updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newVersion, essayId);
  
  res.json({ version_number: newVersion, message: '版本提交成功' });
});

router.put('/:id/confirm', authenticateToken, (req, res) => {
  db.prepare('UPDATE essays SET status = "confirmed", confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(req.user.id, req.params.id);
  res.json({ message: '文书已确认' });
});

module.exports = router;
