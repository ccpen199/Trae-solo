const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog, createAlert } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, appId, changeType, riskLevel } = req.query;
    let sql = `
      SELECT c.*, a.name as app_name, 
             cr.name as created_by_name,
             ap.name as approved_by_name
      FROM change_orders c
      LEFT JOIN applications a ON c.app_id = a.id
      LEFT JOIN users cr ON c.created_by = cr.id
      LEFT JOIN users ap ON c.approved_by = ap.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (appId) {
      sql += ' AND c.app_id = ?';
      params.push(appId);
    }
    if (changeType) {
      sql += ' AND c.change_type = ?';
      params.push(changeType);
    }
    if (riskLevel) {
      sql += ' AND c.risk_level = ?';
      params.push(riskLevel);
    }

    sql += ' ORDER BY c.created_at DESC';
    const orders = await db.all(sql, params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await db.get(`
      SELECT c.*, a.name as app_name, 
             cr.name as created_by_name,
             ap.name as approved_by_name
      FROM change_orders c
      LEFT JOIN applications a ON c.app_id = a.id
      LEFT JOIN users cr ON c.created_by = cr.id
      LEFT JOIN users ap ON c.approved_by = ap.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (!order) {
      return res.status(404).json({ error: '变更单不存在' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { app_id, change_type, title, description, old_value, new_value, risk_level, rollback_plan } = req.body;

    if (!app_id || !change_type || !title) {
      return res.status(400).json({ error: '应用ID、变更类型和标题为必填' });
    }

    const orderId = 'CHG-' + uuidv4().slice(0, 8).toUpperCase();

    const result = await db.run(
      `INSERT INTO change_orders (order_id, app_id, change_type, title, description, old_value, new_value, risk_level, rollback_plan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, app_id, change_type, title, description, old_value, new_value, risk_level || 'low', rollback_plan, req.user.id]
    );

    await createAuditLog(
      req.user.id,
      'create',
      'change_order',
      result.lastID,
      null,
      { orderId, title, change_type },
      req.ip,
      req.get('User-Agent')
    );

    const order = await db.get('SELECT * FROM change_orders WHERE id = ?', [result.lastID]);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', authenticateToken, requireRole('admin', 'ops', 'security'), async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM change_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: '变更单不存在' });
    }
    if (!['draft', 'submitted'].includes(order.status)) {
      return res.status(400).json({ error: '此状态的变更单无法审批' });
    }

    await db.run(
      `UPDATE change_orders SET status = 'approved', approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.user.id, req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'approve',
      'change_order',
      req.params.id,
      { status: order.status },
      { status: 'approved' },
      req.ip,
      req.get('User-Agent')
    );

    const updatedOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', [req.params.id]);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/execute', authenticateToken, requireRole('admin', 'ops'), async (req, res) => {
  try {
    const order = await db.get('SELECT * FROM change_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: '变更单不存在' });
    }
    if (order.status !== 'approved') {
      return res.status(400).json({ error: '只有已审批的变更单可以执行' });
    }

    await db.run(
      `UPDATE change_orders SET status = 'executed', executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'execute',
      'change_order',
      req.params.id,
      { status: 'approved' },
      { status: 'executed' },
      req.ip,
      req.get('User-Agent')
    );

    if (order.risk_level === 'high') {
      await createAlert(
        'change_executed',
        'warning',
        '高风险变更已执行',
        `变更单 ${order.order_id} 已执行: ${order.title}`,
        order.app_id,
        null,
        null
      );
    }

    const updatedOrder = await db.get('SELECT * FROM change_orders WHERE id = ?', [req.params.id]);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
