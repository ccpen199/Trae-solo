require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const packageRoutes = require('./routes/packages');
const timeslotRoutes = require('./routes/timeslots');
const appointmentRoutes = require('./routes/appointments');
const checkupRoutes = require('./routes/checkup');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58915;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48915}`,
  credentials: true
}));

app.use(express.json());

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/timeslots', timeslotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/checkup', checkupRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
