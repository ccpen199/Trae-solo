const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { agent_id, status, priority, sort_by, sort_order, page = 1, page_size = 20 } = req.query;

  let query = `
    SELECT 
      rt.*,
      p.policy_no,
      p.premium_amount,
      p.expiry_date,
      p.product_name,
      p.product_type,
      c.name as customer_name,
      c.phone as customer_phone,
      c.level as customer_level,
      a.name as agent_name,
      a.team as agent_team,
      julianday(p.expiry_date) - julianday('now') as days_to_expiry,
      CASE 
        WHEN julianday(p.expiry_date) < julianday('now') THEN ABS(julianday(p.expiry_date) - julianday('now'))
        ELSE 0 
      END as overdue_days
    FROM renewal_tasks rt
    LEFT JOIN policies p ON rt.policy_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN agents a ON rt.agent_id = a.id
    WHERE 1=1
  `;
  const params = [];

  if (agent_id) {
    query += ` AND rt.agent_id = ?`;
    params.push(agent_id);
  }
  if (status) {
    query += ` AND rt.status = ?`;
    params.push(status);
  }
  if (priority) {
    query += ` AND rt.priority = ?`;
    params.push(priority);
  }

  const sortFields = {
    'overdue_days': 'overdue_days',
    'premium': 'p.premium_amount',
    'next_follow_up': 'rt.next_follow_up',
    'reminder_count': 'rt.reminder_count'
  };
  const sortField = sortFields[sort_by] || 'overdue_days';
  const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortField} ${sortDir}`;

  const offset = (page - 1) * page_size;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(page_size), offset);

  try {
    const tasks = db.prepare(query).all(...params);
    
    const countQuery = query.split('ORDER BY')[0].replace(
      'SELECT rt.*, p.policy_no, p.premium_amount, p.expiry_date, p.product_name, p.product_type, c.name as customer_name, c.phone as customer_phone, c.level as customer_level, a.name as agent_name, a.team as agent_team, julianday(p.expiry_date) - julianday(\'now\') as days_to_expiry, CASE WHEN julianday(p.expiry_date) < julianday(\'now\') THEN ABS(julianday(p.expiry_date) - julianday(\'now\')) ELSE 0 END as overdue_days',
      'SELECT COUNT(*) as total'
    );
    const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

    res.json({
      data: tasks,
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

router.post('/', (req, res) => {
  const { policy_id, agent_id, priority } = req.body;

  try {
    const result = db.prepare(`
      INSERT INTO renewal_tasks (policy_id, agent_id, status, priority, reminder_count)
      VALUES (?, ?, 'pending', ?, 0)
    `).run(policy_id, agent_id, priority || 'medium');

    res.json({ 
      success: true, 
      task_id: result.lastInsertRowid,
      message: '续期任务创建成功' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const task = db.prepare(`
      SELECT 
        rt.*,
        p.policy_no,
        p.premium_amount,
        p.expiry_date,
        p.product_name,
        p.product_type,
        c.name as customer_name,
        c.phone as customer_phone,
        a.name as agent_name
      FROM renewal_tasks rt
      LEFT JOIN policies p ON rt.policy_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN agents a ON rt.agent_id = a.id
      WHERE rt.id = ?
    `).get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const followUps = db.prepare(`
      SELECT * FROM follow_up_records 
      WHERE task_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    const reassignments = db.prepare(`
      SELECT tr.*, old_a.name as old_agent_name, new_a.name as new_agent_name
      FROM task_reassignments tr
      LEFT JOIN agents old_a ON tr.old_agent_id = old_a.id
      LEFT JOIN agents new_a ON tr.new_agent_id = new_a.id
      WHERE tr.task_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      ...task,
      follow_ups: followUps,
      reassignments: reassignments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  const { status, customer_feedback, next_follow_up, reminder_channel } = req.body;
  const { id } = req.params;

  try {
    const task = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const updateFields = [];
    const params = [];

    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (customer_feedback) {
      updateFields.push('customer_feedback = ?');
      params.push(customer_feedback);
    }
    if (next_follow_up) {
      updateFields.push('next_follow_up = ?');
      params.push(next_follow_up);
    }
    if (reminder_channel) {
      updateFields.push('reminder_count = reminder_count + 1');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`
      UPDATE renewal_tasks 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...params);

    if (reminder_channel) {
      db.prepare(`
        INSERT INTO follow_up_records (policy_id, task_id, content, result, follow_up_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(task.policy_id, id, `通过${reminder_channel}提醒`, 'completed', 'system');
    }

    res.json({ success: true, message: '任务更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reassign', (req, res) => {
  const { new_agent_id, reason, reassigned_by } = req.body;
  const { id } = req.params;

  try {
    const task = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(id);
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    db.prepare('BEGIN').run();

    db.prepare(`
      INSERT INTO task_reassignments (task_id, old_agent_id, new_agent_id, reason, reassigned_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, task.agent_id, new_agent_id, reason, reassigned_by || 'system');

    db.prepare(`
      UPDATE renewal_tasks 
      SET agent_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(new_agent_id, id);

    db.prepare('COMMIT').run();

    res.json({ success: true, message: '任务改派成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
