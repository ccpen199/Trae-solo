require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/database');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/course');
const communityRoutes = require('./routes/community');
const assessmentRoutes = require('./routes/assessment');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 48222;

app.use(cors({
  origin: ['http://localhost:48221', 'http://127.0.0.1:48221'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HiU API is running' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`HiU Backend Server is running on http://localhost:${PORT}`);
});
