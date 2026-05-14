require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const answerRoutes = require('./routes/answers');
const topicRoutes = require('./routes/topics');
const userRoutes = require('./routes/users');
const articleRoutes = require('./routes/articles');

const app = express();
const PORT = process.env.PORT || 47581;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 47582;

app.use(cors({
  origin: [`http://localhost:${FRONTEND_PORT}`, `http://127.0.0.1:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/questions/:questionId/answers', answerRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
  console.log(`API 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
