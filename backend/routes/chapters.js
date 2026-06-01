const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/novel/:novelId', (req, res) => {
  const db = req.db;
  const { novelId } = req.params;
  const { page = 1, pageSize = 50 } = req.query;
  
  const offset = (page - 1) * pageSize;
  const chapters = db.prepare(`
    SELECT id, novel_id, title, word_count, chapter_order, is_free, price, status, audit_status, publish_time
    FROM chapters WHERE novel_id = ? ORDER BY chapter_order ASC LIMIT ? OFFSET ?
  `).all(novelId, pageSize, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM chapters WHERE novel_id = ?').get(novelId).count;
  
  res.json({ list: chapters, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  
  if (!chapter) return res.status(404).json({ error: '章节不存在' });
  if (chapter.status !== 'published' && chapter.audit_status !== 'approved') {
    const novel = db.prepare('SELECT author_id, editor_id FROM novels WHERE id = ?').get(chapter.novel_id);
    if (!novel || (novel.author_id !== req.user.id && novel.editor_id !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ error: '章节未发布' });
    }
  }
  
  if (!chapter.is_free && chapter.status === 'published') {
    const sub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND chapter_id = ?').get(req.user.id, chapter.id);
    if (!sub && req.user.role !== 'admin' && req.user.role !== 'editor') {
      const novel = db.prepare('SELECT author_id FROM novels WHERE id = ?').get(chapter.novel_id);
      if (!novel || novel.author_id !== req.user.id) {
        return res.status(402).json({ error: '需要订阅', price: chapter.price });
      }
    }
  }
  
  res.json(chapter);
});

router.post('/', authMiddleware, roleMiddleware('author', 'admin'), (req, res) => {
  const db = req.db;
  const { novel_id, title, content, chapter_order, is_free, price, status } = req.body;
  
  const novel = db.prepare('SELECT author_id FROM novels WHERE id = ?').get(novel_id);
  if (!novel) return res.status(404).json({ error: '小说不存在' });
  if (novel.author_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限添加章节' });
  }
  
  const wordCount = content ? content.length : 0;
  const publishTime = status === 'published' ? new Date().toISOString() : null;
  const auditStatus = status === 'published' ? 'pending' : 'pending';
  
  const result = db.prepare(`
    INSERT INTO chapters (novel_id, title, content, word_count, chapter_order, is_free, price, status, publish_time, audit_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(novel_id, title, content, wordCount, chapter_order, is_free ? 1 : 0, price, status, publishTime, auditStatus);
  
  db.prepare('UPDATE novels SET chapter_count = chapter_count + 1, word_count = word_count + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(wordCount, novel_id);
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(req.params.id);
  
  if (!chapter) return res.status(404).json({ error: '章节不存在' });
  const novel = db.prepare('SELECT author_id, editor_id FROM novels WHERE id = ?').get(chapter.novel_id);
  if (!novel || (novel.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'editor')) {
    return res.status(403).json({ error: '无权限修改' });
  }
  
  const { title, content, is_free, price, status } = req.body;
  const wordCount = content ? content.length : chapter.word_count;
  
  db.prepare('INSERT INTO chapter_history (chapter_id, title, content, word_count, modified_by) VALUES (?, ?, ?, ?, ?)')
    .run(chapter.id, chapter.title, chapter.content, chapter.word_count, req.user.id);
  
  const publishTime = status === 'published' && chapter.status !== 'published' ? new Date().toISOString() : chapter.publish_time;
  
  db.prepare(`
    UPDATE chapters SET title = ?, content = ?, word_count = ?, is_free = ?, price = ?, status = ?, 
    publish_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(title, content, wordCount, is_free ? 1 : 0, price, status, publishTime, chapter.id);
  
  res.json({ message: '更新成功' });
});

router.get('/:id/history', authMiddleware, (req, res) => {
  const db = req.db;
  const chapter = db.prepare('SELECT id, novel_id FROM chapters WHERE id = ?').get(req.params.id);
  if (!chapter) return res.status(404).json({ error: '章节不存在' });
  
  const novel = db.prepare('SELECT author_id, editor_id FROM novels WHERE id = ?').get(chapter.novel_id);
  if (!novel || (novel.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'editor')) {
    return res.status(403).json({ error: '无权限查看' });
  }
  
  const history = db.prepare(`
    SELECT ch.*, u.nickname as modifier_name
    FROM chapter_history ch LEFT JOIN users u ON ch.modified_by = u.id
    WHERE ch.chapter_id = ? ORDER BY ch.id DESC
  `).all(req.params.id);
  
  res.json(history);
});

router.post('/:id/audit', authMiddleware, roleMiddleware('editor', 'admin'), (req, res) => {
  const db = req.db;
  const { audit_status, audit_remark } = req.body;
  
  db.prepare('UPDATE chapters SET audit_status = ?, audit_remark = ? WHERE id = ?')
    .run(audit_status, audit_remark, req.params.id);
  
  res.json({ message: '审核完成' });
});

module.exports = router;
