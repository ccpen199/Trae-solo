const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken, requireRole, normalizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), (req, res) => {
  const { page = 1, pageSize = 10, keyword, level, region_level } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT id, username, real_name, phone, email, level, region_level, region_code, region_name, status, last_login_at, created_at FROM users WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  let params = [];

  if (keyword) {
    sql += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ?)';
    countSql += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  if (level) {
    sql += ' AND level = ?';
    countSql += ' AND level = ?';
    params.push(level);
  }
  if (region_level) {
    sql += ' AND region_level = ?';
    countSql += ' AND region_level = ?';
    params.push(region_level);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, parseInt(pageSize), offset];

  db.get(countSql, params, (err, countRow) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.all(sql, queryParams, (err, rows) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({
        code: 200,
        data: {
          list: rows,
          total: countRow.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

router.get('/profile', (req, res, next) => {
  if (!req.headers.authorization && process.env.NODE_ENV === 'development') {
    db.get('SELECT id, username, real_name, id_card, phone, email, level, region_level, region_code, region_name, status, avatar, last_login_at, created_at, updated_at FROM users WHERE username = ?',
      ['admin'], (err, row) => {
      if (err || !row) return res.status(404).json({ code: 404, message: '用户不存在' });
      db.all('SELECT r.* FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?',
        [row.id], (err, roles) => {
          row.roles = normalizeRoles(roles || []);
          res.json({ code: 200, data: row });
        });
    });
    return;
  }
  authenticateToken(req, res, next);
}, (req, res) => {
  db.get('SELECT id, username, real_name, id_card, phone, email, level, region_level, region_code, region_name, status, avatar, last_login_at, created_at, updated_at FROM users WHERE id = ?',
    [req.user.id], (err, row) => {
    if (err || !row) return res.status(404).json({ code: 404, message: '用户不存在' });
    db.all('SELECT r.* FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?',
      [row.id], (err, roles) => {
        row.roles = normalizeRoles(roles || []);
        res.json({ code: 200, data: row });
      });
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT id, username, real_name, id_card, phone, email, level, region_level, region_code, region_name, status, avatar, last_login_at, created_at, updated_at FROM users WHERE id = ?',
    [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '用户不存在' });

    db.all('SELECT r.* FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?',
      [req.params.id], (err, roles) => {
        row.roles = normalizeRoles(roles || []);
        res.json({ code: 200, data: row });
      });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建用户', '用户管理', 'user'), (req, res) => {
  const { username, password, real_name, id_card, phone, email, level, region_level, region_code, region_name, department_id, status } = req.body;

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPwd = bcrypt.hashSync(password, salt);

  db.run('INSERT INTO users (username, password, real_name, id_card, phone, email, level, region_level, region_code, region_name, department_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [username, hashedPwd, real_name, id_card, phone, email, level || 'user', region_level || 'province', region_code, region_name, department_id, status || 1],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, auditLog('更新用户', '用户管理', 'user'), (req, res) => {
  const { real_name, phone, email, level, region_level, region_code, region_name, department_id, status } = req.body;

  if (req.user.level !== 'admin' && parseInt(req.params.id) !== req.user.id) {
    return res.status(403).json({ code: 403, message: '无权限修改其他用户信息' });
  }

  db.run('UPDATE users SET real_name = ?, phone = ?, email = ?, level = ?, region_level = ?, region_code = ?, region_name = ?, department_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [real_name, phone, email, level, region_level, region_code, region_name, department_id, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.put('/:id/roles', authenticateToken, requireRole(['super_admin']), auditLog('分配角色', '用户管理', 'user'), (req, res) => {
  const { role_ids } = req.body;
  const userId = req.params.id;

  db.run('DELETE FROM user_roles WHERE user_id = ?', [userId], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });

    if (role_ids && role_ids.length > 0) {
      const stmt = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      role_ids.forEach(roleId => {
        stmt.run([userId, roleId]);
      });
      stmt.finalize();
    }

    res.json({ code: 200, message: '角色分配成功' });
  });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除用户', '用户管理', 'user'), (req, res) => {
  db.run('UPDATE users SET status = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
