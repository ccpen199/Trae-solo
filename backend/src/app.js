require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 44858;

const dbDir = path.join(__dirname, './data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'app.sqlite'));
db.pragma('foreign_keys = ON');

db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, email TEXT, real_name TEXT, school TEXT, department TEXT, grade TEXT, phone TEXT, profile_completed INTEGER DEFAULT 0)');
db.exec('CREATE TABLE IF NOT EXISTS clubs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, logo TEXT, description TEXT, category TEXT)');
db.exec('CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, cover TEXT, description TEXT, type TEXT NOT NULL, organizer TEXT, location TEXT, status TEXT DEFAULT "upcoming")');
db.exec('CREATE TABLE IF NOT EXISTS competitions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, cover TEXT, description TEXT, level TEXT NOT NULL, organizer TEXT)');

try {
  const clubStmt = db.prepare('INSERT OR IGNORE INTO clubs (name, logo, description, category) VALUES (?, ?, ?, ?)');
  clubStmt.run('计算机协会', '💻', '专注于计算机技术交流与分享的学生社团', '技术类');
  clubStmt.run('篮球协会', '🏀', '热爱篮球运动的学生聚集地', '体育类');
  clubStmt.run('演讲与口才协会', '🎤', '提升演讲能力和表达技巧的社团', '文艺类');
  
  const actStmt = db.prepare('INSERT OR IGNORE INTO activities (title, cover, description, type, organizer, location) VALUES (?, ?, ?, ?, ?, ?)');
  actStmt.run('Python编程入门讲座', '🐍', '零基础Python编程入门，适合编程新手', 'lecture', '计算机协会', '教学楼A101');
  actStmt.run('校园篮球联赛', '🏆', '一年一度的校园篮球盛事', 'activity', '篮球协会', '校体育馆');
  
  const compStmt = db.prepare('INSERT OR IGNORE INTO competitions (title, cover, description, level, organizer) VALUES (?, ?, ?, ?, ?)');
  compStmt.run('全国大学生数学建模竞赛', '📊', '国家级数学建模竞赛，展现团队智慧', 'national', '教育部');
  compStmt.run('省级程序设计大赛', '💻', '省级大学生程序设计竞赛', 'provincial', '省计算机学会');
} catch(e) {}

app.use(cors());
app.use(express.json());

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: '密码加密失败' });
    try {
      const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
      const token = jwt.sign({ userId: result.lastInsertRowid }, 'club_secret_key_2024', { expiresIn: '7d' });
      res.status(201).json({ message: '注册成功', token, user: { id: result.lastInsertRowid, username, profile_completed: 0 } });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(400).json({ error: '用户名已存在' });
      res.status(500).json({ error: '注册失败' });
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: '密码验证失败' });
      if (!isMatch) return res.status(401).json({ error: '用户名或密码错误' });
      const token = jwt.sign({ userId: user.id }, 'club_secret_key_2024', { expiresIn: '7d' });
      res.json({ message: '登录成功', token, user: { id: user.id, username: user.username, school: user.school, profile_completed: user.profile_completed } });
    });
  } catch (e) { res.status(500).json({ error: '数据库错误' }); }
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未提供认证令牌' });
  try {
    req.user = jwt.verify(token, 'club_secret_key_2024');
    next();
  } catch (e) { res.status(401).json({ error: '无效的认证令牌' }); }
};

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { real_name, school, department, grade, phone } = req.body;
  try {
    db.prepare('UPDATE users SET real_name = ?, school = ?, department = ?, grade = ?, phone = ?, profile_completed = 1 WHERE id = ?').run(real_name, school, department, grade, phone, userId);
    const user = db.prepare('SELECT id, username, email, real_name, school, department, grade, phone, profile_completed FROM users WHERE id = ?').get(userId);
    res.json({ message: '资料更新成功', user });
  } catch (e) { res.status(500).json({ error: '更新失败' }); }
});

app.get('/api/clubs', (req, res) => res.json({ clubs: db.prepare('SELECT * FROM clubs').all() }));
app.get('/api/activities', (req, res) => res.json({ activities: db.prepare('SELECT * FROM activities').all() }));
app.get('/api/competitions', (req, res) => res.json({ competitions: db.prepare('SELECT * FROM competitions').all() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: '社团资讯平台API运行正常' }));

app.listen(PORT, () => console.log('后端服务启动成功: http://localhost:' + PORT));
