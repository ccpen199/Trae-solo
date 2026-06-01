import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import db from './db.js';
import roomsRouter from './routes/rooms.js';
import micsRouter from './routes/mics.js';
import interactionsRouter from './routes/interactions.js';
import reviewsRouter from './routes/reviews.js';
import dashboardRouter from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.BACKEND_PORT || process.env.API_PORT || 53415;

const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43415}`,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const logStream = fs.createWriteStream(path.join(__dirname, '..', 'backend.log'), { flags: 'a' });
  res.on('finish', () => {
    const duration = Date.now() - start;
    logStream.write(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms\n`);
    logStream.end();
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: '未登录' });
  }
  const user = db.prepare('SELECT id, username, nickname, role, avatar, balance, banned FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

app.get('/api/users', (req, res) => {
  const { role, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT id, username, nickname, role, avatar, balance, banned, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  sql += ' ORDER BY id LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const users = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM users' + (role ? ' WHERE role = ?' : '')).get(...(role ? [role] : [])).cnt;
  res.json({ users, total, page: Number(page), pageSize: Number(pageSize) });
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, role, avatar, balance, banned, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

app.use('/api/rooms', roomsRouter);
app.use('/api/mics', micsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const logStream = fs.createWriteStream(path.join(__dirname, '..', 'backend.log'), { flags: 'a' });
  logStream.write(`[ERROR][${new Date().toISOString()}] ${err.message}\n${err.stack}\n`);
  logStream.end();
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  const logStream = fs.createWriteStream(path.join(__dirname, '..', 'backend.log'), { flags: 'a' });
  logStream.write(`[${new Date().toISOString()}] Server running on http://127.0.0.1:${PORT}\n`);
  logStream.end();
  console.log(`Voice Room Backend running on http://127.0.0.1:${PORT}`);
});
