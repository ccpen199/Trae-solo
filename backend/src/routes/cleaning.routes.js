const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireWorker, requireOwnerOrInvestor } = require('../middleware/auth');
const { createCleaningOrderValidation, completeCleaningOrderValidation, orderIdParamValidation, paginationValidation } = require('../middleware/validation');
const { CleaningOrderStatus } = require('../config/enums');
const CleaningRouterEngine = require('../engines/cleaning-router.engine');
const AuditService = require('../services/audit.service');

router.get('/', authenticateToken, paginationValidation, (req, res) => {
  try {
    const { page = 1, limit = 20, status, station_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = ['1=1'];
    const params = [];

    if (status) {
      whereClauses.push('co.status = ?');
      params.push(status);
    }
    if (station_id) {
      whereClauses.push('co.station_id = ?');
      params.push(station_id);
    }

    if (req.user.role === 'maintenance_worker') {
      whereClauses.push('(co.assigned_worker_id = ? OR co.assigned_worker_id IS NULL)');
      params.push(req.user.id);
    }

    const countSql = `SELECT COUNT(*) as count FROM cleaning_orders co WHERE ${whereClauses.join(' AND ')}`;
    const totalResult = db.prepare(countSql).get(...params);
    const total = totalResult.count;

    const dataSql = `
      SELECT co.*, 
             s.name as station_name,
             s.code as station_code,
             s.address as station_address,
             u.name as worker_name
      FROM cleaning_orders co
      JOIN stations s ON co.station_id = s.id
      LEFT JOIN users u ON co.assigned_worker_id = u.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY co.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = db.prepare(dataSql).all(...params, parseInt(limit), offset);

    res.json({
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get cleaning orders error:', err);
    res.status(500).json({ error: '获取清洗工单列表失败' });
  }
});

router.get('/:orderId', authenticateToken, orderIdParamValidation, (req, res) => {
  try {
    const { orderId } = req.params;

    const order = db.prepare(`
      SELECT co.*, 
             s.name as station_name,
             s.code as station_code,
             s.address as station_address,
             s.capacity_kw,
             u.name as worker_name,
             u.phone as worker_phone
      FROM cleaning_orders co
      JOIN stations s ON co.station_id = s.id
      LEFT JOIN users u ON co.assigned_worker_id = u.id
      WHERE co.id = ?
    `).get(orderId);

    if (!order) {
      return res.status(404).json({ error: '清洗工单不存在' });
    }

    const auditHistory = AuditService.getObjectHistory('cleaning_order', orderId);

    res.json({
      order,
      audit_history: auditHistory
    });
  } catch (err) {
    console.error('Get cleaning order error:', err);
    res.status(500).json({ error: '获取清洗工单详情失败' });
  }
});

router.get('/station/:stationId/analysis', authenticateToken, (req, res) => {
  try {
    const { stationId } = req.params;

    const analysis = CleaningRouterEngine.analyzeStationCleaningNeed(stationId);
    const history = CleaningRouterEngine.getCleaningHistory(stationId, 10);

    res.json({
      analysis,
      recent_history: history
    });
  } catch (err) {
    console.error('Cleaning analysis error:', err);
    res.status(500).json({ error: '分析清洗需求失败' });
  }
});

router.post('/', authenticateToken, requireOwnerOrInvestor, createCleaningOrderValidation, (req, res) => {
  try {
    const { stationId, cause, current_degradation_percent, assigned_worker_id, priority } = req.body;

    const order = CleaningRouterEngine.createCleaningOrder(
      stationId, cause, current_degradation_percent, assigned_worker_id
    );

    AuditService.logCreate(req, 'cleaning', 'cleaning_order', order.id, order, '创建清洗工单');

    res.status(201).json({ message: '清洗工单创建成功', order });
  } catch (err) {
    console.error('Create cleaning order error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/auto-dispatch', authenticateToken, requireOwnerOrInvestor, (req, res) => {
  try {
    const dispatched = CleaningRouterEngine.autoDispatchCleaningOrders();

    res.json({
      message: `自动派单完成，共派发 ${dispatched.length} 张清洗工单`,
      dispatched_orders: dispatched
    });
  } catch (err) {
    console.error('Auto dispatch error:', err);
    res.status(500).json({ error: '自动派单失败' });
  }
});

router.post('/:orderId/accept', authenticateToken, requireWorker, orderIdParamValidation, (req, res) => {
  try {
    const { orderId } = req.params;
    const workerId = req.user.id;

    const oldOrder = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!oldOrder) {
      return res.status(404).json({ error: '清洗工单不存在' });
    }

    const updatedOrder = CleaningRouterEngine.acceptCleaningOrder(orderId, workerId);
    
    AuditService.logAccept(req, 'cleaning', 'cleaning_order', orderId, oldOrder, updatedOrder);

    res.json({ message: '工单已接受', order: updatedOrder });
  } catch (err) {
    console.error('Accept cleaning order error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/:orderId/start', authenticateToken, requireWorker, orderIdParamValidation, (req, res) => {
  try {
    const { orderId } = req.params;

    const oldOrder = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!oldOrder) {
      return res.status(404).json({ error: '清洗工单不存在' });
    }

    const updatedOrder = CleaningRouterEngine.startCleaning(orderId);
    
    AuditService.logUpdate(req, 'cleaning', 'cleaning_order', orderId, oldOrder, updatedOrder, '开始清洗作业');

    res.json({ message: '已开始清洗作业', order: updatedOrder });
  } catch (err) {
    console.error('Start cleaning error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/:orderId/complete', authenticateToken, requireWorker, completeCleaningOrderValidation, (req, res) => {
  try {
    const { orderId } = req.params;
    const { before_cleaning_image, after_cleaning_image, worker_notes } = req.body;

    const oldOrder = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!oldOrder) {
      return res.status(404).json({ error: '清洗工单不存在' });
    }

    const updatedOrder = CleaningRouterEngine.completeCleaning(
      orderId, before_cleaning_image, after_cleaning_image, worker_notes
    );

    AuditService.logComplete(req, 'cleaning', 'cleaning_order', orderId, oldOrder, updatedOrder);

    res.json({ message: '清洗作业已完成', order: updatedOrder });
  } catch (err) {
    console.error('Complete cleaning order error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/:orderId/verify', authenticateToken, requireOwnerOrInvestor, orderIdParamValidation, (req, res) => {
  try {
    const { orderId } = req.params;
    const { verifier_notes, verified } = req.body;
    const verifierId = req.user.id;

    const oldOrder = db.prepare('SELECT * FROM cleaning_orders WHERE id = ?').get(orderId);
    if (!oldOrder) {
      return res.status(404).json({ error: '清洗工单不存在' });
    }

    const updatedOrder = CleaningRouterEngine.verifyCleaning(
      orderId, verifierId, verifier_notes, verified !== false
    );

    AuditService.logVerify(req, 'cleaning', 'cleaning_order', orderId, oldOrder, updatedOrder);

    res.json({ 
      message: verified !== false ? '清洗验收通过' : '需要重新清洗', 
      order: updatedOrder 
    });
  } catch (err) {
    console.error('Verify cleaning order error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
