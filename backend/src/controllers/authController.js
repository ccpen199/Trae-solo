const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);

    const token = jwt.sign({ userId: result.lastInsertRowid, username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, username, email }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请填写所有必填项' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!user) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, bio: user.bio }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

const getCurrentUser = (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

module.exports = { register, login, getCurrentUser };
