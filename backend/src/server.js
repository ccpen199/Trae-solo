require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const db = require('./database');
const casesRouter = require('./routes/cases');
const investigationRouter = require('./routes/investigation');
const mediationRouter = require('./routes/mediation');
const agreementRouter = require('./routes/agreement');
const usersRouter = require('./routes/users');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58868;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48868}`,
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/cases', casesRouter);
app.use('/api/investigation', investigationRouter);
app.use('/api/mediation', mediationRouter);
app.use('/api/agreement', agreementRouter);
app.use('/api/users', usersRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`社区矛盾调解系统后端服务已启动`);
  console.log(`监听地址: http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});
