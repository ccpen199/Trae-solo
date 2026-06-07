const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

router.use(auth);

router.use((req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: '无权限访问' });
  }
  next();
});

router.get('/overview', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalEnterprises = db.prepare('SELECT COUNT(*) as count FROM enterprises').get().count;
  const totalPolicies = db.prepare('SELECT COUNT(*) as count FROM policies WHERE status = ?').get('published').count;
  const totalReservations = db.prepare('SELECT COUNT(*) as count FROM reservations').get().count;
  
  const todayReservations = db.prepare(`
    SELECT COUNT(*) as count FROM reservations 
    WHERE reservation_date = ?
  `).get(today).count;
  
  const todayApplications = db.prepare(`
    SELECT COUNT(*) as count FROM policy_applications 
    WHERE DATE(submitted_at) = ?
  `).get(today).count;
  
  const pendingApplications = db.prepare(`
    SELECT COUNT(*) as count FROM policy_applications 
    WHERE status = 'submitted'
  `).get().count;
  
  res.json({
    statistics: {
      totalUsers,
      totalEnterprises,
      totalPolicies,
      totalReservations,
      todayReservations,
      todayApplications,
      pendingApplications
    }
  });
});

router.get('/policy-effectiveness', auth, (req, res) => {
  const policies = db.prepare(`
    SELECT p.id, p.title, p.department, p.benefit_amount, p.benefit_type,
           COUNT(pa.id) as application_count,
           SUM(CASE WHEN pa.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
           SUM(CASE WHEN pa.status = 'paid' THEN 1 ELSE 0 END) as paid_count
    FROM policies p
    LEFT JOIN policy_applications pa ON p.id = pa.policy_id
    GROUP BY p.id
    ORDER BY application_count DESC
    LIMIT 10
  `).all();
  
  const totalBenefit = db.prepare(`
    SELECT SUM(p.benefit_amount) as total, COUNT(*) as count
    FROM policy_applications pa
    JOIN policies p ON pa.policy_id = p.id
    WHERE pa.status = 'paid'
  `).get();
  
  res.json({
    policies,
    totalBenefitDisbursed: totalBenefit.total || 0,
    totalPaidApplications: totalBenefit.count || 0
  });
});

router.get('/applications', auth, (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (status) {
    where.push('pa.status = ?');
    params.push(status);
  }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const applications = db.prepare(`
    SELECT pa.*, p.title as policy_title, e.name as enterprise_name,
           u.real_name as applicant_name, u.phone as applicant_phone
    FROM policy_applications pa
    JOIN policies p ON pa.policy_id = p.id
    JOIN enterprises e ON pa.enterprise_id = e.id
    JOIN users u ON pa.user_id = u.id
    ${whereSql}
    ORDER BY pa.submitted_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM policy_applications pa ${whereSql}
  `).get(...params).count;
  
  res.json({ list: applications, total });
});

router.put('/applications/:id/review', auth, (req, res) => {
  const { action, remark } = req.body;
  const { id } = req.params;
  
  const application = db.prepare('SELECT * FROM policy_applications WHERE id = ?').get(id);
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  
  let newStatus, newStage;
  
  if (action === 'approve') {
    newStatus = 'reviewing';
    newStage = 'approval';
  } else if (action === 'reject') {
    newStatus = 'rejected';
    newStage = 'completed';
  } else if (action === 'approve_final') {
    newStatus = 'approved';
    newStage = 'payment';
  } else if (action === 'pay') {
    newStatus = 'paid';
    newStage = 'completed';
  } else {
    return res.status(400).json({ error: '无效操作' });
  }
  
  db.prepare(`
    UPDATE policy_applications 
    SET status = ?, current_stage = ?, reviewed_at = CURRENT_TIMESTAMP, reject_reason = ?
    WHERE id = ?
  `).run(newStatus, newStage, action === 'reject' ? remark : null, id);
  
  db.prepare(`
    INSERT INTO policy_application_logs (application_id, stage, status, operator, remark)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, newStage, newStatus, '管理员', remark || '');
  
  res.json({ message: '操作成功', status: newStatus });
});

router.get('/services', auth, (req, res) => {
  const services = db.prepare(`
    SELECT * FROM service_items
    ORDER BY item_code
  `).all();
  
  res.json(services);
});

router.post('/services', auth, (req, res) => {
  const { itemCode, name, department, category, description, requiredMaterials, handlingTime } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO service_items (item_code, name, department, category, description, required_materials, handling_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(itemCode, name, department, category, description, requiredMaterials, handlingTime);
    
    res.json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '事项编码已存在' });
    }
    res.status(500).json({ error: '创建失败' });
  }
});

router.put('/services/:code', auth, (req, res) => {
  const { name, department, category, description, requiredMaterials, handlingTime, status } = req.body;
  
  db.prepare(`
    UPDATE service_items 
    SET name = ?, department = ?, category = ?, description = ?, required_materials = ?, handling_time = ?, status = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
    WHERE item_code = ?
  `).run(name, department, category, description, requiredMaterials, handlingTime, status || 'active', req.params.code);
  
  res.json({ message: '更新成功' });
});

router.post('/publish', auth, (req, res) => {
  const { itemType, itemId, platform, version } = req.body;
  
  const platforms = platform.split(',');
  
  platforms.forEach(p => {
    db.prepare(`
      INSERT INTO publish_records (item_type, item_id, platform, version, published_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(itemType, itemId, p.trim(), version, 'admin');
  });
  
  res.json({ message: '发布成功', platforms });
});

router.get('/publish/history', auth, (req, res) => {
  const records = db.prepare(`
    SELECT * FROM publish_records
    ORDER BY published_at DESC
    LIMIT 50
  `).all();
  
  res.json(records);
});

router.get('/enterprises', auth, (req, res) => {
  const enterprises = db.prepare(`
    SELECT e.*, COUNT(eb.id) as employee_count
    FROM enterprises e
    LEFT JOIN enterprise_bindings eb ON e.id = eb.enterprise_id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();
  
  res.json(enterprises);
});

router.get('/bindings/pending', auth, (req, res) => {
  const bindings = db.prepare(`
    SELECT eb.*, u.real_name, u.phone, u.id_card, e.name as enterprise_name
    FROM enterprise_bindings eb
    JOIN users u ON eb.user_id = u.id
    JOIN enterprises e ON eb.enterprise_id = e.id
    WHERE eb.status = 'pending'
    ORDER BY eb.created_at DESC
  `).all();
  
  res.json(bindings);
});

router.put('/bindings/:id/verify', auth, (req, res) => {
  const { status } = req.body;
  
  db.prepare(`
    UPDATE enterprise_bindings 
    SET status = ?, verified_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status === 'verified' ? 'verified' : 'rejected', req.params.id);
  
  res.json({ message: '审核完成' });
});

module.exports = router;
