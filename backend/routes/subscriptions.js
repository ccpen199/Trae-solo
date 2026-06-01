const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

function sendNotification(subscription, shipment, statusCode, statusName) {
  const content = `【运单状态提醒】运单 ${shipment.shipment_no} 状态已更新为：${statusName}\n\n货物信息：${shipment.product_name}\n航线：${shipment.origin} → ${shipment.destination}\n\n-- 空运运单管理系统`;
  
  const result = db.prepare(`
    INSERT INTO notifications (subscription_id, shipment_id, status_code, status_name, notification_type, recipient, content, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    subscription.id,
    shipment.id,
    statusCode,
    statusName,
    subscription.subscriber_email ? 'email' : 'sms',
    subscription.subscriber_email || subscription.subscriber_phone,
    content
  );
  
  console.log(`[Notification] Sent to ${subscription.subscriber_name}: ${statusName}`);
  return result;
}

router.post('/subscribe', (req, res) => {
  const { shipment_id, subscriber_name, subscriber_email, subscriber_phone, notify_departed, notify_arrived, notify_cleared, notify_available, notify_delivered } = req.body;
  
  if (!shipment_id || !subscriber_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const result = db.prepare(`
    INSERT INTO subscriptions (shipment_id, subscriber_name, subscriber_email, subscriber_phone, notify_departed, notify_arrived, notify_cleared, notify_available, notify_delivered)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    shipment_id,
    subscriber_name,
    subscriber_email || null,
    subscriber_phone || null,
    notify_departed ? 1 : 0,
    notify_arrived ? 1 : 0,
    notify_cleared ? 1 : 0,
    notify_available ? 1 : 0,
    notify_delivered ? 1 : 0
  );
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(shipment_id, 'subscribe', subscriber_name);
  
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(subscription);
});

router.get('/:shipment_id', (req, res) => {
  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE shipment_id = ? ORDER BY created_at DESC').all(req.params.shipment_id);
  res.json(subscriptions);
});

router.get('/notifications/:shipment_id', (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE shipment_id = ? ORDER BY created_at DESC').all(req.params.shipment_id);
  res.json(notifications);
});

router.delete('/:id', (req, res) => {
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(req.params.id);
  if (!subscription) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = { router, sendNotification };
