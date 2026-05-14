require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/init');
const { errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const topicRoutes = require('./routes/topics');
const questionRoutes = require('./routes/questions');
const articleRoutes = require('./routes/articles');
const answerRoutes = require('./routes/answers');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 12691;

app.use(cors({
  origin: ['http://localhost:12692', 'http://127.0.0.1:12692'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PMCAFF API is running' });
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`PMCAFF Backend is running on port ${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
});
