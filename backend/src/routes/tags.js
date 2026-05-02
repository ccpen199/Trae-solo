const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { PermissionRuleEngine, ROLES } = require('../engines/permissionRuleEngine');
const tagRuleEngine = require('../engines/tagRuleEngine');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { document_id, name } = req.query;
  let query = 'SELECT * FROM tags WHERE 1=1';
  const params = [];

  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }

  query += ' ORDER BY name';

  let tags = db.prepare(query).all(...params);

  if (document_id) {
    const docTags = tagRuleEngine.getDocumentTags(parseInt(document_id));
    const docTagIds = new Set(docTags.map(t => t.id));
    tags = tags.map(t => ({
      ...t,
      is_selected: docTagIds.has(t.id)
    }));
  }

  res.json({ tags });
});

router.get('/:id', authenticateToken, (req, res) => {
  const tagId = parseInt(req.params.id);
  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);

  if (!tag) {
    return res.status(404).json({ error: '标签不存在' });
  }

  const documents = db.prepare(`
    SELECT d.id, d.main_order_no, d.title, d.status, d.created_at
    FROM documents d
    JOIN document_tags dt ON d.id = dt.document_id
    WHERE dt.tag_id = ? AND d.is_deleted = 0
    ORDER BY d.created_at DESC
  `).all(tagId);

  res.json({ tag, documents });
});

router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '只有管理员或知识管理员可以创建标签' });
  }

  const { name, color, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '标签名称不能为空' });
  }

  const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name);
  if (existing) {
    return res.status(400).json({ error: '已存在同名标签' });
  }

  const result = db.prepare(`
    INSERT INTO tags (name, color, description, created_by)
    VALUES (?, ?, ?, ?)
  `).run(name, color || '#1890ff', description, req.user.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, new_value)
    VALUES (?, ?, 'tag_create', 'tag', ?, ?)
  `).run(req.user.id, req.user.name, result.lastInsertRowid, JSON.stringify({ name }));

  res.status(201).json({
    message: '标签创建成功',
    tagId: result.lastInsertRowid
  });
});

router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '只有管理员或知识管理员可以编辑标签' });
  }

  const tagId = parseInt(req.params.id);
  const { name, color, description } = req.body;

  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
  if (!tag) {
    return res.status(404).json({ error: '标签不存在' });
  }

  if (name && name !== tag.name) {
    const existing = db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?').get(name, tagId);
    if (existing) {
      return res.status(400).json({ error: '已存在同名标签' });
    }
  }

  const updateFields = [];
  const updateValues = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }
  if (color !== undefined) {
    updateFields.push('color = ?');
    updateValues.push(color);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }

  if (updateFields.length > 0) {
    updateValues.push(tagId);
    db.prepare(`UPDATE tags SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id)
    VALUES (?, ?, 'tag_update', 'tag', ?)
  `).run(req.user.id, req.user.name, tagId);

  res.json({ message: '标签更新成功' });
});

router.post('/:id/lock', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '只有管理员或知识管理员可以锁定标签' });
  }

  const tagId = parseInt(req.params.id);
  const count = tagRuleEngine.lockTags([tagId], req.user.id);

  if (count > 0) {
    res.json({ message: '标签锁定成功' });
  } else {
    res.status(404).json({ error: '标签不存在' });
  }
});

router.post('/:id/unlock', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '只有管理员或知识管理员可以解锁标签' });
  }

  const tagId = parseInt(req.params.id);
  const count = tagRuleEngine.unlockTags([tagId], req.user.id);

  if (count > 0) {
    res.json({ message: '标签解锁成功' });
  } else {
    res.status(404).json({ error: '标签不存在' });
  }
});

router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: '只有管理员可以删除标签' });
  }

  const tagId = parseInt(req.params.id);

  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
  if (!tag) {
    return res.status(404).json({ error: '标签不存在' });
  }

  const tagDocuments = db.prepare('SELECT document_id FROM document_tags WHERE tag_id = ?').all(tagId);
  if (tagDocuments.length > 0) {
    return res.status(400).json({ error: '标签正在被使用，无法删除' });
  }

  db.prepare('DELETE FROM tags WHERE id = ?').run(tagId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
    VALUES (?, ?, 'tag_delete', 'tag', ?, ?)
  `).run(req.user.id, req.user.name, tagId, JSON.stringify({ name: tag.name }));

  res.json({ message: '标签删除成功' });
});

router.post('/search', authenticateToken, (req, res) => {
  const { tag_ids, operator } = req.body;

  if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
    return res.status(400).json({ error: '请提供标签ID列表' });
  }

  const documents = tagRuleEngine.searchDocumentsByTags(tag_ids, operator || 'AND');
  res.json({ documents, total: documents.length });
});

module.exports = router;
