const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const PORT = process.env.PORT || 11731;
const app = express();

console.log('正在启动后端服务...');
console.log('端口:', PORT);

app.use(cors({
  origin: ['http://localhost:11732', 'http://127.0.0.1:11732'],
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, '../../data/app.sqlite');
  const dbDir = path.dirname(dbPath);
  const fs = require('fs');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  console.log('数据库连接成功:', dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'developer',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, email, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertUser.run(uuidv4(), 'admin', hashedPassword, 'admin@example.com', 'admin');
    insertUser.run(uuidv4(), 'developer', hashedPassword, 'developer@example.com', 'developer');
    insertUser.run(uuidv4(), 'reviewer', hashedPassword, 'reviewer@example.com', 'reviewer');
    insertUser.run(uuidv4(), 'devops', hashedPassword, 'devops@example.com', 'devops');
    
    console.log('默认用户已创建');
  }
  
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
  
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  });
  
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: '令牌无效或已过期' });
      }
      
      const dbUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(user.id);
      if (!dbUser) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      req.user = dbUser;
      next();
    });
  };
  
  app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json(req.user);
  });
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      main_order_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      responsible_id TEXT,
      expected_finish_time INTEGER,
      status TEXT NOT NULL DEFAULT 'pending_create',
      is_public INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  app.get('/api/repositories', authenticateToken, (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const repositories = db.prepare(`
      SELECT r.*, u.username as owner_name
      FROM repositories r
      LEFT JOIN users u ON r.owner_id = u.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(Number(limit), offset);
    
    const countResult = db.prepare('SELECT COUNT(*) as total FROM repositories').get();
    
    res.json({
      data: repositories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  });
  
  app.post('/api/repositories', authenticateToken, (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '仓库名称不能为空' });
    }
    
    const existingRepo = db.prepare('SELECT id FROM repositories WHERE name = ?').get(name);
    if (existingRepo) {
      return res.status(409).json({ error: '仓库名称已存在' });
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const mainOrderNo = `REPO-${year}${month}${day}-${random}`;
    
    const repoId = uuidv4();
    const initialStatus = 'pending_create';
    
    db.prepare(`
      INSERT INTO repositories (
        id, main_order_no, name, description, owner_id, status, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      repoId,
      mainOrderNo,
      name,
      description,
      req.user.id,
      initialStatus,
      0
    );
    
    res.status(201).json({
      id: repoId,
      main_order_no: mainOrderNo,
      name,
      status: initialStatus,
      message: '仓库创建申请已提交'
    });
  });
  
  app.get('/api/stats', authenticateToken, (req, res) => {
    const repoStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM repositories GROUP BY status
    `).all();
    
    const userStats = db.prepare(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `).all();
    
    res.json({
      repositories: repoStats.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      merge_requests: {},
      pipelines: {},
      users: userStats.reduce((acc, item) => {
        acc[item.role] = item.count;
        return acc;
      }, {}),
      my_todos: 0
    });
  });
  
} catch (err) {
  console.error('初始化错误:', err);
}

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           代码托管平台协作系统 - 后端服务                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  服务地址: http://localhost:${PORT}                          ║`);
  console.log(`║  健康检查: http://localhost:${PORT}/health                    ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  默认账号:                                                   ║');
  console.log('║    admin / admin123    (管理员)                              ║');
  console.log('║    developer / admin123 (开发者)                             ║');
  console.log('║    reviewer / admin123  (审查者)                             ║');
  console.log('║    devops / admin123    (运维)                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});
