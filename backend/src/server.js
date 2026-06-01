require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const guideRoutes = require('./routes/guideRoutes');
const travelBarRoutes = require('./routes/travelBarRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 44856;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:45856',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/travel-bars', travelBarRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '旅行僧后端服务运行正常' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`旅行僧后端服务运行在 http://localhost:${PORT}`);
});
