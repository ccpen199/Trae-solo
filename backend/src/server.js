require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const issuesRouter = require('./routes/issues');
const orgsRouter = require('./routes/organizations');

const app = express();
const PORT = process.env.BACKEND_PORT || 58843;

app.use(cors({
  origin: [`http://127.0.0.1:${process.env.FRONTEND_PORT || 48843}`, `http://localhost:${process.env.FRONTEND_PORT || 48843}`],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/issues', issuesRouter);
app.use('/api/organizations', orgsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`BIM平台后端服务已启动: http://127.0.0.1:${PORT}`);
});
