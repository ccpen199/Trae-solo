require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const recruitmentRoutes = require('./routes/recruitment');
const activityRoutes = require('./routes/activities');
const fundRoutes = require('./routes/funds');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.BACKEND_PORT || 58880;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48880}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Club Management Backend running on http://127.0.0.1:${PORT}`);
  console.log(`API base: http://127.0.0.1:${PORT}/api`);
});
