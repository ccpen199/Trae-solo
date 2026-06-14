import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDB, getDB } from './db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import trademarksRouter from './routes/trademarks.js';
import patentsRouter from './routes/patents.js';
import copyrightsRouter from './routes/copyrights.js';
import managerRouter from './routes/manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.BACKEND_PORT || 59092;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49092';
const HOST = '127.0.0.1';

const app = express();

app.use(morgan('combined'));
const allowedOrigins = new Set([
  CORS_ORIGIN,
  CORS_ORIGIN.replace('127.0.0.1', 'localhost'),
  `http://127.0.0.1:${process.env.FRONTEND_PORT || 49092}`,
  `http://localhost:${process.env.FRONTEND_PORT || 49092}`
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDB();

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/trademarks', trademarksRouter);
app.use('/api/patents', patentsRouter);
app.use('/api/copyrights', copyrightsRouter);
app.use('/api/manager', managerRouter);

app.get(['/api/users/profile', '/api/user/profile'], (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, username, name, role, email, phone, status FROM users WHERE status = ? ORDER BY id LIMIT 1').get('active');
  res.json({ user });
});

app.get('/api/search', (req, res) => {
  const db = getDB();
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const trademarks = db.prepare(`
    SELECT id, trademark_name AS title, category, status, 'trademark' AS type
    FROM trademarks
    WHERE ? = '' OR trademark_name LIKE ? OR category LIKE ? OR owner LIKE ?
    ORDER BY id DESC
    LIMIT 8
  `).all(keyword, like, like, like);
  const patents = db.prepare(`
    SELECT id, patent_name AS title, patent_type AS category, legal_status AS status, 'patent' AS type
    FROM patents
    WHERE ? = '' OR patent_name LIKE ? OR patent_type LIKE ? OR inventor LIKE ?
    ORDER BY id DESC
    LIMIT 8
  `).all(keyword, like, like, like);
  const copyrights = db.prepare(`
    SELECT id, work_name AS title, work_type AS category, status, 'copyright' AS type
    FROM copyrights
    WHERE ? = '' OR work_name LIKE ? OR work_type LIKE ? OR author LIKE ?
    ORDER BY id DESC
    LIMIT 8
  `).all(keyword, like, like, like);
  res.json({ keyword, list: [...trademarks, ...patents, ...copyrights] });
});

app.get(['/api/admin/stats', '/api/admin/dashboard'], (req, res) => {
  const db = getDB();
  const counts = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users WHERE status = ?').get('active').count,
    trademarks: db.prepare('SELECT COUNT(*) AS count FROM trademarks').get().count,
    patents: db.prepare('SELECT COUNT(*) AS count FROM patents').get().count,
    copyrights: db.prepare('SELECT COUNT(*) AS count FROM copyrights').get().count,
    cases: db.prepare('SELECT COUNT(*) AS count FROM cases').get().count,
    notifications: db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0').get().count,
  };
  res.json({
    stats: counts,
    modules: ['工作台', '商标管理', '专利管理', '版权管理', '管家服务', '消息通知']
  });
});

app.use('/api', (req, res) => {
  res.json({
    message: '知识产权全生命周期平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      trademarks: '/api/trademarks/*',
      patents: '/api/patents/*',
      copyrights: '/api/copyrights/*',
      manager: '/api/manager/*'
    },
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
