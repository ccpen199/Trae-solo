const express = require('express');
const db = require('../database');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/companies', auth, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 10, audit_status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (audit_status) { where.push('audit_status = ?'); params.push(audit_status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT * FROM companies
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM companies ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.post('/companies/:id/audit', auth, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { audit_status, audit_remark } = req.body;
  
  db.prepare(`
    UPDATE companies SET audit_status = ?, audit_remark = ?, audit_time = CURRENT_TIMESTAMP, status = ?
    WHERE id = ?
  `).run(audit_status, audit_remark, audit_status === 'approved' ? 1 : 0, id);
  
  res.json({ code: 200, message: '审核完成' });
});

router.get('/process-knowledge', auth, (req, res) => {
  const { page = 1, pageSize = 20, category } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['status = 1'];
  let params = [];
  
  if (category) { where.push('category = ?'); params.push(category); }
  
  const whereClause = 'WHERE ' + where.join(' AND ');
  
  const list = db.prepare(`
    SELECT * FROM process_knowledge
    ${whereClause}
    ORDER BY category, id
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM process_knowledge ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.get('/process-knowledge/categories', auth, (req, res) => {
  const categories = db.prepare(`
    SELECT category as name, COUNT(*) as count
    FROM process_knowledge
    WHERE status = 1
    GROUP BY category
    ORDER BY id
  `).all();
  
  res.json({ code: 200, data: categories });
});

router.post('/process-knowledge', auth, requireRole('admin'), (req, res) => {
  const { category, title, content, video_url, standard, acceptance_criteria, safety_notes, duration_standard } = req.body;
  
  const result = db.prepare(`
    INSERT INTO process_knowledge (category, title, content, video_url, standard, acceptance_criteria, safety_notes, duration_standard)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category, title, content, video_url, standard, acceptance_criteria, safety_notes, duration_standard);
  
  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
});

router.get('/material-prices', auth, (req, res) => {
  const { page = 1, pageSize = 20, region, material_name } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (region) { where.push('region = ?'); params.push(region); }
  if (material_name) { where.push('material_name LIKE ?'); params.push(`%${material_name}%`); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT * FROM material_price_monitor
    ${whereClause}
    ORDER BY price_date DESC, id
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM material_price_monitor ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.get('/material-prices/trend', auth, (req, res) => {
  const { material_name, days = 30 } = req.query;
  
  const data = db.prepare(`
    SELECT price_date, price, trend, change_rate
    FROM material_price_monitor
    WHERE material_name = ?
    ORDER BY price_date DESC
    LIMIT ?
  `).all(material_name, parseInt(days));
  
  res.json({ code: 200, data: data.reverse() });
});

router.post('/material-prices', auth, requireRole('admin'), (req, res) => {
  const { material_name, specification, brand, unit, region, price, price_date, source } = req.body;
  
  const result = db.prepare(`
    INSERT INTO material_price_monitor (material_name, specification, brand, unit, region, price, price_date, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(material_name, specification, brand, unit, region, price, price_date, source);
  
  res.json({ code: 200, message: '创建成功', data: { id: result.lastInsertRowid } });
});

router.get('/complaints', auth, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (status) { where.push('status = ?'); params.push(status); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT c.*, p.title as project_title, u.name as complainant_name, co.name as company_name
    FROM complaints c
    LEFT JOIN projects p ON c.project_id = p.id
    LEFT JOIN users u ON c.complainant_id = u.id
    LEFT JOIN companies co ON c.company_id = co.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM complaints ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

router.post('/complaints/:id/handle', auth, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const { handle_result } = req.body;
  
  db.prepare(`
    UPDATE complaints SET status = 'resolved', handler_id = ?, handle_result = ?, handle_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, handle_result, id);
  
  res.json({ code: 200, message: '处理完成' });
});

router.get(['/statistics/dashboard', '/stats', '/dashboard'], auth, requireRole('admin'), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies WHERE status = 1').get().count;
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  const totalCases = db.prepare('SELECT COUNT(*) as count FROM cases').get().count;
  
  const pendingAudits = db.prepare("SELECT COUNT(*) as count FROM companies WHERE audit_status = 'pending'").get().count;
  const pendingComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'").get().count;
  const inProgressProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress'").get().count;
  
  const projectsByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM projects GROUP BY status
  `).all();
  
  const complaintsByType = db.prepare(`
    SELECT type, COUNT(*) as count FROM complaints GROUP BY type
  `).all();
  
  res.json({ 
    code: 200, 
    data: {
      overview: {
        totalUsers, totalCompanies, totalProjects, totalCases,
        pendingAudits, pendingComplaints, inProgressProjects
      },
      projectsByStatus,
      complaintsByType
    }
  });
});

router.get('/audit-logs', auth, requireRole('admin'), (req, res) => {
  const { page = 1, pageSize = 30, module, user_id } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (module) { where.push('module = ?'); params.push(module); }
  if (user_id) { where.push('user_id = ?'); params.push(user_id); }
  
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const list = db.prepare(`
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`).get(...params).count;
  
  res.json({ code: 200, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

module.exports = router;
