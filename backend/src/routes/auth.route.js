const express = require('express');
const { getDb } = require('../database/init');
const { generateAccessToken } = require('../utils/common');

const router = express.Router();
const db = getDb();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const user = db.prepare(`
    SELECT e.*, r.code as role_code, r.name as role_name, d.name as department_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.username = ? AND e.status = 1
  `).get(username);

  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const token = user.id + '-' + generateAccessToken(user.id);

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        roleId: user.role_id,
        roleCode: user.role_code,
        roleName: user.role_name,
        departmentId: user.department_id,
        departmentName: user.department_name,
      },
    },
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '退出成功' });
});

router.get('/current', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  const user = db.prepare(`
    SELECT e.*, r.code as role_code, r.name as role_name, d.name as department_name
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = ?
  `).get(req.user.id);

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      roleId: user.role_id,
      roleCode: user.role_code,
      roleName: user.role_name,
      departmentId: user.department_id,
      departmentName: user.department_name,
    },
  });
});

module.exports = router;
