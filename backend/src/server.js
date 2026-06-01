require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const homeRoutes = require('./routes/home');
const readingRoutes = require('./routes/reading');
const cloudRoutes = require('./routes/cloud');

const app = express();
const PORT = process.env.PORT || 44848;

app.use(cors({
  origin: `http://localhost:${process.env.FRONTEND_PORT || 45848}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/cloud', cloudRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '夸克浏览器后端服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`🚀 夸克浏览器后端服务运行在: http://localhost:${PORT}`);
});
