require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const db = require('./database');
const { findMatchingRiders, matchOrderToRider } = require('./matchingEngine');

const app = express();
const PORT = process.env.BACKEND_PORT || 56934;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46934}`
}));
app.use(express.json({ limit: '10mb' }));

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/riders', (req, res) => {
  const riders = db.prepare('SELECT * FROM riders').all();
  res.json({ data: riders });
});

app.get('/api/riders/:id', (req, res) => {
  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id);
  if (!rider) return res.status(404).json({ error: '骑手不存在' });
  
  const skills = db.prepare('SELECT category, proficiency FROM rider_skills WHERE rider_id = ?').all(req.params.id);
  rider.skills = skills;
  res.json({ data: rider });
});

app.post('/api/riders/:id/location', (req, res) => {
  const { latitude, longitude } = req.body;
  db.prepare('UPDATE riders SET latitude = ?, longitude = ? WHERE id = ?').run(latitude, longitude, req.params.id);
  res.json({ success: true });
});

function generateOrderNo() {
  const date = new Date();
  const prefix = 'SD' + date.getFullYear().toString().slice(-2) + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + random;
}

app.post('/api/orders', (req, res) => {
  const orderNo = generateOrderNo();
  const { 
    category, sub_category, weight,
    pickup_address, pickup_lat, pickup_lng, pickup_name, pickup_phone,
    delivery_address, delivery_lat, delivery_lng, delivery_name, delivery_phone,
    enterprise_type, custom_data
  } = req.body;

  const result = db.prepare(`
    INSERT INTO orders (
      order_no, category, sub_category, weight,
      pickup_address, pickup_lat, pickup_lng, pickup_name, pickup_phone,
      delivery_address, delivery_lat, delivery_lng, delivery_name, delivery_phone,
      enterprise_type, custom_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNo, category, sub_category, weight || 0,
    pickup_address, pickup_lat, pickup_lng, pickup_name, pickup_phone,
    delivery_address, delivery_lat, delivery_lng, delivery_name, delivery_phone,
    enterprise_type, custom_data ? JSON.stringify(custom_data) : null
  );

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

app.get('/api/orders', (req, res) => {
  const { status, rider_id } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (rider_id) {
    sql += ' AND rider_id = ?';
    params.push(rider_id);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT 100';
  
  const orders = db.prepare(sql).all(...params);
  res.json({ data: orders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  if (order.custom_data) {
    order.custom_data = JSON.parse(order.custom_data);
  }
  
  res.json({ data: order });
});

app.post('/api/orders/:id/match', (req, res) => {
  const result = matchOrderToRider(parseInt(req.params.id));
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get('/api/orders/:id/match-candidates', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const result = findMatchingRiders(order);
  res.json(result);
});

app.post('/api/orders/:id/pickup', (req, res) => {
  db.prepare('UPDATE orders SET status = ?, pickup_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('picking', req.params.id);
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(order);
});

app.post('/api/orders/:id/track', (req, res) => {
  const { rider_id, latitude, longitude } = req.body;
  db.prepare(`
    INSERT INTO order_tracking (order_id, rider_id, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, rider_id, latitude, longitude);
  
  res.json({ success: true });
});

app.get('/api/orders/:id/tracking', (req, res) => {
  const tracks = db.prepare(`
    SELECT * FROM order_tracking 
    WHERE order_id = ? 
    ORDER BY timestamp ASC
  `).all(req.params.id);
  
  res.json({ data: tracks });
});

app.post('/api/orders/:id/deliver', (req, res) => {
  db.prepare(`
    UPDATE orders 
    SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (order.enterprise_type === 'lawfirm') {
    const config = db.prepare('SELECT config FROM enterprise_configs WHERE enterprise_type = ?').get('lawfirm');
    if (config) {
      const cfg = JSON.parse(config.config);
      if (cfg.autoArchive) {
        const archiveData = {
          orderNo: order.order_no,
          deliveryAddress: order.delivery_address,
          deliveredAt: order.delivered_at
        };
        db.prepare(`
          INSERT INTO document_archives (order_id, document_type, archive_data)
          VALUES (?, 'delivery_receipt', ?)
        `).run(order.id, JSON.stringify(archiveData));
      }
    }
  }
  
  res.json(order);
});

app.post('/api/orders/:id/sign', (req, res) => {
  const { signer_name, signature_data, photo_path } = req.body;
  const orderId = req.params.id;
  
  const result = db.prepare(`
    INSERT INTO signatures (order_id, signer_name, signature_data, photo_path, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    orderId, 
    signer_name, 
    signature_data, 
    photo_path || null,
    req.ip,
    req.get('User-Agent')
  );
  
  const signature = db.prepare('SELECT * FROM signatures WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(signature);
});

app.get('/api/orders/:id/signature', (req, res) => {
  const signature = db.prepare('SELECT * FROM signatures WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(req.params.id);
  if (!signature) return res.status(404).json({ error: '无签收记录' });
  res.json({ data: signature });
});

app.post('/api/orders/:id/timeout-check', (req, res) => {
  const { force } = req.body || {};
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  let shouldTrigger = false;
  let elapsedMinutes = 0;
  let originalRider = null;
  
  if (order.rider_id) {
    originalRider = db.prepare('SELECT id, name, phone FROM riders WHERE id = ?').get(order.rider_id);
  }
  
  if (order.status === 'matched' || order.status === 'picking') {
    const matchedAt = new Date(order.matched_at).getTime();
    const now = Date.now();
    elapsedMinutes = (now - matchedAt) / 60000;
    
    shouldTrigger = elapsedMinutes >= 5 || force;
  }
  
  if (shouldTrigger) {
    const newTimeoutCount = order.timeout_count + 1;
    const oldRider = originalRider;
    
    const newOrder = matchOrderToRider(parseInt(req.params.id), true);
    
    if (newOrder.success) {
      db.prepare(`
        UPDATE orders 
        SET timeout_count = ?, is_backup = 1
        WHERE id = ?
      `).run(newTimeoutCount, req.params.id);
      
      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
      const newRider = db.prepare('SELECT id, name, phone FROM riders WHERE id = ?').get(updatedOrder.rider_id);
      
      return res.json({
        triggered: true,
        message: force ? '强制触发替补骑手机制（模拟超时5分钟）' : '已触发替补骑手机制',
        originalRider: oldRider,
        newRider: newRider,
        timeoutCount: newTimeoutCount,
        elapsedMinutes: force ? 5 : Math.round(elapsedMinutes * 10) / 10,
        isFused: true,
        fuseReason: force ? '手动强制熔断' : '超时自动熔断',
        timestamp: new Date().toISOString(),
        candidates: newOrder.allCandidates,
        matchingEngine: {
          durationMs: newOrder.durationMs,
          weightConfig: {
            distance: 35,
            onTimeRate: 25,
            loadCapacity: 15,
            categorySkill: 25
          }
        }
      });
    }
  }
  
  res.json({
    triggered: false,
    message: '配送正常进行中',
    elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
    currentRider: originalRider,
    orderStatus: order.status
  });
});

app.post('/api/complaints', (req, res) => {
  const { order_id, category, description } = req.body;
  const result = db.prepare(`
    INSERT INTO complaints (order_id, category, description)
    VALUES (?, ?, ?)
  `).run(order_id, category, description);
  
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(complaint);
});

app.get('/api/dashboard/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get().count;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;
  const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('matched', 'picking')").get().count;
  const onlineRiders = db.prepare("SELECT COUNT(*) as count FROM riders WHERE status = 'online'").get().count;
  
  const avgResponse = db.prepare(`
    SELECT AVG(strftime('%s', matched_at) - strftime('%s', created_at)) as avg_seconds
    FROM orders 
    WHERE matched_at IS NOT NULL
  `).get();
  
  const onTimeRate = db.prepare(`
    SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as rate
    FROM orders 
    WHERE status = 'delivered' 
    AND delivered_at <= DATETIME(created_at, '+45 minutes')
  `).get();
  
  const complaintsByCategory = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM complaints 
    GROUP BY category
  `).all();
  
  const cityStats = db.prepare(`
    SELECT 
      CASE 
        WHEN pickup_address LIKE '%上海%' THEN '上海市'
        WHEN pickup_address LIKE '%北京%' THEN '北京市'
        WHEN pickup_address LIKE '%广州%' THEN '广州市'
        WHEN pickup_address LIKE '%深圳%' THEN '深圳市'
        ELSE '其他城市'
      END as city,
      COUNT(*) as order_count,
      AVG(strftime('%s', matched_at) - strftime('%s', created_at)) as avg_response
    FROM orders
    WHERE matched_at IS NOT NULL
    GROUP BY city
    ORDER BY order_count DESC
  `).all();
  
  const tenMinuteRate = db.prepare(`
    SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE matched_at IS NOT NULL) as rate
    FROM orders 
    WHERE matched_at IS NOT NULL
    AND strftime('%s', matched_at) - strftime('%s', created_at) <= 600
  `).get();
  
  res.json({
    totalOrders,
    completedOrders,
    pendingOrders,
    activeOrders,
    onlineRiders,
    avgResponseTime: avgResponse.avg_seconds ? Math.round(avgResponse.avg_seconds) : 0,
    onTimeDeliveryRate: onTimeRate.rate || 0,
    tenMinuteArrivalRate: tenMinuteRate.rate || 0,
    complaintsByCategory,
    cityStats: cityStats.map(c => ({
      city: c.city,
      orderCount: c.order_count,
      avgResponse: c.avg_response ? Math.round(c.avg_response) : 0
    }))
  });
});

app.get('/api/enterprise/configs', (req, res) => {
  const configs = db.prepare('SELECT * FROM enterprise_configs').all();
  configs.forEach(c => c.config = JSON.parse(c.config));
  res.json({ data: configs });
});

app.get('/api/archives', (req, res) => {
  const archives = db.prepare(`
    SELECT da.*, o.order_no 
    FROM document_archives da 
    JOIN orders o ON da.order_id = o.id 
    ORDER BY da.archived_at DESC 
    LIMIT 50
  `).all();
  archives.forEach(a => a.archive_data = JSON.parse(a.archive_data));
  res.json({ data: archives });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`配送系统后端运行在 http://127.0.0.1:${PORT}`);
});
