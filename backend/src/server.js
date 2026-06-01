require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const residentsRouter = require('./routes/residents');
const rulesRouter = require('./routes/rules');
const activitiesRouter = require('./routes/activities');
const exchangeRouter = require('./routes/exchange');
const publicationRouter = require('./routes/publication');

require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58864;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48864}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/residents', residentsRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/exchange', exchangeRouter);
app.use('/api/publication', publicationRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});
