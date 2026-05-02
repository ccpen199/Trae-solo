const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { ROLES } = require('../engines/permissionRuleEngine');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { role, keyword } = req.query;
  let query = 'SELECT id, username, name, role, department, email, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (keyword) {
    query += ' AND (name LIKE ? OR username LIKE ? OR department LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }

  query += ' ORDER BY created_at DESC';

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    name: req.user.name,
    role: req.user.role,
    department: req.user.department,
    email: req.user.email,
    created_at: req.user.created_at
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.KNOWLEDGE_MANAGER) {
    return res.status(403).json({ error: '权限不足' });
  }

  const user = db.prepare('SELECT id, username, name, role, department, email, created_at FROM users WHERE id = ?').get(userId);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const createdDocuments = db.prepare(`
    SELECT COUNT(*) as count FROM documents WHERE created_by = ? AND is_deleted = 0
  `).get(userId);

  const responsibleDocuments = db.prepare(`
    SELECT COUNT(*) as count FROM documents WHERE responsible_id = ? AND is_deleted = 0
  `).get(userId);

  const todoCount = db.prepare(`
    SELECT COUNT(*) as count FROM todo_messages WHERE user_id = ? AND is_read = 0
  `).get(userId);

  res.json({
    user,
    stats: {
      createdDocuments: createdDocuments.count,
      responsibleDocuments: responsibleDocuments.count,
      pendingTodos: todoCount.count
    }
  });
});

router.get('/role/:role', authenticateToken, (req, res) => {
  const { role } = req.params;
  const validRoles = Object.values(ROLES);

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  const users = db.prepare(`
    SELECT id, username, name, role, department, email 
    FROM users 
    WHERE role = ?
    ORDER BY name
  `).all(role);

  res.json({ users });
});

router.get('/options/roles', authenticateToken, (req, res) => {
  const roleOptions = [
    { value: ROLES.ADMIN, label: '系统管理员' },
    { value: ROLES.KNOWLEDGE_MANAGER, label: '知识管理员' },
    { value: ROLES.EXPERT, label: '专家' },
    { value: ROLES.CUSTOMER_SERVICE, label: '客服' },
    { value: ROLES.NEWBIE, label: '新人' },
    { value: ROLES.EMPLOYEE, label: '员工' }
  ];

  res.json({ roleOptions });
});

module.exports = router;
