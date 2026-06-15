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
