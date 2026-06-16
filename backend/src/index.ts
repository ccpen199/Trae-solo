import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initDatabase, db } from './database';
import { errorHandler } from './middleware/auth';
import { supplierManager } from './services/suppliers';
import { rechargeDiagnosticService } from './services/diagnostic';
import { commissionService } from './services/commission';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import commissionRoutes from './routes/commission';
import adminRoutes from './routes/admin';

const app = express();
const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || '59212');
const frontendUserUrl = process.env.FRONTEND_URL || `http://127.0.0.1:${process.env.FRONTEND_USER_PORT || 49212}`;
const frontendAdminUrl = process.env.FRONTEND_ADMIN_URL || `http://127.0.0.1:${process.env.FRONTEND_ADMIN_PORT || 49213}`;

app.use(cors({
  origin: [
    frontendUserUrl,
    frontendAdminUrl,
    `http://localhost:${process.env.FRONTEND_USER_PORT || 49212}`,
    `http://localhost:${process.env.FRONTEND_ADMIN_PORT || 49213}`
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

initDatabase();
supplierManager.init();
rechargeDiagnosticService.init();

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: Math.floor(Date.now() / 1000),
      version: '1.0.0'
    }
  });
});

app.post('/api/callback/:supplier', (req, res) => {
  try {
    const supplier = supplierManager.getSupplier(req.params.supplier);
    if (!supplier) return res.status(404).json({ success: false, message: '供应商不存在' });

    const callback = supplier.handleCallback(req.body);
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(callback.orderNo) as any;

    if (order) {
      const t = Math.floor(Date.now() / 1000);
      if (callback.status === 'success') {
        db.prepare(`UPDATE orders SET status = 'completed', supplier_order_id = ?, finish_time = ?, updated_at = ? WHERE id = ?`)
          .run(callback.supplierOrderId, t, t, order.id);
        commissionService.calculateCommission(order.id, order.user_id, order.final_amount);
      } else if (callback.status === 'failed') {
        db.prepare(`UPDATE orders SET status = 'failed', fail_reason = ?, supplier_code = ?, updated_at = ? WHERE id = ?`)
          .run(`${callback.errorCode}:${callback.errorMessage}`, req.params.supplier, t, order.id);
        rechargeDiagnosticService.diagnose(order.id);
      }
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get(['/api/auth/me', '/api/users/profile', '/api/user/profile'], (_req, res) => {
  const user: any = db.prepare(`
    SELECT id, phone, nickname, avatar, balance, level, total_commission, available_commission, created_at
    FROM users
    ORDER BY created_at ASC
    LIMIT 1
  `).get();
  res.json({
    success: true,
    data: user || {
      id: 'local-user',
      phone: '13800000000',
      nickname: '本地演示用户',
      avatar: null,
      balance: 0,
      level: 0,
      total_commission: 0,
      available_commission: 0
    }
  });
});

app.get('/api/search', (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const products = keyword
    ? db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.status = 1 AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
      ORDER BY p.is_hot DESC, p.sort ASC LIMIT 10
    `).all(like, like, like)
    : db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.status = 1
      ORDER BY p.is_hot DESC, p.sort ASC LIMIT 10
    `).all();
  const orders = keyword
    ? db.prepare(`
      SELECT id, order_no, product_name, status, final_amount, created_at
      FROM orders
      WHERE order_no LIKE ? OR product_name LIKE ? OR status LIKE ?
      ORDER BY created_at DESC LIMIT 10
    `).all(like, like, like)
    : db.prepare(`
      SELECT id, order_no, product_name, status, final_amount, created_at
      FROM orders
      ORDER BY created_at DESC LIMIT 10
    `).all();
  res.json({ success: true, data: { query: keyword, products, orders } });
});

app.get(['/api/admin/stats', '/api/admin/dashboard'], (_req, res) => {
  const totalOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders').get();
  const totalUsers: any = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  const totalProducts: any = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE status = 1').get();
  const totalSuppliers: any = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get();
  const pendingCommission: any = db.prepare("SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE status = 'pending'").get();
  res.json({
    success: true,
    data: {
      totalOrders: totalOrders.cnt,
      totalGMV: totalOrders.amount,
      totalUsers: totalUsers.cnt,
      totalProducts: totalProducts.cnt,
      totalSuppliers: totalSuppliers.cnt,
      pendingCommission: pendingCommission.amount
    }
  });
});

app.get('/api/orders', (_req, res) => {
  const items = db.prepare(`
    SELECT id, order_no, product_name, status, final_amount, recharge_account, created_at, updated_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 20
  `).all();
  res.json({ success: true, data: { list: items, total: items.length, page: 1, pageSize: 20 } });
});

app.get('/api/cart', (_req, res) => {
  const product: any = db.prepare(`
    SELECT id, name, price
    FROM products
    WHERE status = 1
    ORDER BY is_hot DESC, sort ASC
    LIMIT 1
  `).get();
  const items = product ? [{ id: product.id, name: product.name, price: product.price, quantity: 1 }] : [];
  res.json({
    success: true,
    data: {
      id: 'virtual-goods-local-cart',
      items,
      total: items.reduce((sum, item) => sum + Number(item.price || 0), 0)
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', commissionRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`后端服务已启动: http://${HOST}:${PORT}`);
  console.log(`API基础路径: http://${HOST}:${PORT}/api`);
  console.log(`健康检查: http://${HOST}:${PORT}/api/health`);
  console.log(`========================================\n`);
});

setInterval(() => {
  try {
    const today = new Date();
    if (today.getHours() === 2 && today.getMinutes() === 0) {
      commissionService.settleCommission();
    }
  } catch {
  }
}, 60 * 60 * 1000);

export default app;
