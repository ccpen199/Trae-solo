const express = require('express');
const { db, saveDB, generateId } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const orders = db.orders.filter(o => o.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(orders);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const items = db.order_items.filter(oi => oi.order_id === order.id).map(oi => {
    const product = db.products.find(p => p.id === oi.product_id);
    return { ...oi, name: product?.name, image: product?.image };
  });
  res.json({ ...order, items });
});

router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { items, address, total_amount } = req.body;
  const order = {
    id: generateId('orders'),
    user_id: userId,
    total_amount,
    status: 'paid',
    address,
    created_at: new Date().toISOString()
  };
  db.orders.push(order);
  items.forEach(item => {
    db.order_items.push({
      id: generateId('order_items'),
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    });
  });
  db.carts = db.carts.filter(c => c.user_id !== userId);
  saveDB();
  res.json({ order_id: order.id, message: '订单创建成功' });
});

module.exports = router;
