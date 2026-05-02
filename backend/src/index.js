require('dotenv').config();
const express = require('express');
const cors = require('cors');

const db = require('./db/schema');
const AuthService = require('./services/authService');
const { StateMachine } = require('./services/stateMachine');
const RulesEngine = require('./services/rulesEngine');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const arrivalRoutes = require('./routes/arrival');
const exceptionRoutes = require('./routes/exception');
const statisticsRoutes = require('./routes/statistics');
const mapRoutes = require('./routes/map');
const alarmRoutes = require('./routes/alarms');

const app = express();
const PORT = process.env.PORT || 11511;

app.use(cors({
  origin: ['http://localhost:11512', 'http://127.0.0.1:11512'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authService = new AuthService(db);
const stateMachine = new StateMachine(db);
const rulesEngine = new RulesEngine(db);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

app.use('/api/auth', authRoutes(authService));
app.use('/api/orders', orderRoutes(db, authService, stateMachine, rulesEngine));
app.use('/api/arrival', arrivalRoutes(db, authService, stateMachine, rulesEngine));
app.use('/api/exception', exceptionRoutes(db, authService, stateMachine, rulesEngine));
app.use('/api/statistics', statisticsRoutes(db, authService, stateMachine));
app.use('/api/map', mapRoutes(db, authService, rulesEngine));
app.use('/api/alarms', alarmRoutes(db, authService));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  智慧公交调度系统后端服务`);
  console.log(`========================================`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/health`);
  console.log(`  数据库: SQLite (${process.env.DB_PATH || './data/app.sqlite'})`);
  console.log(`  启动时间: ${new Date().toISOString()}`);
  console.log(`========================================`);
  console.log(`  默认账号:`);
  console.log(`  - 调度员: dispatcher01 / 123456`);
  console.log(`  - 司机: driver01 / 123456`);
  console.log(`  - 运营: operator01 / 123456`);
  console.log(`========================================`);
});

module.exports = app;
