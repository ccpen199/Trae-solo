const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const register = async (req, res) => {
  const { username, phone, password, role, real_name, id_card } = req.body;

  if (!username || !phone || !password || !role) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  if (!['landlord', 'tenant'].includes(role)) {
    return res.status(400).json({ error: '无效的用户角色' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone);
    if (existingUser) {
      return res.status(400).json({ error: '用户名或手机号已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, phone, password, role, real_name, id_card, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, phone, hashedPassword, role, real_name || null, id_card || null, (real_name && id_card) ? 1 : 0);

    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET || 'direct_home_secret_key_2024',
      { expiresIn: '7d' }
    );

    const user = db.prepare('SELECT id, username, phone, real_name, role, credit_score, is_verified, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: '注册成功',
      token,
      user
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR phone = ?').get(username, username);
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'direct_home_secret_key_2024',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: '登录成功',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

const updateProfile = (req, res) => {
  const { real_name, id_card, avatar } = req.body;
  const userId = req.user.id;

  try {
    const updates = [];
    const values = [];

    if (real_name !== undefined) {
      updates.push('real_name = ?');
      values.push(real_name);
    }
    if (id_card !== undefined) {
      updates.push('id_card = ?');
      values.push(id_card);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (real_name && id_card) {
      updates.push('is_verified = ?');
      values.push(1);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const user = db.prepare('SELECT id, username, phone, real_name, role, credit_score, is_verified, avatar, updated_at FROM users WHERE id = ?').get(userId);

    res.json({ message: '更新成功', user });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile
};
