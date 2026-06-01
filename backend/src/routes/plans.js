const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { user_id, status } = req.query;
  
  let sql = `
    SELECT p.*, b.name as building_name, u.name as assigned_user_name,
           COUNT(DISTINCT pc.checkpoint_id) as checkpoint_count
    FROM patrol_plans p
    LEFT JOIN buildings b ON p.building_id = b.id
    LEFT JOIN users u ON p.assigned_user_id = u.id
    LEFT JOIN plan_checkpoints pc ON p.id = pc.plan_id
  `;
  
  const params = [];
  const conditions = [];
  
  if (user_id) {
    conditions.push('p.assigned_user_id = ?');
    params.push(user_id);
  }
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
  
  const plans = db.prepare(sql).all(...params);
  res.json(plans);
});

router.get('/my', (req, res) => {
  const plans = db.prepare(`
    SELECT p.*, b.name as building_name,
           COUNT(DISTINCT pc.checkpoint_id) as checkpoint_count
    FROM patrol_plans p
    LEFT JOIN buildings b ON p.building_id = b.id
    LEFT JOIN plan_checkpoints pc ON p.id = pc.plan_id
    WHERE p.assigned_user_id = ? AND p.status = 'active'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  
  res.json(plans);
});

router.get('/:id', (req, res) => {
  const plan = db.prepare(`
    SELECT p.*, b.name as building_name, b.area, u.name as assigned_user_name
    FROM patrol_plans p
    LEFT JOIN buildings b ON p.building_id = b.id
    LEFT JOIN users u ON p.assigned_user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }
  
  const checkpoints = db.prepare(`
    SELECT c.*, pc.order_num, b.name as building_name
    FROM plan_checkpoints pc
    LEFT JOIN checkpoints c ON pc.checkpoint_id = c.id
    LEFT JOIN buildings b ON c.building_id = b.id
    WHERE pc.plan_id = ?
    ORDER BY pc.order_num
  `).all(req.params.id);
  
  plan.checkpoints = checkpoints;
  res.json(plan);
});

router.post('/', requireRole('manager'), (req, res) => {
  const { name, building_id, frequency, time_window_start, time_window_end, assigned_user_id, checkpoints } = req.body;
  
  if (!name || !building_id || !frequency || !time_window_start || !time_window_end) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO patrol_plans (name, building_id, frequency, time_window_start, time_window_end, assigned_user_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(name, building_id, frequency, time_window_start, time_window_end, assigned_user_id || null);

  const planId = result.lastInsertRowid;
  
  if (checkpoints && checkpoints.length > 0) {
    const insertPC = db.prepare('INSERT INTO plan_checkpoints (plan_id, checkpoint_id, order_num) VALUES (?, ?, ?)');
    checkpoints.forEach((cp, index) => {
      insertPC.run(planId, typeof cp === 'object' ? cp.id : cp, index + 1);
    });
  }

  const plan = db.prepare('SELECT * FROM patrol_plans WHERE id = ?').get(planId);
  res.status(201).json(plan);
});

router.put('/:id', requireRole('manager'), (req, res) => {
  const { name, frequency, time_window_start, time_window_end, assigned_user_id, status, checkpoints } = req.body;
  
  const plan = db.prepare('SELECT * FROM patrol_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }

  db.prepare(`
    UPDATE patrol_plans 
    SET name = ?, frequency = ?, time_window_start = ?, time_window_end = ?, assigned_user_id = ?, status = ?
    WHERE id = ?
  `).run(
    name || plan.name,
    frequency || plan.frequency,
    time_window_start || plan.time_window_start,
    time_window_end || plan.time_window_end,
    assigned_user_id !== undefined ? assigned_user_id : plan.assigned_user_id,
    status || plan.status,
    req.params.id
  );

  if (checkpoints) {
    db.prepare('DELETE FROM plan_checkpoints WHERE plan_id = ?').run(req.params.id);
    const insertPC = db.prepare('INSERT INTO plan_checkpoints (plan_id, checkpoint_id, order_num) VALUES (?, ?, ?)');
    checkpoints.forEach((cp, index) => {
      insertPC.run(req.params.id, typeof cp === 'object' ? cp.id : cp, index + 1);
    });
  }

  const updated = db.prepare('SELECT * FROM patrol_plans WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireRole('manager'), (req, res) => {
  const plan = db.prepare('SELECT * FROM patrol_plans WHERE id = ?').get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' });
  }

  db.prepare('DELETE FROM patrol_plans WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
