require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const authRoutes = require('./routes/auth');
const novelRoutes = require('./routes/novels');
const chapterRoutes = require('./routes/chapters');
const userRoutes = require('./routes/users');
const readerRoutes = require('./routes/reader');
const editorRoutes = require('./routes/editor');
const financeRoutes = require('./routes/finance');

const app = express();
const PORT = process.env.BACKEND_PORT || 53417;
const fs = require('fs');

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43417}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.get('/api/health', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 as ok').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: result.ok === 1 });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/novels', novelRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/finance', financeRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
