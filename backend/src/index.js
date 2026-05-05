require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const usersRouter = require('./routes/users');
const eCurrencyRouter = require('./routes/eCurrency');
const goldCoinsRouter = require('./routes/goldCoins');

const app = express();
const PORT = process.env.PORT || 20768;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:30768';

const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/e-currency', eCurrencyRouter);
app.use('/api/gold-coins', goldCoinsRouter);

async function startServer() {
  try {
    await initDatabase();
    console.log('数据库初始化完成');
    
    app.listen(PORT, () => {
      console.log(`PMS积分激励系统后端服务已启动`);
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API文档说明:`);
      console.log(`  - GET /health                            健康检查`);
      console.log(`  - GET /api/users/current                  获取当前用户`);
      console.log(`  - GET /api/users/hotels                   获取所有客栈列表`);
      console.log(`  - GET /api/users/operators                获取操作人列表`);
      console.log(`  - GET /api/e-currency/balance             获取E币余额`);
      console.log(`  - GET /api/e-currency/records             获取E币明细记录`);
      console.log(`  - GET /api/e-currency/operators-with-records 获取有记录的操作人`);
      console.log(`  - GET /api/e-currency/hotels-with-records    获取有记录的客栈`);
      console.log(`  - GET /api/gold-coins/hotels-with-gold    获取有金币的客栈列表`);
      console.log(`  - GET /api/gold-coins/balance              获取指定客栈金币余额`);
      console.log(`  - GET /api/gold-coins/records              获取金币明细记录`);
      console.log(`  - GET /api/gold-coins/operators-with-records 获取指定客栈有记录的操作人`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();
