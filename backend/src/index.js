require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const initTables = require('./models/init');
const db = require('./utils/database');

const authRoutes = require('./routes/auth');
const personalRoutes = require('./routes/personal');
const enterpriseRoutes = require('./routes/enterprise');
const adminRoutes = require('./routes/admin');

initTables();

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || 59152);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://127.0.0.1:49152',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/auth/me', (req, res) => {
  const admin = db.prepare('SELECT id, username, role, name FROM admin_users ORDER BY id LIMIT 1').get();
  res.json({ code: 0, data: { admin, userType: 'admin' } });
});

app.get(['/api/user/profile', '/api/users/profile'], (req, res) => {
  const user = db.prepare('SELECT * FROM users ORDER BY id LIMIT 1').get() || {
    id: 1,
    name: '张三',
    phone: '13800138000',
    user_type: 'personal'
  };
  res.json({ code: 0, data: user });
});

app.get('/api/admin/stats', (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt,
    total_enterprises: db.prepare('SELECT COUNT(*) as cnt FROM enterprises').get().cnt,
    total_contracts: db.prepare('SELECT COUNT(*) as cnt FROM labor_contracts').get().cnt,
    pending_title: db.prepare('SELECT COUNT(*) as cnt FROM title_applications WHERE review_status = ?').get('pending').cnt,
    opinion_count: db.prepare('SELECT COUNT(*) as cnt FROM public_opinions').get().cnt
  };
  res.json({ code: 0, data: stats });
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    code: 0,
    data: {
      serviceStatus: 'normal',
      modules: ['跨系统数据', '职称预审', '补贴审核', '舆情监测', '争议调解'],
      alerts: [
        { level: 'warning', title: '职称材料待预审' },
        { level: 'info', title: '跨系统数据同步正常' }
      ]
    }
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ code: 500, message: err.message || '服务器错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n========================================`);
  console.log(`  江西省人社移动政务中台 - 后端服务`);
  console.log(`  地址: http://127.0.0.1:${PORT}`);
  console.log(`  健康检查: http://127.0.0.1:${PORT}/api/health`);
  console.log(`========================================\n`);
});
