require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58798;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48798}`,
  credentials: true
}));

app.use(bodyParser.json());

const applicationsRouter = require('./routes/applications');
const blacklistRouter = require('./routes/blacklist');
const rulesRouter = require('./routes/rules');
const graphRouter = require('./routes/graph');

app.use('/api/applications', applicationsRouter);
app.use('/api/blacklist', blacklistRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/graph', graphRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务启动成功: http://127.0.0.1:${PORT}`);
});

module.exports = app;
