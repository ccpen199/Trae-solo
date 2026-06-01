require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { db, initDatabase } = require('./database');

const PORT = parseInt(process.env.BACKEND_PORT || '53445', 10);
const PROJECT_DIR = path.resolve(__dirname, '..', '..');

const app = express();

const logStream = fs.createWriteStream(path.join(__dirname, '..', '..', 'backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('combined'));

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || '43445'}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    project: process.env.PROJECT_NAME
  });
});

const baggageRoutes = require('./routes/baggage');
const nodeRoutes = require('./routes/nodes');
const exceptionRoutes = require('./routes/exceptions');
const compensationRoutes = require('./routes/compensation');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/upload');

app.use('/api/baggage', baggageRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/compensation', compensationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
  console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
  console.log(`Project dir: ${PROJECT_DIR}`);
});

module.exports = app;
