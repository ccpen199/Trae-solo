require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const applicationRoutes = require('./routes/applications');
const environmentRoutes = require('./routes/environments');
const taskRoutes = require('./routes/tasks');
const changeOrderRoutes = require('./routes/changeOrders');
const alertRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.BACKEND_PORT || 53382;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43382}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/change-orders', changeOrderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
  console.log(`API base: http://127.0.0.1:${PORT}/api`);
});
