import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];

  if (req.user.role === 'customer') {
    whereConditions.push('customer_id = ?');
    params.push(req.user.id);
  }

  if (status) {
    whereConditions.push('status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM business_orders ${whereClause}
  `);
  const { total } = countStmt.get(...params);

  const stmt = db.prepare(`
    SELECT * FROM business_orders 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const orders = stmt.all(...params, parseInt(limit), offset);

  const statusMap = {
    'pending': '待开票',
    'invoiced': '已开票',
    'settled': '已结票'
  };

  const ordersWithStatusName = orders.map(order => ({
    ...order,
    status_name: statusMap[order.status] || order.status
  }));

  res.json({
    orders: ordersWithStatusName,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit)
    }
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const order = db.prepare('SELECT * FROM business_orders WHERE id = ?').get(id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
    return res.status(403).json({ error: '无权访问此订单' });
  }

  const invoices = db.prepare(`
    SELECT * FROM invoice_requests WHERE order_no = ? ORDER BY created_at DESC
  `).all(order.order_no);

  const statusMap = {
    'pending': '待开票',
    'invoiced': '已开票',
    'settled': '已结票'
  };

  res.json({
    order: {
      ...order,
      status_name: statusMap[order.status] || order.status
    },
    invoices
  });
});

router.post('/', requireRoles('customer', 'sales'), (req, res) => {
  const { order_no, customer_name, amount } = req.body;

  if (!order_no || !customer_name || !amount) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const existing = db.prepare('SELECT * FROM business_orders WHERE order_no = ?').get(order_no);
  if (existing) {
    return res.status(400).json({ error: '订单号已存在' });
  }

  const orderId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO business_orders (
      id, order_no, customer_id, customer_name, amount, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    order_no,
    req.user.role === 'customer' ? req.user.id : null,
    customer_name,
    amount,
    'pending',
    now
  );

  const createdOrder = db.prepare('SELECT * FROM business_orders WHERE id = ?').get(orderId);
  
  res.status(201).json({ order: createdOrder });
});

export default router;
