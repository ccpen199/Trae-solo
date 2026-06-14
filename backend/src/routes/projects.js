const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (req.user.role === 'owner') {
    where.push('p.owner_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === 'designer') {
    where.push('p.designer_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === 'manager') {
    where.push('p.manager_id = ?');
    params.push(req.user.id);
  } else if (req.user.company_id) {
    where.push('p.company_id = ?');
    params.push(req.user.company_id);
  }
  
  if (status) { where.push('p.status = ?'); params.push(status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT p.*, u.name as owner_name, c.name as company_name,
           d.name as designer_name, m.name as manager_name
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN companies c ON p.company_id = c.id
    LEFT JOIN users d ON p.designer_id = d.id
    LEFT JOIN users m ON p.manager_id = m.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM projects p ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.get('/:id', auth, (req, res) => {
  const { id } = req.params;
  
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name, u.phone as owner_phone,
           c.name as company_name, c.contact_phone as company_phone,
           d.name as designer_name, d.phone as designer_phone,
           m.name as manager_name, m.phone as manager_phone
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    LEFT JOIN companies c ON p.company_id = c.id
    LEFT JOIN users d ON p.designer_id = d.id
    LEFT JOIN users m ON p.manager_id = m.id
    WHERE p.id = ?
  `).get(id);
  
  if (!project) {
    return res.json({ code: 404, message: '项目不存在' });
  }
  
  const tasks = db.prepare('SELECT * FROM construction_tasks WHERE project_id = ? ORDER BY sort_order').all(id);
  const materials = db.prepare('SELECT * FROM material_plans WHERE project_id = ? ORDER BY planned_arrival_date').all(id);
  const funds = db.prepare('SELECT * FROM fund_supervision WHERE project_id = ? ORDER BY id').all(id);
  
  res.json({ code: 200, data: { ...project, tasks, materials, funds } });
});

router.get('/:id/gantt', auth, (req, res) => {
  const { id } = req.params;
  
  const tasks = db.prepare(`
    SELECT id, task_name as name, start_date as start, end_date as end,
           progress, status, parent_id, sort_order
    FROM construction_tasks
    WHERE project_id = ?
    ORDER BY sort_order
  `).all(id);
  
  res.json({ code: 200, data: tasks });
});

router.post('/', auth, (req, res) => {
  const {
    title, address, layout_type, area, style, budget,
    owner_name, owner_phone, owner_email,
    start_date, end_date,
    designer_id, manager_id,
    construction_tasks, material_plans, fund_supervision
  } = req.body;

  if (!title || !address || !owner_name || !owner_phone) {
    return res.json({ code: 400, message: '项目名称、地址、业主姓名和电话为必填项' });
  }

  const companyId = req.user.company_id || 1;
  const ownerStmt = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?');
  let ownerId = ownerStmt.get(owner_phone, owner_phone)?.id;
  
  if (!ownerId) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const result = db.prepare(`
      INSERT INTO users (username, name, phone, email, password, role, company_id, status)
      VALUES (?, ?, ?, ?, ?, 'owner', ?, 'approved')
    `).run(owner_phone, owner_name, owner_phone, owner_email || '', hashedPassword, companyId);
    ownerId = result.lastInsertRowid;
  }

  const insertProject = db.prepare(`
    INSERT INTO projects (
      title, address, layout_type, area, style, budget,
      owner_id, company_id, designer_id, manager_id,
      start_date, end_date, status, progress, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, datetime('now'))
  `);

  const projectResult = insertProject.run(
    title, address, layout_type, area, style, budget,
    ownerId, companyId, designer_id, manager_id,
    start_date, end_date
  );

  const projectId = projectResult.lastInsertRowid;

  if (construction_tasks && construction_tasks.length > 0) {
    const insertTask = db.prepare(`
      INSERT INTO construction_tasks (project_id, task_name, start_date, end_date, sort_order, status, progress)
      VALUES (?, ?, ?, ?, ?, 'pending', 0)
    `);
    construction_tasks.forEach((task, index) => {
      insertTask.run(projectId, task.task_name, task.start_date, task.end_date, index);
    });
  }

  if (material_plans && material_plans.length > 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO material_plans (project_id, material_name, specification, quantity, unit, planned_arrival_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `);
    material_plans.forEach(material => {
      insertMaterial.run(projectId, material.material_name, material.specification, material.quantity, material.unit, material.planned_arrival_date);
    });
  }

  if (fund_supervision && fund_supervision.length > 0) {
    const insertFund = db.prepare(`
      INSERT INTO fund_supervision (project_id, stage_name, amount, percentage, status)
      VALUES (?, ?, ?, ?, 'frozen')
    `);
    fund_supervision.forEach(fund => {
      insertFund.run(projectId, fund.stage_name, fund.amount, fund.percentage);
    });
  }

  db.prepare(`INSERT INTO audit_logs (user_id, action, module, target_id, ip, user_agent) VALUES (?, 'create', 'projects', ?, ?, ?)`)
    .run(req.user.id, projectId, req.ip, req.headers['user-agent'] || '');

  res.json({ code: 200, message: '项目创建成功', data: { id: projectId } });
});

module.exports = router;
