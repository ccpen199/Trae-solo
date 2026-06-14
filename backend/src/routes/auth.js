const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/db');

const router = express.Router();
const JWT_SECRET = 'service-job-platform-secret-key-2024';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, company_id: user.company_id, seeker_id: user.seeker_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
      seeker_id: user.seeker_id
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, role, name, phone } = req.body;

  const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.exec('BEGIN');

    let company_id = null;
    let seeker_id = null;

    if (role === 'company') {
      const result = db.prepare(`
        INSERT INTO companies (name, industry, contact_person, contact_phone)
        VALUES (?, '餐饮', ?, ?)
      `).run(name, name, phone);
      company_id = result.lastInsertRowid;
    } else if (role === 'seeker') {
      const result = db.prepare(`
        INSERT INTO job_seekers (name, phone)
        VALUES (?, ?)
      `).run(name, phone);
      seeker_id = result.lastInsertRowid;
    }

    const userResult = db.prepare(`
      INSERT INTO users (username, password, role, company_id, seeker_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, hashedPassword, role, company_id, seeker_id);

    db.exec('COMMIT');

    const token = jwt.sign(
      { id: userResult.lastInsertRowid, username, role, company_id, seeker_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userResult.lastInsertRowid,
        username,
        role,
        company_id,
        seeker_id
      }
    });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      company_id: req.user.company_id,
      seeker_id: req.user.seeker_id
    }
  });
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token无效' });
  }
}

module.exports = { router, authMiddleware };
