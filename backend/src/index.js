require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase, seedData } = require('./database');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const applicationRoutes = require('./routes/applications');
const taskRoutes = require('./routes/tasks');
const logRoutes = require('./routes/logs');
const changeRoutes = require('./routes/changes');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 53379;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 43379}`,
  credentials: true
}));

app.use(express.json());

initDatabase();
seedData();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/changes', changeRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`SDK Admin Backend running on http://127.0.0.1:${PORT}`);
  console.log(`API Base URL: http://127.0.0.1:${PORT}/api`);
});
