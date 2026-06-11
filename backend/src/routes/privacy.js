const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/info', authenticateToken, (req, res) => {
  const dataCategories = [
    {
      category: '个人信息',
      description: '您的账号信息和个人资料',
      data_points: ['用户名', '邮箱', '昵称', '头像', '手机号']
    },
    {
      category: '设备数据',
      description: '您绑定的设备信息和骑行数据',
      data_points: ['VIN码', '设备型号', '固件版本', '骑行轨迹', '速度数据', '电池数据']
    },
    {
      category: '交易数据',
      description: '您的订单和消费记录',
      data_points: ['订单信息', 'N币交易', '维修工单']
    },
    {
      category: '社交数据',
      description: '您发布的内容和社交关系',
      data_points: ['分享路线', '话题帖子', '俱乐部成员', '赛事报名']
    }
  ];

  res.json({
    data_categories: dataCategories,
    privacy_policy_url: '/privacy-policy',
    gdpr_compliant: true,
    pipl_compliant: true,
    rights: [
      { id: 'access', name: '数据访问权', description: '获取您的个人数据副本' },
      { id: 'export', name: '数据可携权', description: '导出您的所有数据' },
      { id: 'delete', name: '数据删除权', description: '请求删除您的所有数据' },
      { id: 'rectify', name: '数据更正权', description: '更正不准确的数据' }
    ]
  });
});

router.post('/export', authenticateToken, (req, res) => {
  const existingRequest = db.prepare(`
    SELECT * FROM privacy_requests 
    WHERE user_id = ? AND type = 'export' AND status = 'pending'
  `).get(req.user.id);

  if (existingRequest) {
    return res.status(400).json({ error: 'Export request already pending' });
  }

  const result = db.prepare(`
    INSERT INTO privacy_requests (user_id, type, status)
    VALUES (?, 'export', 'processing')
  `).run(req.user.id);

  setTimeout(() => {
    const userData = collectUserData(req.user.id);
    const exportDir = path.join(__dirname, '../../data/exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const fileName = `user_${req.user.id}_export_${Date.now()}.json`;
    const filePath = path.join(exportDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

    const downloadUrl = `/api/privacy/exports/${fileName}`;

    db.prepare(`
      UPDATE privacy_requests 
      SET status = 'completed', download_url = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(downloadUrl, result.lastInsertRowid);
  }, 1000);

  res.json({
    request_id: result.lastInsertRowid,
    status: 'processing',
    message: '数据导出请求已提交，处理中...'
  });
});

router.post('/delete', authenticateToken, (req, res) => {
  const existingRequest = db.prepare(`
    SELECT * FROM privacy_requests 
    WHERE user_id = ? AND type = 'delete' AND status = 'pending'
  `).get(req.user.id);

  if (existingRequest) {
    return res.status(400).json({ error: 'Delete request already pending' });
  }

  const result = db.prepare(`
    INSERT INTO privacy_requests (user_id, type, status)
    VALUES (?, 'delete', 'pending')
  `).run(req.user.id);

  res.json({
    request_id: result.lastInsertRowid,
    status: 'pending',
    message: '数据删除请求已提交，将在7天内处理。如需撤销请在此期间联系客服。'
  });
});

router.get('/requests', authenticateToken, (req, res) => {
  const requests = db.prepare(`
    SELECT * FROM privacy_requests 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ requests });
});

router.get('/exports/:filename', authenticateToken, (req, res) => {
  const fileName = req.params.filename;
  const userId = fileName.split('_')[1];

  if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No permission' });
  }

  const filePath = path.join(__dirname, '../../data/exports', fileName);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Export file not found' });
  }

  res.download(filePath);
});

router.get('/my-data', authenticateToken, (req, res) => {
  const userData = collectUserData(req.user.id);
  res.json(userData);
});

function collectUserData(userId) {
  const user = db.prepare('SELECT id, username, email, nickname, avatar, phone, n_coins, role, created_at FROM users WHERE id = ?').get(userId);
  
  const devices = db.prepare('SELECT * FROM devices WHERE user_id = ?').all(userId);
  
  const rides = db.prepare('SELECT * FROM ride_records WHERE user_id = ?').all(userId);
  const rideIds = rides.map(r => r.id);
  if (rideIds.length > 0) {
    const ridePoints = db.prepare(`SELECT * FROM ride_points WHERE ride_id IN (${rideIds.map(() => '?').join(',')})`).all(...rideIds);
    rides.forEach(ride => {
      ride.points = ridePoints.filter(p => p.ride_id === ride.id);
    });
  }

  const sharedRoutes = db.prepare('SELECT * FROM shared_routes WHERE user_id = ?').all(userId);
  const topics = db.prepare('SELECT * FROM topics WHERE user_id = ?').all(userId);
  const clubsOwned = db.prepare('SELECT * FROM clubs WHERE owner_id = ?').all(userId);
  const clubMemberships = db.prepare(`
    SELECT cm.*, c.name as club_name 
    FROM club_members cm 
    JOIN clubs c ON cm.club_id = c.id 
    WHERE cm.user_id = ?
  `).all(userId);
  const eventParticipations = db.prepare(`
    SELECT ep.*, e.title as event_title 
    FROM event_participants ep 
    JOIN events e ON ep.event_id = e.id 
    WHERE ep.user_id = ?
  `).all(userId);

  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ?').all(userId);
  const orderIds = orders.map(o => o.id);
  if (orderIds.length > 0) {
    const orderItems = db.prepare(`SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`).all(...orderIds);
    orders.forEach(order => {
      order.items = orderItems.filter(i => i.order_id === order.id);
    });
  }

  const ncoinTransactions = db.prepare('SELECT * FROM ncoin_transactions WHERE user_id = ?').all(userId);
  const serviceOrders = db.prepare('SELECT * FROM service_orders WHERE user_id = ?').all(userId);
  const privacyRequests = db.prepare('SELECT * FROM privacy_requests WHERE user_id = ?').all(userId);

  return {
    export_time: new Date().toISOString(),
    user,
    devices,
    rides,
    social: {
      shared_routes: sharedRoutes,
      topics,
      clubs_owned: clubsOwned,
      club_memberships: clubMemberships,
      event_participations: eventParticipations
    },
    orders,
    ncoin_transactions: ncoinTransactions,
    service_orders: serviceOrders,
    privacy_requests: privacyRequests
  };
}

module.exports = router;
