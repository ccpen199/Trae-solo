const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

async function register(req, res) {
  const { username, email, password, role, companyName, jobseekerName } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  if (!['company', 'jobseeker'].includes(role)) {
    return res.status(400).json({ error: '无效的用户角色' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existingUser) {
    return res.status(400).json({ error: '用户名或邮箱已存在' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertUser = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
  const result = insertUser.run(username, email, hashedPassword, role);
  const userId = result.lastInsertRowid;

  if (role === 'company') {
    const insertCompany = db.prepare('INSERT INTO companies (user_id, name) VALUES (?, ?)');
    insertCompany.run(userId, companyName || username);
  } else {
    const insertJobseeker = db.prepare('INSERT INTO jobseekers (user_id, name) VALUES (?, ?)');
    insertJobseeker.run(userId, jobseekerName || username);
  }

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  res.json({
    token,
    user: {
      id: userId,
      username,
      email,
      role
    }
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '缺少邮箱或密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  let profile = null;
  if (user.role === 'company') {
    profile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(user.id);
  } else if (user.role === 'jobseeker') {
    profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(user.id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    },
    profile
  });
}

function getCurrentUser(req, res) {
  let profile = null;
  if (req.user.role === 'company') {
    profile = db.prepare('SELECT * FROM companies WHERE user_id = ?').get(req.user.id);
  } else if (req.user.role === 'jobseeker') {
    profile = db.prepare('SELECT * FROM jobseekers WHERE user_id = ?').get(req.user.id);
  }

  res.json({
    user: req.user,
    profile
  });
}

module.exports = { register, login, getCurrentUser };
