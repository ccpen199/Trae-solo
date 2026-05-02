const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { PermissionRuleEngine, ROLES } = require('../engines/permissionRuleEngine');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const directories = db.prepare(`
    SELECT d.*, u.name as creator_name
    FROM directories d
    LEFT JOIN users u ON d.created_by = u.id
    ORDER BY d.sort_order, d.created_at
  `).all();

  const buildTree = (dirs, parentId = null) => {
    return dirs
      .filter(d => d.parent_id === parentId)
      .map(d => ({
        ...d,
        children: buildTree(dirs, d.id)
      }));
  };

  const tree = buildTree(directories);
  res.json({ directories, tree });
});

router.get('/:id', authenticateToken, (req, res) => {
  const dirId = parseInt(req.params.id);
  const directory = db.prepare(`
    SELECT d.*, u.name as creator_name
    FROM directories d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE d.id = ?
  `).get(dirId);

  if (!directory) {
    return res.status(404).json({ error: '目录不存在' });
  }

  const documents = db.prepare(`
    SELECT d.id, d.main_order_no, d.title, d.status, d.created_at, u.name as creator_name
    FROM documents d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE d.directory_id = ? AND d.is_deleted = 0
    ORDER BY d.created_at DESC
  `).all(dirId);

  res.json({ directory, documents });
});

router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '只有管理员或知识管理员可以创建目录' });
  }

  const { name, parent_id, description, sort_order } = req.body;

  if (!name) {
    return res.status(400).json({ error: '目录名称不能为空' });
  }

  const existing = db.prepare('SELECT id FROM directories WHERE name = ? AND parent_id = ?').get(name, parent_id);
  if (existing) {
    return res.status(400).json({ error: '同级目录下已存在同名目录' });
  }

  const result = db.prepare(`
    INSERT INTO directories (name, parent_id, description, sort_order, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, parent_id, description, sort_order || 0, req.user.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, new_value)
    VALUES (?, ?, 'directory_create', 'directory', ?, ?)
  `).run(req.user.id, req.user.name, result.lastInsertRowid, JSON.stringify({ name, parent_id }));

  res.status(201).json({
    message: '目录创建成功',
    directoryId: result.lastInsertRowid
  });
});

router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '只有管理员或知识管理员可以编辑目录' });
  }

  const dirId = parseInt(req.params.id);
  const { name, parent_id, description, sort_order } = req.body;

  const directory = db.prepare('SELECT * FROM directories WHERE id = ?').get(dirId);
  if (!directory) {
    return res.status(404).json({ error: '目录不存在' });
  }

  if (parent_id !== undefined) {
    let checkParent = parent_id;
    while (checkParent) {
      if (checkParent === dirId) {
        return res.status(400).json({ error: '不能将目录移动到其子目录下' });
      }
      const parent = db.prepare('SELECT parent_id FROM directories WHERE id = ?').get(checkParent);
      checkParent = parent?.parent_id;
    }
  }

  const updateFields = [];
  const updateValues = [];

  if (name !== undefined) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }
  if (parent_id !== undefined) {
    updateFields.push('parent_id = ?');
    updateValues.push(parent_id);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }
  if (sort_order !== undefined) {
    updateFields.push('sort_order = ?');
    updateValues.push(sort_order);
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(dirId);

    db.prepare(`UPDATE directories SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id)
    VALUES (?, ?, 'directory_update', 'directory', ?)
  `).run(req.user.id, req.user.name, dirId);

  res.json({ message: '目录更新成功' });
});

router.delete('/:id', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: '只有管理员可以删除目录' });
  }

  const dirId = parseInt(req.params.id);

  const directory = db.prepare('SELECT * FROM directories WHERE id = ?').get(dirId);
  if (!directory) {
    return res.status(404).json({ error: '目录不存在' });
  }

  const hasChildren = db.prepare('SELECT id FROM directories WHERE parent_id = ?').get(dirId);
  if (hasChildren) {
    return res.status(400).json({ error: '请先删除子目录' });
  }

  const hasDocuments = db.prepare('SELECT id FROM documents WHERE directory_id = ? AND is_deleted = 0').get(dirId);
  if (hasDocuments) {
    return res.status(400).json({ error: '请先移动或删除目录下的文档' });
  }

  db.prepare('DELETE FROM directories WHERE id = ?').run(dirId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, details)
    VALUES (?, ?, 'directory_delete', 'directory', ?, ?)
  `).run(req.user.id, req.user.name, dirId, JSON.stringify({ name: directory.name }));

  res.json({ message: '目录删除成功' });
});

module.exports = router;
