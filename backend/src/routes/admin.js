import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import db from '../config/database.js';
import userService from '../services/user-service.js';
import orderService from '../services/order-service.js';
import complianceService from '../services/compliance-service.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin', 'compliance', 'analyst']));

router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filters = {};
    if (role) filters.role = role;
    
    const users = userService.getAllUsers(filters);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', (req, res) => {
  try {
    const { user_id, order_type, status } = req.query;
    
    let sql = `SELECT o.*, u.username, fp.name as product_name, fp.code as product_code
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               LEFT JOIN fund_products fp ON o.product_id = fp.id
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND o.user_id = ?`;
      params.push(user_id);
    }
    if (order_type) {
      sql += ` AND o.order_type = ?`;
      params.push(order_type);
    }
    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY o.created_at DESC`;
    
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', (req, res) => {
  try {
    const { status, severity, alert_type } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (alert_type) filters.alert_type = alert_type;
    
    const alerts = complianceService.getAlerts(filters);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts/:id/resolve', requireRole(['admin', 'compliance']), (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const result = complianceService.resolveAlert(req.params.id, req.user.userId, resolutionNotes);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reconciliations', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    
    const reconciliations = complianceService.getReconciliations(filters);
    res.json(reconciliations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reconciliations/run', requireRole(['admin', 'compliance']), (req, res) => {
  try {
    const { date } = req.body;
    const result = complianceService.runDailyReconciliation(date || new Date());
    res.json({ success: true, reconciliation: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/metrics/purchase-redemption-ratio', (req, res) => {
  try {
    const result = complianceService.checkPurchaseRedemptionRatio();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics/position-concentration', (req, res) => {
  try {
    const result = complianceService.checkPositionConcentration();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/events', (req, res) => {
  try {
    const { aggregate_type, aggregate_id, event_type, start_date, end_date, limit, offset } = req.query;
    const filters = {};
    if (aggregate_type) filters.aggregateType = aggregate_type;
    if (aggregate_id) filters.aggregateId = aggregate_id;
    if (event_type) filters.eventType = event_type;
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;
    
    const events = complianceService.getAllEvents(
      filters,
      parseInt(limit) || 100,
      parseInt(offset) || 0
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit-trail/:aggregateType/:aggregateId', (req, res) => {
  try {
    const { aggregateType, aggregateId } = req.params;
    const trail = complianceService.getAuditTrail(aggregateType, aggregateId);
    res.json(trail);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', requireRole(['admin']), (req, res) => {
  try {
    const { code, name, type, risk_level, description, issuer, manager, nav } = req.body;
    
    if (!code || !name || !type) {
      return res.status(400).json({ error: '产品代码、名称、类型为必填项' });
    }
    
    const productId = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO fund_products (id, code, name, type, risk_level, description, issuer, manager, nav, status, created_at, nav_updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      productId, 
      code, 
      name, 
      type, 
      risk_level || 1, 
      description, 
      issuer, 
      manager, 
      nav || 1.0, 
      'active', 
      now, 
      now
    );

    res.json({ success: true, product: { id: productId, code, name, type, risk_level } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
