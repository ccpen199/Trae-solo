const express = require('express');
const router = express.Router();

const {
  createOrder,
  openCamera,
  getOrderById,
  getOrdersByConsumer,
  getOrdersByResponsible,
  cancelOrder
} = require('../services/orderService');

const {
  executeRecognition,
  getRecognitionResult,
  getAvailableActions,
  RECOGNITION_TYPES
} = require('../services/recognitionService');

const {
  startTryon,
  completeTryon,
  saveScreenshot,
  getAvailableProducts,
  lockModel3D,
  unlockModel3D
} = require('../services/tryonService');

const {
  saveShare,
  submitApproval,
  approveOrder,
  rejectOrder,
  placeOrder,
  reassign
} = require('../services/approvalService');

const {
  createReverseOrder,
  getReverseOrders,
  REVERSE_REASONS
} = require('../services/reverseService');

const {
  getDashboardStats,
  createSnapshot,
  getSnapshots,
  getOrdersByStatus,
  getTopProducts,
  getConsumerStats
} = require('../services/statisticsService');

const {
  getUserTodos,
  updateTodoStatus,
  getPendingTodoCount,
  TODO_STATUSES
} = require('../services/todoService');

const {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadCount
} = require('../services/notificationService');

const {
  getAuditLogsByOrder,
  getAuditLogs
} = require('../services/auditService');

const { ORDER_STATUSES } = require('../services/orderStatusService');

const db = require('../database');

const extractOperatorInfo = (req) => {
  const operatorId = req.headers['x-operator-id'] || 'unknown';
  const operatorName = req.headers['x-operator-name'] || '系统';
  const operatorRole = req.headers['x-operator-role'] || 'system';
  return { operatorId, operatorName, operatorRole };
};

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/config', (req, res) => {
  res.json({
    orderStatuses: ORDER_STATUSES,
    recognitionTypes: RECOGNITION_TYPES,
    todoStatuses: TODO_STATUSES,
    reverseReasons: REVERSE_REASONS
  });
});

router.get('/users', (req, res) => {
  const { role } = req.query;
  let sql = 'SELECT id, username, name, role, email, phone, store_id, brand_id FROM users';
  const params = [];
  
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const users = db.prepare(sql).all(...params);
  res.json({ success: true, data: users });
});

router.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, email, phone, store_id, brand_id FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, data: user });
});

router.post('/orders', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = createOrder(req.body, operatorInfo);
  res.json(result);
});

router.get('/orders', (req, res) => {
  const { consumerId, responsiblePerson, status, limit = 50, offset = 0 } = req.query;
  
  let orders = [];
  if (consumerId) {
    orders = getOrdersByConsumer(consumerId, { status, limit: Number(limit), offset: Number(offset) });
  } else if (responsiblePerson) {
    orders = getOrdersByResponsible(responsiblePerson, { status, limit: Number(limit), offset: Number(offset) });
  } else {
    let sql = 'SELECT * FROM orders WHERE is_reverse = 0';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    
    orders = db.prepare(sql).all(...params);
  }
  
  res.json({ success: true, data: orders });
});

router.get('/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  res.json({ success: true, data: order });
});

router.post('/orders/:id/open-camera', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = openCamera(req.params.id, req.body, operatorInfo);
  res.json(result);
});

router.get('/orders/:id/actions', (req, res) => {
  const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  const actions = getAvailableActions(order.status);
  res.json({ success: true, data: actions });
});

router.post('/orders/:id/recognize', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const { recognitionType = 'both' } = req.body;
  const result = executeRecognition(req.params.id, recognitionType, operatorInfo);
  res.json(result);
});

router.get('/orders/:id/recognition', (req, res) => {
  const result = getRecognitionResult(req.params.id);
  if (!result) {
    return res.json({ success: true, data: null });
  }
  res.json({ success: true, data: result });
});

router.get('/products', (req, res) => {
  const { category } = req.query;
  const products = getAvailableProducts(category);
  res.json({ success: true, data: products });
});

router.get('/products/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, m.file_url as model_3d_url, m.file_type as model_3d_type, m.is_locked, m.locked_by
    FROM products p
    LEFT JOIN models_3d m ON p.model_3d_id = m.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ success: false, message: '商品不存在' });
  }
  res.json({ success: true, data: product });
});

router.post('/orders/:id/start-tryon', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const { productId } = req.body;
  
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId 为必填项' });
  }
  
  const result = startTryon(req.params.id, productId, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/complete-tryon', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = completeTryon(req.params.id, req.body, operatorInfo);
  res.json(result);
});

router.post('/models/:id/lock', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = lockModel3D(req.params.id, operatorInfo.operatorId);
  res.json(result);
});

router.post('/models/:id/unlock', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = unlockModel3D(req.params.id, operatorInfo.operatorId);
  res.json(result);
});

router.post('/screenshots', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const { orderId, detailId, imageUrl, tryonParams } = req.body;
  const result = saveScreenshot(orderId, detailId, imageUrl, tryonParams, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/save-share', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = saveShare(req.params.id, req.body, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/submit-approval', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = submitApproval(req.params.id, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/approve', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = approveOrder(req.params.id, req.body, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/reject', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = rejectOrder(req.params.id, req.body, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/place-order', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = placeOrder(req.params.id, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/reassign', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const { newResponsiblePerson } = req.body;
  
  if (!newResponsiblePerson) {
    return res.status(400).json({ success: false, message: 'newResponsiblePerson 为必填项' });
  }
  
  const result = reassign(req.params.id, newResponsiblePerson, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/cancel', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = cancelOrder(req.params.id, operatorInfo);
  res.json(result);
});

router.post('/orders/:id/reverse', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const result = createReverseOrder(req.params.id, req.body, operatorInfo);
  res.json(result);
});

router.get('/orders/:id/reverse', (req, res) => {
  const result = getReverseOrders(req.params.id);
  res.json({ success: true, data: result });
});

router.get('/todos', (req, res) => {
  const { userId, status, limit = 50, offset = 0 } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId 为必填项' });
  }
  
  const todos = getUserTodos(userId, { status, limit: Number(limit), offset: Number(offset) });
  res.json({ success: true, data: todos });
});

router.get('/todos/count', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId 为必填项' });
  }
  
  const count = getPendingTodoCount(userId);
  res.json({ success: true, data: { pendingCount: count } });
});

router.post('/todos/:id/complete', (req, res) => {
  const operatorInfo = extractOperatorInfo(req);
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId 为必填项' });
  }
  
  const result = updateTodoStatus(req.params.id, userId, TODO_STATUSES.COMPLETED, operatorInfo);
  res.json(result);
});

router.get('/notifications', (req, res) => {
  const { userId, isRead, limit = 50, offset = 0 } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId 为必填项' });
  }
  
  const notifications = getUserNotifications(userId, { 
    isRead: isRead !== undefined ? isRead === 'true' : null, 
    limit: Number(limit), 
    offset: Number(offset) 
  });
  res.json({ success: true, data: notifications });
});

router.get('/notifications/count', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId 为必填项' });
  }
  
  const count = getUnreadCount(userId);
  res.json({ success: true, data: { unreadCount: count } });
});

router.post('/notifications/:id/read', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId 为必填项' });
  }
  
  const result = markNotificationAsRead(req.params.id, userId);
  res.json({ success: result });
});

router.get('/dashboard/stats', (req, res) => {
  const stats = getDashboardStats();
  res.json({ success: true, data: stats });
});

router.get('/dashboard/orders-by-status', (req, res) => {
  const stats = getOrdersByStatus();
  res.json({ success: true, data: stats });
});

router.get('/dashboard/top-products', (req, res) => {
  const { limit = 10 } = req.query;
  const products = getTopProducts(Number(limit));
  res.json({ success: true, data: products });
});

router.post('/snapshots', (req, res) => {
  const result = createSnapshot();
  res.json(result);
});

router.get('/snapshots', (req, res) => {
  const { limit = 30 } = req.query;
  const snapshots = getSnapshots(Number(limit));
  res.json({ success: true, data: snapshots });
});

router.get('/consumers/:id/stats', (req, res) => {
  const stats = getConsumerStats(req.params.id);
  res.json({ success: true, data: stats });
});

router.get('/audit-logs', (req, res) => {
  const { orderId, operatorId, eventType, startTime, endTime, limit = 100, offset = 0 } = req.query;
  
  const logs = getAuditLogs({
    orderId,
    operatorId,
    eventType,
    startTime,
    endTime,
    limit: Number(limit),
    offset: Number(offset)
  });
  
  res.json({ success: true, data: logs });
});

router.get('/orders/:id/audit-logs', (req, res) => {
  const logs = getAuditLogsByOrder(req.params.id);
  res.json({ success: true, data: logs });
});

module.exports = router;
