const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { authenticateToken, requireWorker, requireOwnerOrInvestor } = require('../middleware/auth');
const { createMaintenanceOrderValidation, updateMaintenanceOrderValidation, orderIdParamValidation, paginationValidation } = require('../middleware/validation');
const { MaintenanceOrderStatus } = require('../config/enums');
const FaultDiagnosisEngine = require('../engines/fault-diagnosis.engine');
const AuditService = require('../services/audit.service');

router.get('/', authenticateToken, paginationValidation, (req, res) => {
  try {
    const { page = 1, limit = 20, status, station_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = ['1=1'];
    const params = [];

    if (status) {
      whereClauses.push('mo.status = ?');
      params.push(status);
    }
    if (station_id) {
      whereClauses.push('mo.station_id = ?');
      params.push(station_id);
    }

    if (req.user.role === 'maintenance_worker') {
      whereClauses.push('(mo.assigned_worker_id = ? OR mo.assigned_worker_id IS NULL)');
      params.push(req.user.id);
    }

    const countSql = `SELECT COUNT(*) as count FROM maintenance_orders mo WHERE ${whereClauses.join(' AND ')}`;
    const totalResult = db.prepare(countSql).get(...params);
    const total = totalResult.count;

    const dataSql = `
      SELECT mo.*, 
             s.name as station_name,
             s.code as station_code,
             u.name as worker_name,
             f.fault_description,
             f.severity as fault_severity
      FROM maintenance_orders mo
      JOIN stations s ON mo.station_id = s.id
      LEFT JOIN users u ON mo.assigned_worker_id = u.id
      LEFT JOIN faults f ON mo.fault_id = f.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY mo.created_at DESC
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
    console.error('Get maintenance orders error:', err);
    res.status(500).json({ error: '获取维修工单列表失败' });
  }
});

router.get('/:orderId', authenticateToken, orderIdParamValidation, (req, res) => {
  try {
    const { orderId } = req.params;

    const order = db.prepare(`
      SELECT mo.*, 
             s.name as station_name,
             s.code as station_code,
             s.address as station_address,
             u.name as worker_name,
             u.phone as worker_phone,
             f.fault_code,
             f.fault_description,
             f.severity as fault_severity,
             f.root_cause
      FROM maintenance_orders mo
      JOIN stations s ON mo.station_id = s.id
      LEFT JOIN users u ON mo.assigned_worker_id = u.id
      LEFT JOIN faults f ON mo.fault_id = f.id
      WHERE mo.id = ?
    `).get(orderId);

    if (!order) {
      return res.status(404).json({ error: '维修工单不存在' });
    }

    const auditHistory = AuditService.getObjectHistory('maintenance_order', orderId);

    res.json({
      order,
      audit_history: auditHistory
    });
  } catch (err) {
    console.error('Get maintenance order error:', err);
    res.status(500).json({ error: '获取维修工单详情失败' });
  }
});

router.post('/', authenticateToken, requireOwnerOrInvestor, createMaintenanceOrderValidation, (req, res) => {
  try {
    const { stationId, problem_description, fault_id, assigned_worker_id, priority, estimated_repair_time_hours } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO maintenance_orders (
        id, station_id, fault_id, assigned_worker_id,
        problem_description, priority, estimated_repair_time_hours,
        status, dispatch_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, stationId, fault_id, assigned_worker_id,
      problem_description, priority || 2, estimated_repair_time_hours,
      MaintenanceOrderStatus.DISPATCHED, now
    );

    const newOrder = db.prepare(`
      SELECT mo.*, s.name as station_name
      FROM maintenance_orders mo
      JOIN stations s ON mo.station_id = s.id
      WHERE mo.id = ?
    `).get(id);

    AuditService.logCreate(req, 'maintenance', 'maintenance_order', id, newOrder, '创建维修工单');

    if (assigned_worker_id) {
      const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId);
      const NotificationService = require('../services/notification.service');
      NotificationService.sendMaintenanceTask(assigned_worker_id, newOrder, station);
    }

    res.status(201).json({ message: '维修工单创建成功', order: newOrder });
  } catch (err) {
    console.error('Create maintenance order error:', err);
    res.status(500).json({ error: '创建维修工单失败' });
  }
});

router.post('/:orderId/accept', authenticateToken, requireWorker, orderIdParamValidation, (req, res) => {
  try {
    const { orderId } = req.params;
    const workerId = req.user.id;

    const oldOrder = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(orderId);
    if (!oldOrder) {
      return res.status(404).json({ error: '维修工单不存在' });
    }

    const updatedOrder = FaultDiagnosisEngine.acceptMaintenanceOrder(orderId, workerId);
    
    AuditService.logAccept(req, 'maintenance', 'maintenance_order', orderId, oldOrder, updatedOrder);

    res.json({ message: '工单已接受', order: updatedOrder });
  } catch (err) {
    console.error('Accept maintenance order error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:orderId/status', authenticateToken, requireWorker, updateMaintenanceOrderValidation, (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, worker_feedback, parts_used } = req.body;

    const oldOrder = db.prepare('SELECT * FROM maintenance_orders WHERE id = ?').get(orderId);
    if (!oldOrder) {
      return res.status(404).json({ error: '维修工单不存在' });
    }

    const updatedOrder = FaultDiagnosisEngine.updateMaintenanceStatus(
      orderId, status, worker_feedback, parts_used
    );

    AuditService.logUpdate(req, 'maintenance', 'maintenance_order', orderId, oldOrder, updatedOrder, '更新工单状态');

    res.json({ message: '工单状态已更新', order: updatedOrder });
  } catch (err) {
    console.error('Update maintenance order error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/dashboard/metrics', authenticateToken, (req, res) => {
  try {
    const { station_id } = req.query;

    let stationCondition = '';
    const params = [];

    if (station_id) {
      stationCondition = 'AND station_id = ?';
      params.push(station_id);
    }

    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM maintenance_orders
      WHERE 1=1 ${stationCondition}
      GROUP BY status
    `).all(...params);

    const mttr = station_id 
      ? FaultDiagnosisEngine.calculateMTTR(station_id, 30)
      : null;

    const activeFaults = station_id
      ? db.prepare(`
          SELECT COUNT(*) as count FROM faults 
          WHERE station_id = ? AND status NOT IN ('resolved', 'false_alarm')
        `).get(station_id)
      : db.prepare(`
          SELECT COUNT(*) as count FROM faults 
          WHERE status NOT IN ('resolved', 'false_alarm')
        `).get();

    const statusSummary = {};
    for (const sc of statusCounts) {
      statusSummary[sc.status] = sc.count;
    }

    res.json({
      status_summary: statusSummary,
      active_faults_count: activeFaults?.count || 0,
      mttr_last_30d: mttr
    });
  } catch (err) {
    console.error('Maintenance metrics error:', err);
    res.status(500).json({ error: '获取维护指标失败' });
  }
});

module.exports = router;
