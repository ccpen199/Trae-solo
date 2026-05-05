require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database/init');
const InventoryService = require('./services/inventoryService');

const userRoutes = require('./routes/userRoutes');
const businessRoutes = require('./routes/businessRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 20776;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:30776';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:30776'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('正在初始化数据库...');
initDatabase();
console.log('数据库初始化完成');

console.log('正在初始化产品库存...');
InventoryService.initDatabase();
console.log('产品库存初始化完成');

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '去哪儿用户积分成长体系服务运行中',
    timestamp: new Date().toISOString(),
    services: {
      paymentCenter: 'active',
      userCenter: 'active',
      businessLines: 'active'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '去哪儿用户积分成长体系 API',
    version: '1.0.0',
    endpoints: {
      user: [
        'GET /api/user/info/:userId - 获取用户信息(含等级、特权)',
        'GET /api/user/points/:userId - 获取用户积分及流水',
        'GET /api/user/growth/:userId - 获取用户成长值记录',
        'GET /api/user/orders/:userId - 获取用户订单列表',
        'GET /api/user/levels - 获取所有等级及特权',
        'GET /api/user/discount/:userId/:businessLineId - 获取用户等级优惠',
        'GET /api/user/stats - 获取运营统计数据'
      ],
      business: [
        'GET /api/business/lines - 获取所有业务线',
        'GET /api/business/line/:id - 获取业务线详情',
        'GET /api/business/products/:businessLineId - 获取业务线产品',
        'POST /api/business/purchase - 模拟业务线消费(完整链路)',
        'GET /api/business/accounts - 获取所有业务线积分账户',
        'GET /api/business/account/:businessLineId - 获取指定业务线积分账户'
      ],
      order: [
        'GET /api/order/detail/:orderId - 获取订单详情',
        'POST /api/order/create - 创建订单',
        'POST /api/order/pay - 完成支付',
        'POST /api/order/distribute-points - 发放积分'
      ]
    },
    testUser: {
      userId: 1,
      username: 'demo_user',
      description: '演示用户，可用于测试所有API'
    },
    businessLines: {
      description: '8条业务线，各自有不同的成长值/积分系数',
      lines: [
        { id: 1, code: 'HOTEL', name: '酒店', growthCoeff: 2.0, pointCoeff: 1.5 },
        { id: 2, code: 'FLIGHT', name: '机票', growthCoeff: 1.5, pointCoeff: 1.2 },
        { id: 3, code: 'TICKET', name: '门票', growthCoeff: 1.0, pointCoeff: 1.0 },
        { id: 4, code: 'TRAIN', name: '火车票', growthCoeff: 1.0, pointCoeff: 1.0 },
        { id: 5, code: 'CAR', name: '用车', growthCoeff: 1.2, pointCoeff: 1.1 },
        { id: 6, code: 'VACATION', name: '度假', growthCoeff: 2.5, pointCoeff: 1.8 },
        { id: 7, code: 'GROUP_BUY', name: '团购', growthCoeff: 0.8, pointCoeff: 0.8 },
        { id: 8, code: 'INSURANCE', name: '保险', growthCoeff: 1.8, pointCoeff: 1.5 }
      ]
    },
    userLevels: {
      description: '4个用户等级，按成长值划分',
      levels: [
        { id: 1, code: 'LITTLE_CAMEL', name: '小骆驼', minGrowth: 0, maxGrowth: 999 },
        { id: 2, code: 'COPPER_CAMEL', name: '铜骆驼', minGrowth: 1000, maxGrowth: 4999 },
        { id: 3, code: 'SILVER_CAMEL', name: '银骆驼', minGrowth: 5000, maxGrowth: 19999 },
        { id: 4, code: 'GOLDEN_CAMEL', name: '金骆驼', minGrowth: 20000, maxGrowth: null }
      ]
    }
  });
});

app.use('/api/user', userRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/order', orderRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  去哪儿用户积分成长体系 - 后端服务`);
  console.log(`========================================`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API根路径: http://localhost:${PORT}/api`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  前端地址: ${FRONTEND_URL}`);
  console.log(`========================================`);
  console.log(`  测试用户ID: 1 (demo_user)`);
  console.log(`  数据库: SQLite (${process.env.DB_PATH || './data/app.sqlite'})`);
  console.log(`========================================\n`);
});

module.exports = app;
