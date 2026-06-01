const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { 
    status, product_type, agent_id, payment_method, 
    customer_level, risk_level, sort_by, sort_order,
    page = 1, page_size = 20
  } = req.query;

  let query = `
    SELECT 
      p.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.level as customer_level,
      a.name as agent_name,
      a.team as agent_team,
      julianday(p.expiry_date) - julianday('now') as days_to_expiry
    FROM policies p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN agents a ON p.agent_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }
  if (product_type) {
    query += ` AND p.product_type = ?`;
    params.push(product_type);
  }
  if (agent_id) {
    query += ` AND p.agent_id = ?`;
    params.push(agent_id);
  }
  if (payment_method) {
    query += ` AND p.payment_method = ?`;
    params.push(payment_method);
  }
  if (customer_level) {
    query += ` AND c.level = ?`;
    params.push(customer_level);
  }
  if (risk_level) {
    query += ` AND p.renewal_risk = ?`;
    params.push(risk_level);
  }

  const sortFields = {
    'premium': 'p.premium_amount',
    'expiry_date': 'p.expiry_date',
    'days_to_expiry': 'days_to_expiry',
    'customer_level': 'c.level'
  };
  const sortField = sortFields[sort_by] || 'p.expiry_date';
  const sortDir = sort_order === 'desc' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${sortField} ${sortDir}`;

  const offset = (page - 1) * page_size;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(page_size), offset);

  try {
    const policies = db.prepare(query).all(...params);
    
    const countQuery = query.split('ORDER BY')[0].replace(
      'SELECT p.*, c.name as customer_name, c.phone as customer_phone, c.level as customer_level, a.name as agent_name, a.team as agent_team, julianday(p.expiry_date) - julianday(\'now\') as days_to_expiry',
      'SELECT COUNT(*) as total'
    );
    const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

    res.json({
      data: policies,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        total,
        total_pages: Math.ceil(total / page_size)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pool', (req, res) => {
  const today = dayjs().format('YYYY-MM-DD');
  const { agent_id, risk_level, days_range } = req.query;
  
  let query = `
    SELECT 
      p.*,
      c.name as customer_name,
      c.phone as customer_phone,
      c.level as customer_level,
      a.name as agent_name,
      a.team as agent_team,
      julianday(p.expiry_date) - julianday('now') as days_to_expiry,
      CASE 
        WHEN julianday(p.expiry_date) < julianday('now') THEN ABS(julianday(p.expiry_date) - julianday('now'))
        ELSE 0 
      END as overdue_days,
      COALESCE(rt.reminder_count, 0) as reminder_count,
      rt.status as task_status,
      rt.next_follow_up
    FROM policies p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN agents a ON p.agent_id = a.id
    LEFT JOIN renewal_tasks rt ON p.id = rt.policy_id
    WHERE p.status IN ('active', 'grace_period')
      AND julianday(p.expiry_date) - julianday('now') <= 90
  `;
  const params = [];

  if (agent_id) {
    query += ` AND p.agent_id = ?`;
    params.push(agent_id);
  }
  if (risk_level) {
    query += ` AND p.renewal_risk = ?`;
    params.push(risk_level);
  }
  if (days_range) {
    const [min, max] = days_range.split(',').map(Number);
    query += ` AND (julianday(p.expiry_date) - julianday('now')) BETWEEN ? AND ?`;
    params.push(min, max);
  }

  query += ` ORDER BY overdue_days DESC, p.premium_amount DESC`;

  try {
    const policies = db.prepare(query).all(...params);
    res.json({ data: policies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const policy = db.prepare(`
      SELECT 
        p.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.level as customer_level,
        a.name as agent_name,
        a.team as agent_team
      FROM policies p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN agents a ON p.agent_id = a.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }

    const statusLogs = db.prepare(`
      SELECT * FROM policy_status_logs 
      WHERE policy_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    const paymentRecords = db.prepare(`
      SELECT * FROM payment_records 
      WHERE policy_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    const renewalTasks = db.prepare(`
      SELECT rt.*, a.name as agent_name
      FROM renewal_tasks rt
      LEFT JOIN agents a ON rt.agent_id = a.id
      WHERE rt.policy_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      ...policy,
      status_logs: statusLogs,
      payment_records: paymentRecords,
      renewal_tasks: renewalTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', (req, res) => {
  const { new_status, reason, operator } = req.body;
  const { id } = req.params;

  try {
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(id);
    if (!policy) {
      return res.status(404).json({ error: '保单不存在' });
    }

    db.prepare('BEGIN').run();

    db.prepare(`
      INSERT INTO policy_status_logs (policy_id, old_status, new_status, reason, operator)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, policy.status, new_status, reason, operator || 'system');

    db.prepare(`
      UPDATE policies 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(new_status, id);

    db.prepare('COMMIT').run();

    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
