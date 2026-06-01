require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const buildingRoutes = require('./routes/buildings');
const checkpointRoutes = require('./routes/checkpoints');
const planRoutes = require('./routes/plans');
const patrolRoutes = require('./routes/patrol');
const workOrderRoutes = require('./routes/workorders');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/users');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.BACKEND_PORT || 58853;

app.use(cors({
  origin: ['http://127.0.0.1:48853', 'http://localhost:48853'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/patrol', patrolRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
