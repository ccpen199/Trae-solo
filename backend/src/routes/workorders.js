const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = 'gd-gov-service-2024-secret-key';

function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

function generateOrderNo() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  return 'WO' + dateStr + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

const departments = [
  '省人力资源社会保障厅',
  '省医疗保障局',
  '省公安厅',
  '省自然资源厅',
  '省市场监督管理局',
  '省政务服务中心',
  '省民政厅',
  '省住房城乡建设厅'
];

router.post('/', (req, res) => {
  const userId = getUserId(req);
  
  const { userName, phone, title, content, category, priority } = req.body;
  
  if (!title || !content || !phone) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const orderNo = generateOrderNo();
  const assignedDept = departments[Math.floor(Math.random() * departments.length)];

  const result = db.prepare(`
    INSERT INTO work_orders (
      order_no, user_id, user_name, phone, title, content,
      category, priority, assigned_department, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNo, userId || null, userName || '匿名用户', phone, title, content,
    category || 'consultation', priority || 'normal', assignedDept, 'pending'
  );

  res.json({
    success: true,
    orderId: result.lastInsertRowid,
    orderNo,
    assignedDept
  });
});

router.get('/my', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: '请先登录' });
  }

  const { status } = req.query;
  let sql = 'SELECT * FROM work_orders WHERE user_id = ?';
  const params = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const orders = db.prepare(sql).all(...params);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const userId = getUserId(req);
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }

  if (userId && order.user_id && order.user_id !== userId) {
    return res.status(403).json({ error: '无权查看此工单' });
  }

  res.json(order);
});

module.exports = router;
