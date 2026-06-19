import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';
import { Device, Order, OrderStatus, OrderType } from '../types';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const orders = db.prepare(`
    SELECT o.*, d.name as deviceName, d.type as deviceType
    FROM orders o
    LEFT JOIN devices d ON o.deviceId = d.id
    WHERE o.userId = ?
    ORDER BY o.startTime DESC
    LIMIT 50
  `).all(req.user.userId);

  res.json(orders);
});

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { deviceId, type, duration } = req.body;

  if (!deviceId || !type) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const db = getDb();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as Device | undefined;

  if (!device) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  if (device.status === 'running') {
    res.status(400).json({ error: '设备正在使用中' });
    return;
  }

  if (device.status === 'fault') {
    res.status(400).json({ error: '设备故障，暂不可用' });
    return;
  }

  const validTypes: OrderType[] = ['washer', 'water_dispenser', 'shower'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: '无效的订单类型' });
    return;
  }

  const orderId = uuidv4();
  const estimatedDuration = duration || 30;
  const amount = device.pricing * (estimatedDuration / 30);
  const status: OrderStatus = 'pending';

  db.prepare(`
    INSERT INTO orders (id, userId, deviceId, type, startTime, endTime, duration, amount, status, payMethod, refundAmount)
    VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, 'balance', 0)
  `).run(orderId, req.user.userId, deviceId, type, estimatedDuration, amount, status);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;
  res.status(201).json(order);
});

router.post('/:id/start', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;

  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  if (order.userId !== req.user.userId) {
    res.status(403).json({ error: '无权操作此订单' });
    return;
  }

  if (order.status !== 'pending') {
    res.status(400).json({ error: '订单状态不正确' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders SET status = 'active', startTime = ? WHERE id = ?
  `).run(now, req.params.id);

  db.prepare(`
    UPDATE devices SET status = 'running' WHERE id = ?
  `).run(order.deviceId);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order;
  res.json(updated);
});

router.post('/:id/finish', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;

  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  if (order.userId !== req.user.userId) {
    res.status(403).json({ error: '无权操作此订单' });
    return;
  }

  if (order.status !== 'active') {
    res.status(400).json({ error: '订单状态不正确' });
    return;
  }

  const now = new Date().toISOString();
  let actualDuration = order.duration;

  if (order.startTime) {
    const start = new Date(order.startTime).getTime();
    const end = new Date(now).getTime();
    actualDuration = Math.max(1, Math.round((end - start) / 60000));
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(order.deviceId) as Device | undefined;
  const finalAmount = device ? device.pricing * (actualDuration / 30) : order.amount;

  db.prepare(`
    UPDATE orders SET status = 'completed', endTime = ?, duration = ?, amount = ? WHERE id = ?
  `).run(now, actualDuration, finalAmount, req.params.id);

  db.prepare(`
    UPDATE devices SET status = 'idle' WHERE id = ?
  `).run(order.deviceId);

  if (finalAmount > 0) {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(finalAmount, req.user.userId);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order;
  res.json(updated);
});

router.post('/:id/refund', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { refundAmount, reason } = req.body;

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;

  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  if (order.userId !== req.user.userId) {
    res.status(403).json({ error: '无权操作此订单' });
    return;
  }

  if (order.status === 'refunded') {
    res.status(400).json({ error: '订单已退款' });
    return;
  }

  const amount = refundAmount || order.amount;

  db.prepare(`
    UPDATE orders SET status = 'refunded', refundAmount = ? WHERE id = ?
  `).run(amount, req.params.id);

  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, req.user.userId);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order;
  res.json(updated);
});

router.post('/:id/pay', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { payMethod } = req.body;

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;

  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }

  if (order.userId !== req.user.userId) {
    res.status(403).json({ error: '无权操作此订单' });
    return;
  }

  if (order.status !== 'pending') {
    res.status(400).json({ error: '订单状态不正确' });
    return;
  }

  db.prepare(`
    UPDATE orders SET payMethod = ? WHERE id = ?
  `).run(payMethod || 'balance', req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order;
  res.json(updated);
});

export default router;
