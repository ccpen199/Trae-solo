import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import partsRouter from './routes/parts.js';
import stockInRouter from './routes/stockIn.js';
import stockOutRouter from './routes/stockOut.js';
import workOrdersRouter from './routes/workOrders.js';
import inventoryRouter from './routes/inventory.js';
import dashboardRouter from './routes/dashboard.js';
import commonRouter from './routes/common.js';
import './database.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/parts', partsRouter);
app.use('/api/stock-in', stockInRouter);
app.use('/api/stock-out', stockOutRouter);
app.use('/api/work-orders', workOrdersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/common', commonRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error', error: err.message });
});

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function startServer() {
  const portAvailable = await checkPort(PORT);
  if (!portAvailable) {
    console.error(`Port ${PORT} is already in use. Please check and try again.`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`
========================================
  维修服务备件管理系统 - 后端服务
  服务端口: ${PORT}
  数据库: SQLite (./data/spare_parts.db)
  API 文档:
    GET  /api/health - 健康检查
    GET  /api/parts - 备件列表
    POST /api/parts - 创建备件
    GET  /api/stock-in - 入库列表
    POST /api/stock-in - 创建入库单
    GET  /api/stock-out - 出库列表
    GET  /api/work-orders - 工单列表
    POST /api/work-orders - 创建工单
    GET  /api/inventory/stock - 库存列表
    GET  /api/inventory/transactions - 库存流水
    GET  /api/dashboard/stats - 看板统计
========================================
    `);
  });
}

startServer();
