import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';
import { validateChangeOrder } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('change_order', 'read'), (req, res) => {
  const { 
    app_id, change_type, status, applicant_id, 
    start_date, end_date, keyword, page = 1, pageSize = 20 
  } = req.query;
  
  let query = `
    SELECT co.*, a.app_code, a.app_name, e.env_name, 
           bs.strategy_name, u.real_name as applicant_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN environments e ON co.env_id = e.id
    LEFT JOIN backup_strategies bs ON co.strategy_id = bs.id
    LEFT JOIN users u ON co.applicant_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) {
    query += ' AND co.app_id = ?';
    params.push(app_id);
  }
  if (change_type) {
    query += ' AND co.change_type = ?';
    params.push(change_type);
  }
  if (status) {
    query += ' AND co.status = ?';
    params.push(status);
  }
  if (applicant_id) {
    query += ' AND co.applicant_id = ?';
    params.push(applicant_id);
  }
  if (start_date) {
    query += ' AND co.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND co.created_at <= ?';
    params.push(end_date);
  }
  if (keyword) {
    query += ' AND (co.change_no LIKE ? OR co.title LIKE ? OR a.app_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY co.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const orders = db.prepare(query).all(...params);

  res.json({
    list: orders,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', checkPermission('change_order', 'create'), validateChangeOrder, (req, res) => {
  const {
    change_type, title, description, app_id, env_id, strategy_id,
    original_config, new_config, risk_level, required_materials
  } = req.body;

  const changeNo = `CO-${Date.now()}`;

  const result = db.prepare(`
    INSERT INTO change_orders (
      change_no, change_type, title, description, app_id, env_id, strategy_id,
      original_config, new_config, status, current_node, applicant_id, 
      required_materials, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', 0, ?, ?, ?)
  `).run(
    changeNo,
    change_type,
    title,
    description,
    app_id,
    env_id || null,
    strategy_id || null,
    original_config ? JSON.stringify(original_config) : null,
    new_config ? JSON.stringify(new_config) : null,
    req.user.id,
    required_materials ? JSON.stringify(required_materials) : null,
    risk_level || 'medium'
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'create', 'change_order', ?, ?, ?)
  `).run(req.user.id, req.user.username, result.lastInsertRowid, changeNo, `创建变更单: ${changeNo}`);

  res.json({
    id: result.lastInsertRowid,
    change_no: changeNo,
    message: '变更单已创建，等待审批'
  });
});

router.get('/:id', checkPermission('change_order', 'read'), (req, res) => {
  const order = db.prepare(`
    SELECT co.*, a.app_code, a.app_name, e.env_name, 
           bs.strategy_name, u.real_name as applicant_name
    FROM change_orders co
    LEFT JOIN applications a ON co.app_id = a.id
    LEFT JOIN environments e ON co.env_id = e.id
    LEFT JOIN backup_strategies bs ON co.strategy_id = bs.id
    LEFT JOIN users u ON co.applicant_id = u.id
    WHERE co.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  res.json(order);
});

router.post('/:id/approve', checkPermission('change_order', 'approve'), (req, res) => {
  const { id } = req.params;
  const { approved, note } = req.body;

  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'pending_approval') {
    return res.status(400).json({ error: '该变更单不处于待审批状态' });
  }

  const newStatus = approved ? 'approved' : 'rejected';
  
  db.prepare(`
    UPDATE change_orders 
    SET status = ?, approved_by = ?, previous_node_result = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    newStatus,
    JSON.stringify([{ user_id: req.user.id, note, time: new Date().toISOString() }]),
    JSON.stringify({ status: approved ? 'success' : 'rejected', note }),
    id
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'approve', 'change_order', ?, ?, ?)
  `).run(
    req.user.id, 
    req.user.username, 
    id, 
    order.change_no, 
    `${approved ? '审批通过' : '审批拒绝'}变更单: ${order.change_no}`
  );

  res.json({ message: `变更单已${approved ? '审批通过' : '审批拒绝'}` });
});

router.post('/:id/execute', checkPermission('change_order', 'execute'), (req, res) => {
  const { id } = req.params;

  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (order.status !== 'approved') {
    return res.status(400).json({ error: '只能执行已审批通过的变更单' });
  }

  if (order.new_config && order.strategy_id) {
    const newConfig = JSON.parse(order.new_config);
    db.prepare(`
      UPDATE backup_strategies 
      SET strategy_name = ?, strategy_type = ?, schedule_type = ?, 
          retention_days = ?, storage_path = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newConfig.strategy_name,
      newConfig.strategy_type,
      newConfig.schedule_type,
      newConfig.retention_days,
      newConfig.storage_path,
      order.strategy_id
    );
  }

  db.prepare(`
    UPDATE change_orders 
    SET status = 'executed', executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'execute', 'change_order', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, order.change_no, `执行变更单: ${order.change_no}`);

  res.json({ message: '变更单已执行' });
});

export default router;
