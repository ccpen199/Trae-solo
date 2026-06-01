const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  const db = req.db;
  const { page = 1, pageSize = 20, category_id, category_name, keyword, status = 'active', sign_status, serialize_status } = req.query;
  
  let where = 'WHERE n.status = ?';
  let params = [status];
  
  if (category_id) {
    where += ' AND n.category_id = ?';
    params.push(category_id);
  }
  if (category_name) {
    where += ' AND c.name = ?';
    params.push(category_name);
  }
  if (keyword) {
    where += ' AND (n.title LIKE ? OR n.tags LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (sign_status) {
    where += ' AND n.sign_status = ?';
    params.push(sign_status);
  }
  if (serialize_status) {
    where += ' AND n.serialize_status = ?';
    params.push(serialize_status);
  }
  
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);
  
  const novels = db.prepare(`
    SELECT n.*, c.name as category_name, u.nickname as author_name, e.nickname as editor_name
    FROM novels n
    LEFT JOIN categories c ON n.category_id = c.id
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN users e ON n.editor_id = e.id
    ${where}
    ORDER BY n.id DESC LIMIT ? OFFSET ?
  `).all(...params);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM novels n LEFT JOIN categories c ON n.category_id = c.id ${where}`).get(...params.slice(0, -2)).count;
  
  res.json({ list: novels, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const db = req.db;
  const novel = db.prepare(`
    SELECT n.*, c.name as category_name, u.nickname as author_name, e.nickname as editor_name
    FROM novels n
    LEFT JOIN categories c ON n.category_id = c.id
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN users e ON n.editor_id = e.id
    WHERE n.id = ?
  `).get(req.params.id);
  
  if (!novel) {
    return res.status(404).json({ error: '小说不存在' });
  }
  
  db.prepare('UPDATE novels SET click_count = click_count + 1 WHERE id = ?').run(req.params.id);
  novel.click_count++;
  
  res.json(novel);
});

router.post('/', authMiddleware, roleMiddleware('author', 'admin'), (req, res) => {
  const db = req.db;
  const { title, category_id, tags, description, cover_image } = req.body;
  
  const result = db.prepare(`
    INSERT INTO novels (title, author_id, category_id, tags, description, cover_image)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, req.user.id, category_id, tags, description, cover_image);
  
  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', authMiddleware, (req, res) => {
  const db = req.db;
  const novel = db.prepare('SELECT * FROM novels WHERE id = ?').get(req.params.id);
  
  if (!novel) return res.status(404).json({ error: '小说不存在' });
  if (novel.author_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'editor') {
    return res.status(403).json({ error: '无权限修改' });
  }
  
  const { title, category_id, tags, description, cover_image, serialize_status } = req.body;
  db.prepare(`
    UPDATE novels SET title = ?, category_id = ?, tags = ?, description = ?, cover_image = ?, 
    serialize_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(title, category_id, tags, description, cover_image, serialize_status, req.params.id);
  
  res.json({ message: '更新成功' });
});

router.get('/author/my', authMiddleware, roleMiddleware('author', 'admin'), (req, res) => {
  const db = req.db;
  const novels = db.prepare(`
    SELECT n.*, c.name as category_name
    FROM novels n LEFT JOIN categories c ON n.category_id = c.id
    WHERE n.author_id = ? ORDER BY n.id DESC
  `).all(req.user.id);
  res.json(novels);
});

module.exports = router;
