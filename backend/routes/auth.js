const express = require('express');
const router = express.Router();
const { db } = require('../database');

const ROLES = {
  ADMIN: 'admin',
  APPLICANT: 'applicant',
  APPROVER: 'approver',
  VERIFIER: 'verifier',
};

const ROLE_PERMISSIONS = {
  admin: ['*'],
  approver: ['templates:view', 'approvals:view', 'approvals:approve', 'certificates:view', 'certificates:issue', 'certificates:revoke', 'verification:view', 'verification:verify', 'applicants:view'],
  applicant: ['approvals:view', 'approvals:create', 'certificates:viewOwn'],
  verifier: ['verification:verify', 'verification:view'],
};

function checkPermission(userRole, permission) {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const userInfo = {
    id: user.id,
    username: user.username,
    role: user.role,
    department: user.department,
  };

  res.json({
    success: true,
    data: {
      user: userInfo,
      token: Buffer.from(JSON.stringify({ userId: user.id, username: user.username, role: user.role, ts: Date.now() })).toString('base64'),
    },
  });
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: '登出成功' });
});

router.get('/current', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = db.prepare('SELECT id, username, role, department FROM users WHERE id = ?').get(payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的token' });
  }
});

router.get('/permissions', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const permissions = ROLE_PERMISSIONS[payload.role] || [];

    res.json({
      success: true,
      data: {
        role: payload.role,
        permissions,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的token' });
  }
});

module.exports = { router, checkPermission, ROLES };
