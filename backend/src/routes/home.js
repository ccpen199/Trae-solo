const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { routeToProvince } = require('../middleware/provinceRouter');

const router = express.Router();

router.get('/', authenticate, routeToProvince, auditLog('home', 'get_home'), async (req, res) => {
  const province = req.province || 'national';
  
  const userInfo = await db.getAsync(`
    SELECT id, phone, real_name as name, id_card_no as id_card, auth_level, province, city, status, avatar
    FROM users WHERE id = ?
  `, [req.user.id]);
  
  if (userInfo) {
    userInfo.real_name_verified = userInfo.status === 1;
  }
  
  const services = await db.allAsync(`
    SELECT * FROM services
    WHERE is_enabled = 1 AND province IN ('national', ?)
    ORDER BY sort_order ASC, is_hot DESC
  `, [province]);
  
  const todos = await db.allAsync(`
    SELECT * FROM todo_items
    WHERE user_id = ? AND status = 'pending'
    ORDER BY priority DESC, created_at DESC
    LIMIT 5
  `, [req.user.id]);
  
  const unreadCount = (await db.getAsync(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `, [req.user.id])).count;
  
  const pendingServices = (await db.getAsync(`
    SELECT COUNT(*) as count FROM service_records
    WHERE user_id = ? AND status = 'pending'
  `, [req.user.id])).count;
  
  const hotServices = services.filter(s => s.is_hot === 1);
  const quickServices = services.slice(0, 8);
  const coreServices = services.slice(0, 6);
  
  res.json({
    code: 200,
    data: {
      user: userInfo,
      core_services: coreServices,
      hot_services: hotServices,
      quick_services: quickServices,
      todos,
      stats: {
        unread_notifications: unreadCount,
        pending_services: pendingServices,
        todo_count: todos.length,
      },
    },
  });
});

router.get('/policies/recommend', authenticate, routeToProvince, auditLog('home', 'get_recommend_policies'), async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;
  const province = String(req.province || 'national');

  const policies = await db.allAsync(`
    SELECT p.* FROM policies p
    LEFT JOIN policy_recommendations pr ON p.id = pr.policy_id AND pr.user_id = ?
    WHERE p.status = 1 AND p.province IN ('national', ?)
    ORDER BY p.is_top DESC, p.is_hot DESC, p.created_at DESC
    LIMIT ? OFFSET ?
  `, req.user.id, province, pageSizeNum, offset);

  const total = (await db.getAsync(`
    SELECT COUNT(*) as count FROM policies
    WHERE status = 1 AND province IN ('national', ?)
  `, province)).count;

  res.json({
    code: 200,
    data: {
      list: policies,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/services/hot', authenticate, routeToProvince, auditLog('home', 'get_hot_services'), async (req, res) => {
  const province = req.province || 'national';
  const services = await db.allAsync(`
    SELECT * FROM services
    WHERE is_enabled = 1 AND province IN ('national', ?)
    ORDER BY sort_order ASC, is_hot DESC
    LIMIT 12
  `, province);

  const hotServices = services.filter(s => s.is_hot === 1);
  const quickServices = services.slice(0, 8);

  res.json({
    code: 200,
    data: {
      hot_services: hotServices,
      quick_services: quickServices,
      all_services: services,
    },
  });
});

router.get('/todos', authenticate, auditLog('home', 'get_todos'), async (req, res) => {
  const todos = await db.allAsync(`
    SELECT * FROM todo_items
    WHERE user_id = ? AND status = 'pending'
    ORDER BY priority DESC, created_at DESC
    LIMIT 10
  `, req.user.id);

  const unreadCount = (await db.getAsync(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `, req.user.id)).count;

  const pendingServices = (await db.getAsync(`
    SELECT COUNT(*) as count FROM service_records
    WHERE user_id = ? AND status = 'pending'
  `, req.user.id)).count;

  res.json({
    code: 200,
    data: {
      todos,
      unread_notifications: unreadCount,
      pending_services: pendingServices,
    },
  });
});

router.get('/banner', (req, res) => {
  const banners = [
    { id: 1, title: '电子社保卡', image: '', link: '/service/essc', description: '一码通行' },
    { id: 2, title: '养老金调整', image: '', link: '/policy/1', description: '2024年养老金调整方案' },
    { id: 3, title: '就业服务', image: '', link: '/service/employment', description: '精准匹配好工作' },
  ];
  res.json({ code: 200, data: banners });
});

router.get('/provinces', async (req, res) => {
  const provinces = await db.allAsync('SELECT * FROM provinces WHERE enabled = 1 ORDER BY name');
  res.json({ code: 200, data: provinces });
});

router.post('/province/set', authenticate, auditLog('home', 'set_province'), async (req, res) => {
  const { province, city } = req.body;
  if (province) {
    await db.runAsync('UPDATE users SET province = ?, city = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', province, city || '', req.user.id);
    res.json({ code: 200, message: '属地设置成功' });
  } else {
    res.status(400).json({ code: 400, message: '请选择省份' });
  }
});

module.exports = router;
