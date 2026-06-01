require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58849;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48849}`,
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const pointsRouter = require('./routes/points');
const dataRouter = require('./routes/data');
const alertsRouter = require('./routes/alerts');
const tasksRouter = require('./routes/tasks');
const reportsRouter = require('./routes/reports');

app.use('/api/points', pointsRouter);
app.use('/api/data', dataRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/reports', reportsRouter);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
