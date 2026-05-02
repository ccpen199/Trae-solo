require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');
const ruleEngine = require('./engines/rule-engine');
const variableFactory = require('./engines/variable-factory');
const actionHandler = require('./engines/action-handler');
const backtestSimulator = require('./engines/backtest-simulator');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 110891;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:110892',
  credentials: true
}));

app.use(express.json());

database.init();

const routes = require('./routes');
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`风控规则引擎后端服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API 文档: http://localhost:${PORT}/api`);
});

module.exports = app;
