const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'education-game-secret-key-2024';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

router.post('/register', (req, res) => {
  const { username, password, role, nickname } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, nickname, avatar)
      VALUES (@username, @password, @role, @nickname, @avatar)
    `);
    
    const result = stmt.run({
      username,
      password: hashedPassword,
      role: role || 'student',
      nickname: nickname || username,
      avatar: role === 'teacher' ? '👨‍🏫' : '👦'
    });

    const user = db.prepare('SELECT id, username, role, nickname, avatar, total_score FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: '用户名已存在' });
    } else {
      res.status(500).json({ error: '注册失败' });
    }
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userWithoutPassword } = user;

  res.json({ token, user: userWithoutPassword });
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, role, nickname, avatar, total_score, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const gameStats = db.prepare(`
    SELECT 
      gt.id,
      gt.name,
      gt.icon,
      COUNT(sr.id) as play_count,
      SUM(sr.score) as total_score
    FROM game_types gt
    LEFT JOIN score_records sr ON gt.id = sr.game_type_id AND sr.user_id = ?
    GROUP BY gt.id
  `).all(req.user.id);

  const recentScores = db.prepare(`
    SELECT 
      sr.id,
      sr.score,
      sr.created_at,
      gt.name as game_name,
      gt.icon
    FROM score_records sr
    JOIN game_types gt ON sr.game_type_id = gt.id
    WHERE sr.user_id = ?
    ORDER BY sr.created_at DESC
    LIMIT 10
  `).all(req.user.id);

  res.json({
    user,
    gameStats,
    recentScores
  });
});

router.get('/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: '只有老师可以查看学生列表' });
  }

  const students = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.nickname,
      u.avatar,
      u.total_score,
      COUNT(sr.id) as game_count,
      MAX(sr.score) as highest_score
    FROM users u
    LEFT JOIN score_records sr ON u.id = sr.user_id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.total_score DESC
  `).all();

  res.json(students);
});

router.put('/profile', authenticateToken, (req, res) => {
  const { nickname, avatar } = req.body;

  try {
    db.prepare(`
      UPDATE users 
      SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(nickname, avatar, req.user.id);

    const user = db.prepare('SELECT id, username, role, nickname, avatar, total_score FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

module.exports = { router, authenticateToken };
