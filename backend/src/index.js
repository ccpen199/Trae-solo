const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
const db = require('./models/database');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/contents');
const topicRoutes = require('./routes/topics');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/review');
const earningRoutes = require('./routes/earnings');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const recommendRoutes = require('./routes/recommend');
const collectionRoutes = require('./routes/collections');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 59023;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49023;

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = process.env.UPLOAD_DIR || 'data/uploads';
app.use('/uploads', express.static(path.resolve(process.cwd(), uploadDir)));

app.use('/api/auth', authRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/earnings', earningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString() }, message: 'ok' });
});

app.use((err, req, res, _next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ code: 1, message: `上传错误: ${err.message}` });
  }
  console.error(err.stack);
  res.status(500).json({ code: 1, message: err.message || '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
