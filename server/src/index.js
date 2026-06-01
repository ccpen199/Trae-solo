const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, getDb, logAction } = require('./db');

const app = express();
app.use(cors({
  origin: ['http://127.0.0.1:' + (process.env.FRONTEND_PORT || 46341)],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const dbPath = process.env.DB_PATH || './data/warning.db';
initDb(path.resolve(__dirname, '..', dbPath));

app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/warning', require('./routes/warning'));
app.use('/api/publish', require('./routes/publish'));
app.use('/api/receipt', require('./routes/receipt'));
app.use('/api/report', require('./routes/report'));
app.use('/api/ops-log', require('./routes/ops-log'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.BACKEND_PORT || 3001;
const host = '127.0.0.1';
app.listen(PORT, host, () => {
  console.log(`[server] Backend API running at http://${host}:${PORT}`);
});