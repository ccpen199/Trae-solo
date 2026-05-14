require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database/init');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const chatRoutes = require('./routes/chats');
const personalityRoutes = require('./routes/personality');
const analyticsRoutes = require('./routes/analytics');
const matchRoutes = require('./routes/matches');

const app = express();
const PORT = process.env.BACKEND_PORT || 47671;

app.use(cors());
app.use(express.json());

initDatabase();

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/personality', personalityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/matches', matchRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: '路由不存在' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '服务器错误' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
