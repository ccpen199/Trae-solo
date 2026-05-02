const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const db = require('../models/database');
const orderController = require('../controllers/orderController');
const { buildPagination, getStatusName, getAvailableActions } = require('../utils/helpers');

router.post('/entry', authMiddleware(['submit']), orderController.createEntryOrder);
router.post('/parking', authMiddleware(['submit']), orderController.confirmParking);
router.post('/billing', authMiddleware(['review']), orderController.processBilling);
router.post('/payment', authMiddleware(['submit']), orderController.processPayment);
router.post('/reconcile', authMiddleware(['review']), orderController.processReconciliation);

router.get('/', authMiddleware(['view']), (req, res) => {
  try {
    const { page, pageSize, offset } = buildPagination(req.query);
    const { status, plateNumber, startDate, endDate } = req.query;
    
    let conditions = [];
    let values = [];
    
    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    
    if (plateNumber) {
      conditions.push('plate_number LIKE ?');
      values.push(`%${plateNumber}%`);
    }
    
    if (startDate) {
      conditions.push('created_at >= ?');
      values.push(startDate);
    }
    
    if (endDate) {
      conditions.push('created_at <= ?');
      values.push(endDate + ' 23:59:59');
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM orders ${whereClause}`);
    const { total } = countStmt.all(...values)[0];
    
    const orders = db.prepare(`
      SELECT o.*, 
             ps.space_no as parking_space_no,
             mc.card_no as monthly_card_no,
             u.name as handler_name,
             creator.name as creator_name
      FROM orders o
      LEFT JOIN parking_spaces ps ON o.parking_space_id = ps.id
      LEFT JOIN monthly_cards mc ON o.monthly_card_id = mc.id
      LEFT JOIN users u ON o.current_handler = u.id
      LEFT JOIN users creator ON o.created_by = creator.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...values, pageSize, offset);
    
    const ordersWithStatus = orders.map(order => ({
      ...order,
      statusName: getStatusName(order.status),
      availableActions: getAvailableActions(order.status, req.user.role)
    }));
    
    res.json({
      success: true,
      data: {
        orders: ordersWithStatus,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/:id', authMiddleware(['view']), (req, res) => {
  try {
    const orderId = req.params.id;
    
    const order = db.prepare(`
      SELECT o.*, 
             ps.space_no as parking_space_no,
             mc.card_no as monthly_card_no,
             u.name as handler_name,
             creator.name as creator_name
      FROM orders o
      LEFT JOIN parking_spaces ps ON o.parking_space_id = ps.id
      LEFT JOIN monthly_cards mc ON o.monthly_card_id = mc.id
      LEFT JOIN users u ON o.current_handler = u.id
      LEFT JOIN users creator ON o.created_by = creator.id
      WHERE o.id = ?
    `).get(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const details = db.prepare(`
      SELECT od.*, u.name as handler_name
      FROM order_details od
      LEFT JOIN users u ON od.handler = u.id
      WHERE od.order_id = ?
      ORDER BY od.created_at ASC
    `).all(orderId);
    
    const timeline = db.prepare(`
      SELECT * FROM timeline WHERE order_id = ? ORDER BY created_at ASC
    `).all(orderId);
    
    const payments = db.prepare(`
      SELECT * FROM payments WHERE order_id = ? ORDER BY created_at ASC
    `).all(orderId);
    
    const messages = db.prepare(`
      SELECT m.*, u.name as user_name
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.created_at DESC
    `).all(orderId);
    
    res.json({
      success: true,
      data: {
        order: {
          ...order,
          statusName: getStatusName(order.status),
          availableActions: getAvailableActions(order.status, req.user.role)
        },
        details,
        timeline,
        payments,
        messages
      }
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/stats/summary', authMiddleware(['view']), (req, res) => {
  try {
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `).all();
    
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as todayOrders,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as todayRevenue,
        COUNT(DISTINCT monthly_card_id) as monthlyCardOrders
      FROM orders 
      WHERE date(created_at) = date('now')
    `).get();
    
    const parkingStats = db.prepare(`
      SELECT 
        COUNT(*) as totalSpaces,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupiedSpaces,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableSpaces
      FROM parking_spaces
    `).get();
    
    const exceptionStats = db.prepare(`
      SELECT 
        COUNT(*) as pendingExceptions
      FROM exceptions 
      WHERE status = 'pending'
    `).get();
    
    const statusMap = {};
    statusCounts.forEach(s => {
      statusMap[s.status] = s.count;
      statusMap[getStatusName(s.status)] = s.count;
    });
    
    res.json({
      success: true,
      data: {
        statusCounts: statusMap,
        todayStats,
        parkingStats,
        exceptionStats
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;