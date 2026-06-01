const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

function sendNotificationToSubscribers(shipmentId, statusCode, statusName) {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipmentId);
  if (!shipment) return;
  
  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE shipment_id = ?').all(shipmentId);
  
  const notifyFieldMap = {
    'departed': 'notify_departed',
    'arrived': 'notify_arrived',
    'customs_cleared': 'notify_cleared',
    'available': 'notify_available',
    'delivered': 'notify_delivered'
  };
  
  const notifyField = notifyFieldMap[statusCode];
  if (!notifyField) return;
  
  subscriptions.forEach(sub => {
    if (sub[notifyField]) {
      const content = `【运单状态提醒】运单 ${shipment.shipment_no} 状态已更新为：${statusName}\n\n货物：${shipment.product_name}\n航线：${shipment.origin} → ${shipment.destination}\n\n-- 空运运单管理系统`;
      
      db.prepare(`
        INSERT INTO notifications (subscription_id, shipment_id, status_code, status_name, notification_type, recipient, content, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        sub.id,
        shipmentId,
        statusCode,
        statusName,
        sub.subscriber_email ? 'email' : 'sms',
        sub.subscriber_email || sub.subscriber_phone,
        content
      );
      
      console.log(`[Notification] Sent to ${sub.subscriber_name}: ${statusName}`);
    }
  });
}

const STATUS_FLOW = [
  { code: 'booked', name: '已订舱' },
  { code: 'received', name: '已入仓' },
  { code: 'security_passed', name: '安检通过' },
  { code: 'departed', name: '已起飞' },
  { code: 'arrived', name: '已到达' },
  { code: 'customs_cleared', name: '已清关' },
  { code: 'available', name: '可提货' },
  { code: 'delivered', name: '已派送' }
];

router.get('/flow', (req, res) => {
  res.json(STATUS_FLOW);
});

router.post('/update', (req, res) => {
  const { shipment_id, status_code, status_name, status_time, location, remark, notify_customer } = req.body;
  
  if (!shipment_id || !status_code || !status_name || !status_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const result = db.prepare(`
    INSERT INTO flight_statuses (shipment_id, status_code, status_name, status_time, location, remark, notify_customer)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(shipment_id, status_code, status_name, status_time, location, remark, notify_customer ? 1 : 0);
  
  db.prepare('UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status_code, shipment_id);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(shipment_id, 'status_update:' + status_code, 'system');
  
  sendNotificationToSubscribers(shipment_id, status_code, status_name);
  
  const status = db.prepare('SELECT * FROM flight_statuses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(status);
});

router.get('/:shipment_id', (req, res) => {
  const statuses = db.prepare('SELECT * FROM flight_statuses WHERE shipment_id = ? ORDER BY status_time ASC').all(req.params.shipment_id);
  res.json(statuses);
});

router.post('/version', (req, res) => {
  const { shipment_id, change_type, change_reason, changed_by, master_waybill, house_waybill, flight_no, flight_date, pieces, weight } = req.body;
  
  if (!shipment_id || !change_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const newVersion = shipment.version + 1;
  
  db.prepare(`
    INSERT INTO waybill_versions (shipment_id, version, master_waybill, house_waybill, flight_no, flight_date, pieces, weight, change_type, change_reason, changed_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(shipment_id, newVersion, master_waybill || shipment.master_waybill, house_waybill || shipment.house_waybill, flight_no || shipment.flight_no, flight_date || shipment.flight_date, pieces !== undefined ? pieces : shipment.pieces, weight !== undefined ? weight : shipment.weight, change_type, change_reason, changed_by || 'operator');
  
  db.prepare('UPDATE shipments SET version = ?, master_waybill = ?, house_waybill = ?, flight_no = ?, flight_date = ?, pieces = ?, weight = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newVersion, master_waybill || shipment.master_waybill, house_waybill || shipment.house_waybill, flight_no || shipment.flight_no, flight_date || shipment.flight_date, pieces !== undefined ? pieces : shipment.pieces, weight !== undefined ? weight : shipment.weight, shipment_id);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(shipment_id, 'version_change:' + change_type, changed_by || 'operator');
  
  const version = db.prepare('SELECT * FROM waybill_versions WHERE shipment_id = ? ORDER BY id DESC LIMIT 1').get(shipment_id);
  res.status(201).json(version);
});

router.get('/versions/:shipment_id', (req, res) => {
  const versions = db.prepare('SELECT * FROM waybill_versions WHERE shipment_id = ? ORDER BY version DESC').all(req.params.shipment_id);
  res.json(versions);
});

module.exports = router;
