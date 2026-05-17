require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
require('./models/database');

const authRoutes = require('./routes/auth');
const homeworkRoutes = require('./routes/homework');
const classRoutes = require('./routes/class');

const app = express();
const PORT = process.env.BACKEND_PORT || 48071;

app.use(cors({
  origin: ['http://localhost:48072', 'http://localhost:48073'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/homework', require('./middleware/auth'), homeworkRoutes);
app.use('/api/class', require('./middleware/auth'), classRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});