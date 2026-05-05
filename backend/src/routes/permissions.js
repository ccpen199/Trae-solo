const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { authMiddleware, checkPermission } = require('../middleware/auth');

const router = express.Router();

router.get('/branches', authMiddleware, (req, res) => {
  let branches;
  
  if (req.user.isHeadquarters) {
    branches = db.prepare(`
      SELECT * FROM branches ORDER BY id
    `).all();
  } else {
    branches = db.prepare(`
      SELECT * FROM branches WHERE id = ? OR parent_id = ?
    `).all(req.user.branchId, req.user.branchId);
  }

  res.json({ branches });
});

router.get('/positions', authMiddleware, (req, res) => {
  const positions = db.prepare(`
    SELECT * FROM positions ORDER BY id
  `).all();

  res.json({ positions });
});

router.get('/users', authMiddleware, checkPermission(['admin']), (req, res) => {
  let query = `
    SELECT u.id, u.erp_id, u.name, u.status, u.last_login_at,
           b.name as branch_name, b.code as branch_code,
           p.name as position_name
    FROM users u
    JOIN branches b ON u.branch_id = b.id
    JOIN positions p ON u.position_id = p.id
  `;
  const params = [];

  if (!req.user.isHeadquarters) {
    query += ` WHERE u.branch_id = ?`;
    params.push(req.user.branchId);
  }

  query += ` ORDER BY u.id`;

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

router.post('/users', authMiddleware, checkPermission(['admin']), (req, res) => {
  const { erpId, name, password, branchId, positionId } = req.body;

  if (!erpId || !name || !password || !branchId || !positionId) {
    return res.status(400).json({ error: '请填写所有必填项' });
  }

  if (!req.user.isHeadquarters) {
    const targetBranch = db.prepare(`
      SELECT id FROM branches WHERE id = ? AND (id = ? OR parent_id = ?)
    `).get(branchId, req.user.branchId, req.user.branchId);

    if (!targetBranch) {
      return res.status(403).json({ error: '只能在本分公司范围内创建用户' });
    }
  }

  const existingUser = db.prepare(`
    SELECT id FROM users WHERE erp_id = ?
  `).get(erpId);

  if (existingUser) {
    return res.status(400).json({ error: '该ERPID已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO users (erp_id, name, password, branch_id, position_id, status)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(erpId, name, hashedPassword, branchId, positionId);

  res.json({ id: result.lastInsertRowid, message: '用户创建成功' });
});

router.put('/users/:id', authMiddleware, checkPermission(['admin']), (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, password, branchId, positionId, status } = req.body;

  const existingUser = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(userId);

  if (!existingUser) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (!req.user.isHeadquarters) {
    if (existingUser.branch_id !== req.user.branchId) {
      return res.status(403).json({ error: '只能修改本分公司的用户' });
    }
    if (branchId && branchId !== req.user.branchId) {
      return res.status(403).json({ error: '不能将用户移动到其他分公司' });
    }
  }

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (password) {
    updates.push('password = ?');
    values.push(bcrypt.hashSync(password, 10));
  }
  if (branchId !== undefined) {
    updates.push('branch_id = ?');
    values.push(branchId);
  }
  if (positionId !== undefined) {
    updates.push('position_id = ?');
    values.push(positionId);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    return res.json({ message: '未提供要更新的字段' });
  }

  updates.push('updated_at = datetime("now")');
  values.push(userId);

  db.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `).run(...values);

  const logChanges = () => {
    const logStmt = db.prepare(`
      INSERT INTO user_change_logs (user_id, field, old_value, new_value, changer_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const oldValues = {
      name: existingUser.name,
      branch_id: existingUser.branch_id,
      position_id: existingUser.position_id,
      status: existingUser.status
    };
    if (name !== undefined && oldValues.name !== name) {
      logStmt.run(userId, 'name', oldValues.name, name, req.user.id);
    }
    if (branchId !== undefined && oldValues.branch_id !== branchId) {
      logStmt.run(userId, 'branch_id', oldValues.branch_id, branchId, req.user.id);
    }
    if (positionId !== undefined && oldValues.position_id !== positionId) {
      logStmt.run(userId, 'position_id', oldValues.position_id, positionId, req.user.id);
    }
    if (status !== undefined && oldValues.status !== status) {
      logStmt.run(userId, 'status', oldValues.status, status, req.user.id);
    }
  };
  logChanges();

  res.json({ message: '用户更新成功' });
});

module.exports = router;
