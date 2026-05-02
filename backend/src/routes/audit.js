import express from 'express';
import db from '../database.js';
import { authenticateToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRoles('finance', 'tax', 'sales'));

router.get('/', (req, res) => {
  const { 
    invoice_id, 
    order_no, 
    operator_name,
    start_date, 
    end_date,
    action,
    page = 1, 
    limit = 20 
  } = req.query;
  
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];

  if (invoice_id) {
    whereConditions.push('invoice_id = ?');
    params.push(invoice_id);
  }

  if (order_no) {
    whereConditions.push('order_no LIKE ?');
    params.push(`%${order_no}%`);
  }

  if (operator_name) {
    whereConditions.push('operator_name LIKE ?');
    params.push(`%${operator_name}%`);
  }

  if (action) {
    whereConditions.push('action = ?');
    params.push(action);
  }

  if (start_date) {
    whereConditions.push('created_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    whereConditions.push('created_at <= ?');
    params.push(end_date + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM audit_logs ${whereClause}
  `);
  const { total } = countStmt.get(...params);

  const stmt = db.prepare(`
    SELECT * FROM audit_logs 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const logs = stmt.all(...params, parseInt(limit), offset);

  const logsWithDetails = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null
  }));

  res.json({
    logs: logsWithDetails,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit)
    }
  });
});

router.get('/stats', (req, res) => {
  const period = req.query.period || new Date().toISOString().slice(0, 7);
  
  const actionStats = db.prepare(`
    SELECT action, COUNT(*) as count, operator_role
    FROM audit_logs
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY action, operator_role
    ORDER BY count DESC
  `).all(period);

  const roleStats = db.prepare(`
    SELECT operator_role, COUNT(*) as count, COUNT(DISTINCT operator_id) as operator_count
    FROM audit_logs
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY operator_role
  `).all(period);

  const recentActivity = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 20
  `).all();

  const roleNames = {
    customer: '客户',
    finance: '财务会计',
    tax: '税务接口人',
    sales: '销售运营'
  };

  res.json({
    period,
    action_stats: actionStats,
    role_stats: roleStats.map(r => ({
      ...r,
      operator_role_name: roleNames[r.operator_role] || r.operator_role
    })),
    recent_activity: recentActivity.map(a => ({
      ...a,
      details: a.details ? JSON.parse(a.details) : null
    }))
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const log = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
  
  if (!log) {
    return res.status(404).json({ error: '审计记录不存在' });
  }

  res.json({
    log: {
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }
  });
});

router.get('/invoice/:invoiceId', (req, res) => {
  const { invoiceId } = req.params;
  
  const logs = db.prepare(`
    SELECT * FROM audit_logs 
    WHERE invoice_id = ?
    ORDER BY created_at ASC
  `).all(invoiceId);

  res.json({
    logs: logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }))
  });
});

export default router;
