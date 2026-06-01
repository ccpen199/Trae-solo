require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const casesRouter = require('./routes/cases');
const alertsRouter = require('./routes/alerts');
const tasksRouter = require('./routes/tasks');
const statsRouter = require('./routes/stats');
const patientsRouter = require('./routes/patients');

const PORT = process.env.BACKEND_PORT || 56892;
const DB_PATH = path.join(__dirname, '..', '..', process.env.DATABASE_PATH || './data/app.sqlite');

const app = express();

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 46892}`],
  credentials: true
}));

app.use(express.json());

initDatabase(DB_PATH);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/cases', casesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/stats', statsRouter);
app.use('/api/patients', patientsRouter);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
