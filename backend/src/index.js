require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./database/init');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const announcementsRoutes = require('./routes/announcements');
const leavesRoutes = require('./routes/leaves');
const feedbacksRoutes = require('./routes/feedbacks');

const app = express();
const PORT = process.env.BACKEND_PORT || 58834;

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48834}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/feedbacks', feedbacksRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
