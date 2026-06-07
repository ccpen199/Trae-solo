const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, userType: user.user_type },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      phone: user.phone,
      email: user.email,
      userType: user.user_type
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, realName, phone, idCard, userType = 'citizen' } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password, 10);
  
  try {
    const result = db.prepare(`
      INSERT INTO users (username, password, real_name, phone, id_card, user_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, hash, realName, phone, idCard, userType);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        realName,
        phone,
        userType
      }
    });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

router.get('/profile', require('../middleware/auth'), (req, res) => {
  const user = db.prepare('SELECT id, username, real_name, phone, email, id_card, user_type, avatar FROM users WHERE id = ?').get(req.userId);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const bindings = db.prepare(`
    SELECT eb.*, e.name as enterprise_name, e.unified_credit_code
    FROM enterprise_bindings eb
    JOIN enterprises e ON eb.enterprise_id = e.id
    WHERE eb.user_id = ?
  `).all(req.userId);

  res.json({
    id: user.id,
    username: user.username,
    realName: user.real_name,
    phone: user.phone,
    email: user.email,
    idCard: user.id_card,
    userType: user.user_type,
    avatar: user.avatar,
    enterpriseBindings: bindings
  });
});

module.exports = router;
