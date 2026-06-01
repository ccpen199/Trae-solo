const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const initDefaultUsers = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('Admin@123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, real_name, email, role, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);

    const users = [
      { username: 'platform_engineer', real_name: '平台工程师', email: 'platform@example.com', role: 'platform_engineer' },
      { username: 'ops_admin', real_name: '运维管理员', email: 'ops@example.com', role: 'ops' },
      { username: 'developer', real_name: '开发者', email: 'dev@example.com', role: 'developer' },
      { username: 'app_owner', real_name: '应用负责人', email: 'owner@example.com', role: 'app_owner' },
      { username: 'security_admin', real_name: '安全管理员', email: 'security@example.com', role: 'security_admin' }
    ];

    const transaction = db.transaction((users) => {
      for (const user of users) {
        insertUser.run(user.username, hashedPassword, user.real_name, user.email, user.role);
      }
    });

    transaction(users);
    console.log('默认用户已创建，密码均为: Admin@123');
  }
};

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(401).json({ error: '用户已被禁用' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const auditStmt = db.prepare(`
    INSERT INTO audit_logs (audit_id, user_id, action, resource_type, resource_id, ip_address, status)
    VALUES (?, ?, ?, ?, ?, ?, 'allowed')
  `);
  auditStmt.run(
    `audit_${Date.now()}`,
    user.id,
    'user_login',
    'auth',
    'login',
    req.ip
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      email: user.email,
      role: user.role
    }
  });
};

const getCurrentUser = (req, res) => {
  res.json({
    user: req.user
  });
};

const getAllUsers = (req, res) => {
  const users = db.prepare(`
    SELECT id, username, real_name, email, phone, role, status, created_at 
    FROM users 
    ORDER BY created_at DESC
  `).all();

  res.json({ users });
};

module.exports = { login, getCurrentUser, getAllUsers, initDefaultUsers };
