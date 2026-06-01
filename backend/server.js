require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 55873;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:45873',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dbPath = path.join(__dirname, process.env.DB_PATH || './data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

require('./database/init')(db);

app.use('/api/auth', require('./routes/auth')(db));
app.use('/api/users', require('./routes/users')(db));
app.use('/api/meetings', require('./routes/meetings')(db));
app.use('/api/control', require('./routes/control')(db));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, HOST, () => {
  console.log(`Meeting System Backend running at http://${HOST}:${PORT}`);
  console.log(`API Health Check: http://${HOST}:${PORT}/api/health`);
});

module.exports = { db, app };
