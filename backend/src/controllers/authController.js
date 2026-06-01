const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');

exports.register = async (req, res) => {
  const { phone, password, nickname, user_type = 'c' } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existingUser) {
    return res.status(400).json({ error: '该手机号已注册' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const result = db.prepare(`
    INSERT INTO users (phone, password, nickname, user_type)
    VALUES (?, ?, ?, ?)
  `).run(phone, hashedPassword, nickname || phone, user_type);

  const token = jwt.sign(
    { userId: result.lastInsertRowid },
    process.env.JWT_SECRET || 'local-info-platform-secret-key-2024',
    { expiresIn: '7d' }
  );

  const user = db.prepare('SELECT id, phone, nickname, avatar, user_type, is_verified FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.json({ token, user });
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || 'local-info-platform-secret-key-2024',
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
};

exports.getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = (req, res) => {
  const { nickname, avatar, real_name, id_card } = req.body;
  
  db.prepare(`
    UPDATE users 
    SET nickname = COALESCE(?, nickname),
        avatar = COALESCE(?, avatar),
        real_name = COALESCE(?, real_name),
        id_card = COALESCE(?, id_card),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nickname, avatar, real_name, id_card, req.user.id);

  const user = db.prepare('SELECT id, phone, nickname, avatar, user_type, is_verified, real_name FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
};
