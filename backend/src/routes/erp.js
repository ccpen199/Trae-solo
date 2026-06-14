const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/schedules', auth, (req, res) => {
  const { designer_id, start_date, end_date, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (req.user.role === 'designer') {
    where.push('ds.designer_id = ?');
    params.push(req.user.id);
  } else if (designer_id) {
    where.push('ds.designer_id = ?');
    params.push(designer_id);
  }
  
  if (req.user.company_id) {
    where.push('u.company_id = ?');
    params.push(req.user.company_id);
  }
  
  if (start_date) { where.push('ds.start_time >= ?'); params.push(start_date); }
  if (end_date) { where.push('ds.end_time <= ?'); params.push(end_date); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT ds.*, u.name as designer_name, p.title as project_title
    FROM designer_schedules ds
    LEFT JOIN users u ON ds.designer_id = u.id
    LEFT JOIN projects p ON ds.project_id = p.id
    ${whereClause}
    ORDER BY ds.start_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM designer_schedules ds
    LEFT JOIN users u ON ds.designer_id = u.id
    ${whereClause}
  `).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.post('/schedules', auth, (req, res) => {
  const { designer_id, project_id, task_name, task_type, start_time, end_time, priority, remark } = req.body;
  
  const result = db.prepare(`
    INSERT INTO designer_schedules (designer_id, project_id, task_name, task_type, start_time, end_time, priority, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.role === 'designer' ? req.user.id : designer_id,
    project_id, task_name, task_type, start_time, end_time, priority || 2, remark
  );
  
  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
});

router.put('/schedules/:id', auth, (req, res) => {
  const { id } = req.params;
  const { task_name, task_type, start_time, end_time, status, priority, remark } = req.body;
  
  db.prepare(`
    UPDATE designer_schedules
    SET task_name = ?, task_type = ?, start_time = ?, end_time = ?, status = ?, priority = ?, remark = ?
    WHERE id = ?
  `).run(task_name, task_type, start_time, end_time, status, priority, remark, id);
  
  res.json({ code: 200, message: '更新成功' });
});

router.get('/tasks', auth, (req, res) => {
  const { project_id, status } = req.query;
  
  let where = [];
  let params = [];
  
  if (project_id) { where.push('project_id = ?'); params.push(project_id); }
  if (status) { where.push('status = ?'); params.push(status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const tasks = db.prepare(`
    SELECT * FROM construction_tasks
    ${whereClause}
    ORDER BY sort_order
  `).all(...params);
  
  res.json({ code: 200, data: tasks });
});

router.post('/tasks', auth, (req, res) => {
  const { project_id, task_name, task_code, parent_id, start_date, end_date, duration, assignee_id, sort_order } = req.body;
  
  const result = db.prepare(`
    INSERT INTO construction_tasks (project_id, task_name, task_code, parent_id, start_date, end_date, duration, assignee_id, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, task_name, task_code, parent_id, start_date, end_date, duration, assignee_id, sort_order || 0);
  
  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
});

router.put('/tasks/:id/progress', auth, (req, res) => {
  const { id } = req.params;
  const { progress, status, actual_start_date, actual_end_date } = req.body;
  
  db.prepare(`
    UPDATE construction_tasks
    SET progress = ?, status = ?, actual_start_date = ?, actual_end_date = ?
    WHERE id = ?
  `).run(progress, status, actual_start_date, actual_end_date, id);
  
  res.json({ code: 200, message: '更新成功' });
});

router.get('/materials', auth, (req, res) => {
  const { project_id, status } = req.query;
  
  let where = [];
  let params = [];
  
  if (project_id) { where.push('project_id = ?'); params.push(project_id); }
  if (status) { where.push('status = ?'); params.push(status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const materials = db.prepare(`
    SELECT * FROM material_plans
    ${whereClause}
    ORDER BY planned_arrival_date
  `).all(...params);
  
  res.json({ code: 200, data: materials });
});

router.post('/materials', auth, (req, res) => {
  const { project_id, material_name, specification, brand, quantity, unit, unit_price, total_price, planned_arrival_date, supplier, remark } = req.body;
  
  const result = db.prepare(`
    INSERT INTO material_plans (project_id, material_name, specification, brand, quantity, unit, unit_price, total_price, planned_arrival_date, supplier, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, material_name, specification, brand, quantity, unit, unit_price, total_price || quantity * unit_price, planned_arrival_date, supplier, remark);
  
  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
});

router.put('/materials/:id/status', auth, (req, res) => {
  const { id } = req.params;
  const { status, actual_arrival_date } = req.body;
  
  db.prepare(`
    UPDATE material_plans SET status = ?, actual_arrival_date = ? WHERE id = ?
  `).run(status, actual_arrival_date, id);
  
  res.json({ code: 200, message: '更新成功' });
});

module.exports = router;
