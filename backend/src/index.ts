import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getDb } from './database.js';
import authRouter from './routes/auth.js';
import opportunityRouter from './routes/opportunity.js';
import negotiationRouter from './routes/negotiation.js';
import contractRouter from './routes/contract.js';
import orderRouter from './routes/order.js';
import logisticsRouter from './routes/logistics.js';
import traceRouter from './routes/trace.js';
import notificationRouter from './routes/notification.js';
import { authMiddleware } from './middleware.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', authMiddleware, (req, res) => {
  const db = getDb();
  const stats: Record<string, any> = {};

  stats.opportunities = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'supply' THEN 1 ELSE 0 END) as supply_count,
      SUM(CASE WHEN type = 'demand' THEN 1 ELSE 0 END) as demand_count,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
    FROM business_opportunities
  `).get() as any;

  stats.orders = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) as disputed,
      COALESCE(SUM(total_amount), 0) as total_amount
    FROM orders
  `).get() as any;

  stats.users = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN role = 'recycler' THEN 1 ELSE 0 END) as recycler_count,
      SUM(CASE WHEN role = 'producer' THEN 1 ELSE 0 END) as producer_count,
      SUM(CASE WHEN role = 'inspector' THEN 1 ELSE 0 END) as inspector_count,
      SUM(CASE WHEN role = 'carrier' THEN 1 ELSE 0 END) as carrier_count
    FROM users
    WHERE role != 'admin'
  `).get() as any;

  stats.enterprises = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM enterprises
  `).get() as any;

  stats.category_breakdown = db.prepare(`
    SELECT category, 
           COUNT(*) as count,
           COALESCE(SUM(CASE WHEN type = 'supply' THEN quantity ELSE 0 END), 0) as supply_volume,
           COALESCE(SUM(CASE WHEN type = 'demand' THEN quantity ELSE 0 END), 0) as demand_volume,
           ROUND(AVG((min_price + max_price) / 2), 2) as avg_price
    FROM business_opportunities
    GROUP BY category
    ORDER BY count DESC
  `).all() as any[];

  stats.recent_orders = db.prepare(`
    SELECT o.*, c.category, c.sub_category,
           eb.company_name as buyer_name, es.company_name as seller_name
    FROM orders o
    JOIN contracts c ON o.contract_id = c.id
    JOIN enterprises eb ON o.buyer_id = eb.user_id
    JOIN enterprises es ON o.seller_id = es.user_id
    ORDER BY o.created_at DESC LIMIT 10
  `).all() as any[];

  stats.trace_codes = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN min_env_sync_status = 'synced' THEN 1 ELSE 0 END) as env_synced
    FROM trace_codes
  `).get() as any;

  res.json(stats);
});

app.use('/api/auth', authRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/negotiations', negotiationRouter);
app.use('/api/contracts', contractRouter);
app.use('/api/orders', orderRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/trace', traceRouter);
app.use('/api/notifications', notificationRouter);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('join_order', (orderId) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('join_opportunity', (oppId) => {
    socket.join(`opportunity:${oppId}`);
  });

  socket.on('disconnect', () => {
    //
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ 
    error: '服务器内部错误', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  getDb();
  console.log(`\n🚀 再生资源B2B撮合交易平台 API 服务器已启动`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`⚡ WebSocket: 已启用\n`);
});

export { io };
export default app;
