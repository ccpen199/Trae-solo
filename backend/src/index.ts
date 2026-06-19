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
import { authMiddleware, type AuthRequest } from './middleware.js';

const app = express();
const server = http.createServer(app);
const BACKEND_HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const BACKEND_PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);
const FRONTEND_ORIGIN = `http://${process.env.FRONTEND_HOST || '127.0.0.1'}:${process.env.FRONTEND_PORT || 5173}`;
const allowedOrigins = [
  FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const stats: Record<string, any> = {};
  const userId = req.user!.id;
  const role = req.user!.role;
  const isAdmin = role === 'admin';

  if (isAdmin) {
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

    stats.trace_codes = db.prepare(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN min_env_sync_status = 'synced' THEN 1 ELSE 0 END) as env_synced
      FROM trace_codes
    `).get() as any;

    stats.recent_orders = db.prepare(`
      SELECT o.*, c.category, c.sub_category,
             eb.company_name as buyer_name, es.company_name as seller_name
      FROM orders o
      JOIN contracts c ON o.contract_id = c.id
      JOIN enterprises eb ON o.buyer_id = eb.user_id
      JOIN enterprises es ON o.seller_id = es.user_id
      ORDER BY o.created_at DESC LIMIT 10
    `).all() as any[];
  } else {
    stats.is_personal = true;
    const buyerOrSeller = role === 'recycler' ? 'buyer' : 'seller';
    const enterprise = db.prepare('SELECT id FROM enterprises WHERE user_id = ?').get(userId) as any;
    const enterpriseId = enterprise?.id;

    stats.opportunities = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'supply' THEN 1 ELSE 0 END) as supply_count,
        SUM(CASE WHEN type = 'demand' THEN 1 ELSE 0 END) as demand_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM business_opportunities
      WHERE publisher_id = ?
    `).get(userId) as any;

    const roleWhere = role === 'recycler' 
      ? 'buyer_id = ?' 
      : role === 'producer' 
        ? 'seller_id = ?' 
        : role === 'inspector' 
          ? 'inspector_id = ?'
          : 'carrier_id = ?';

    stats.orders = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) as disputed,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM orders
      WHERE ${roleWhere}
    `).get(userId) as any;

    stats.orders.total = stats.orders.total || 0;
    stats.orders.completed = stats.orders.completed || 0;
    stats.orders.disputed = stats.orders.disputed || 0;
    stats.orders.total_amount = stats.orders.total_amount || 0;

    if (role === 'recycler' || role === 'producer') {
      const negWhere = role === 'recycler' ? 'initiator_id = ?' : 'opponent_id = ?';
      stats.negotiations = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
               SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM negotiations
        WHERE ${negWhere}
      `).get(userId) as any;
      stats.negotiations.total = stats.negotiations.total || 0;
      stats.negotiations.accepted = stats.negotiations.accepted || 0;
      stats.negotiations.pending = stats.negotiations.pending || 0;

      const contractWhere = role === 'recycler' ? 'buyer_id = ?' : 'seller_id = ?';
      stats.contracts = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN signing_status = 'fully_signed' THEN 1 ELSE 0 END) as signed
        FROM contracts
        WHERE ${contractWhere}
      `).get(userId) as any;
      stats.contracts.total = stats.contracts.total || 0;
      stats.contracts.signed = stats.contracts.signed || 0;

      stats.payments = db.prepare(`
        SELECT COUNT(*) as total,
               COALESCE(SUM(CASE WHEN status = 'frozen' THEN amount ELSE 0 END), 0) as frozen_amount,
               COALESCE(SUM(CASE WHEN status = 'released' THEN amount ELSE 0 END), 0) as released_amount
        FROM payment_records
        WHERE payer_id = ? OR payee_id = ?
      `).all(userId, userId).reduce((acc: any, row: any) => ({
        total: row.total,
        frozen_amount: row.frozen_amount,
        released_amount: row.released_amount
      }), { total: 0, frozen_amount: 0, released_amount: 0 }) as any;

      stats.trace_codes = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN min_env_sync_status = 'synced' THEN 1 ELSE 0 END) as env_synced
        FROM trace_codes
        WHERE enterprise_id = ?
      `).get(enterpriseId) as any;
      stats.trace_codes.total = stats.trace_codes?.total || 0;
      stats.trace_codes.env_synced = stats.trace_codes?.env_synced || 0;

      stats.logistics = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
        FROM logistics_orders
        WHERE order_id IN (SELECT id FROM orders WHERE ${roleWhere})
      `).get(userId) as any;
      stats.logistics.total = stats.logistics.total || 0;
      stats.logistics.delivered = stats.logistics.delivered || 0;

      stats.recent_orders = db.prepare(`
        SELECT o.*, c.category, c.sub_category,
               eb.company_name as buyer_name, es.company_name as seller_name
        FROM orders o
        JOIN contracts c ON o.contract_id = c.id
        JOIN enterprises eb ON o.buyer_id = eb.user_id
        JOIN enterprises es ON o.seller_id = es.user_id
        WHERE o.${roleWhere}
        ORDER BY o.created_at DESC LIMIT 10
      `).all(userId) as any[];
    } else if (role === 'inspector') {
      stats.inspections = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued
        FROM inspection_reports
        WHERE inspector_id = ?
      `).get(userId) as any;
      stats.inspections.total = stats.inspections.total || 0;
      stats.inspections.issued = stats.inspections.issued || 0;

      stats.recent_orders = db.prepare(`
        SELECT o.*, c.category, c.sub_category,
               eb.company_name as buyer_name, es.company_name as seller_name
        FROM orders o
        JOIN contracts c ON o.contract_id = c.id
        JOIN enterprises eb ON o.buyer_id = eb.user_id
        JOIN enterprises es ON o.seller_id = es.user_id
        WHERE o.inspector_id = ?
        ORDER BY o.created_at DESC LIMIT 10
      `).all(userId) as any[];
    } else if (role === 'carrier') {
      stats.logistics = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
               SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
               COALESCE(SUM(quoted_price), 0) as total_income
        FROM logistics_orders
        WHERE carrier_id = ?
      `).get(userId) as any;
      stats.logistics.total = stats.logistics.total || 0;
      stats.logistics.delivered = stats.logistics.delivered || 0;
      stats.logistics.in_transit = stats.logistics.in_transit || 0;
      stats.logistics.total_income = stats.logistics.total_income || 0;

      stats.recent_orders = db.prepare(`
        SELECT o.*, c.category, c.sub_category,
               eb.company_name as buyer_name, es.company_name as seller_name
        FROM orders o
        JOIN contracts c ON o.contract_id = c.id
        JOIN enterprises eb ON o.buyer_id = eb.user_id
        JOIN enterprises es ON o.seller_id = es.user_id
        WHERE o.carrier_id = ?
        ORDER BY o.created_at DESC LIMIT 10
      `).all(userId) as any[];
    }
  }

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

  stats._role = role;
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

server.listen(BACKEND_PORT, BACKEND_HOST, () => {
  getDb();
  console.log(`\n🚀 再生资源B2B撮合交易平台 API 服务器已启动`);
  console.log(`📡 监听地址: http://${BACKEND_HOST}:${BACKEND_PORT}`);
  console.log(`🌐 健康检查: http://${BACKEND_HOST}:${BACKEND_PORT}/api/health`);
  console.log(`⚡ WebSocket: 已启用\n`);
});

export { io };
export default app;
