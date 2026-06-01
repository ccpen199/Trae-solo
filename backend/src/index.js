require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const listRoutes = require('./routes/lists');
const taskRoutes = require('./routes/tasks');
const tagRoutes = require('./routes/tags');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.BACKEND_PORT || 55874;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 45874}`, `http://localhost:${process.env.FRONTEND_PORT || 45874}`],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`API endpoint: http://127.0.0.1:${PORT}/api`);
});
