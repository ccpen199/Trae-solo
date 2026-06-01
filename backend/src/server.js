const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const db = require('./database/init');

const app = express();
const PORT = process.env.BACKEND_PORT || 58819;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 48819;

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/courts', require('./routes/courts'));
app.use('/api/judges', require('./routes/judges'));
app.use('/api/clerks', require('./routes/clerks'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/statistics', require('./routes/statistics'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Court Scheduling API server running on http://127.0.0.1:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = app;
