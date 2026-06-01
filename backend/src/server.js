require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./models/database');
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meeting');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 54870;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 44870}`,
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

initDatabase();

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Meeting platform backend running on http://127.0.0.1:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Backend server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Backend server closed');
    process.exit(0);
  });
});
