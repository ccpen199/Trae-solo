const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/novels', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const { page = 1, pageSize = 20, sign_status, audit_status } = req.query;
  
  let where = 'WHERE 1=1';
  let params = [];
  
  if (sign_status) {
    where += ' AND n.sign_status = ?';
    params.push(sign_status);
  }
  
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);
  
  const novels = db.prepare(`
    SELECT n.*, u.nickname as author_name, c.name as category_name,
           (SELECT COUNT(*) FROM chapters ch WHERE ch.novel_id = n.id AND ch.status = 'published') as published_chapters,
           (SELECT COUNT(*) FROM chapters ch WHERE ch.novel_id = n.id AND ch.audit_status = 'pending') as pending_chapters,
           MAX(ch.created_at) as last_update
    FROM novels n
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN categories c ON n.category_id = c.id
    LEFT JOIN chapters ch ON n.novel_id = ch.novel_id
    ${where}
    GROUP BY n.id
    ORDER BY n.id DESC LIMIT ? OFFSET ?
  `).all(...params);
  
  const total = db.prepare(`SELECT COUNT(DISTINCT n.id) as count FROM novels n ${where}`).get(...params.slice(0, -2)).count;
  
  res.json({ list: novels, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/pending-chapters', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const chapters = db.prepare(`
    SELECT c.*, n.title as novel_title, u.nickname as author_name
    FROM chapters c
    LEFT JOIN novels n ON c.novel_id = n.id
    LEFT JOIN users u ON n.author_id = u.id
    WHERE c.audit_status = 'pending' AND c.status = 'published'
    ORDER BY c.id DESC
  `).all();
  res.json(chapters);
});

router.put('/novel/:id/sign', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const { sign_status } = req.body;
  db.prepare('UPDATE novels SET sign_status = ?, editor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(sign_status, req.user.id, req.params.id);
  res.json({ message: '签约状态更新成功' });
});

router.get('/recommendations', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const recs = db.prepare(`
    SELECT r.*, n.title as novel_title, n.cover_image
    FROM recommendations r LEFT JOIN novels n ON r.novel_id = n.id
    ORDER BY r.position, r.id DESC
  `).all();
  res.json(recs);
});

router.post('/recommendation', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const { novel_id, position, start_time, end_time } = req.body;
  db.prepare(`
    INSERT INTO recommendations (novel_id, position, start_time, end_time)
    VALUES (?, ?, ?, ?)
  `).run(novel_id, position, start_time, end_time);
  res.json({ message: '推荐位添加成功' });
});

router.get('/violations', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const records = db.prepare(`
    SELECT v.*, n.title as novel_title, c.title as chapter_title, u.nickname as user_name, h.nickname as handler_name
    FROM violation_records v
    LEFT JOIN novels n ON v.novel_id = n.id
    LEFT JOIN chapters c ON v.chapter_id = c.id
    LEFT JOIN users u ON v.user_id = u.id
    LEFT JOIN users h ON v.handler_id = h.id
    ORDER BY v.id DESC
  `).all();
  res.json(records);
});

router.put('/violation/:id', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const { status, description } = req.body;
  db.prepare(`
    UPDATE violation_records SET status = ?, description = ?, handler_id = ? WHERE id = ?
  `).run(status, description, req.user.id, req.params.id);
  res.json({ message: '处理完成' });
});

router.get('/statistics', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const stats = {
    totalNovels: db.prepare('SELECT COUNT(*) as count FROM novels').get().count,
    totalAuthors: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('author').count,
    totalReaders: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('reader').count,
    pendingChapters: db.prepare('SELECT COUNT(*) as count FROM chapters WHERE audit_status = ?').get('pending').count,
    pendingSign: db.prepare('SELECT COUNT(*) as count FROM novels WHERE sign_status = ?').get('unsigned').count
  };
  res.json(stats);
});

module.exports = router;
