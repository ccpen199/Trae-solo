const { db } = require('../models/database');

const createChangeOrder = (req, res) => {
  const { title, description, changeType, appId, envId, configVersionId, riskLevel, rollbackPlan } = req.body;

  if (!title || !changeType || !appId) {
    return res.status(400).json({ error: '标题、变更类型和应用ID不能为空' });
  }

  const changeId = `CR-${Date.now()}`;

  const stmt = db.prepare(`
    INSERT INTO change_orders (change_id, title, description, change_type, app_id, env_id, config_version_id, risk_level, rollback_plan, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `);

  const result = stmt.run(
    changeId,
    title,
    description,
    changeType,
    appId,
    envId || null,
    configVersionId || null,
    riskLevel || 'medium',
    rollbackPlan,
    req.user.id
  );

  res.json({
    id: result.lastInsertRowid,
    changeId,
    message: '变更单创建成功'
  });
};

const getChangeOrders = (req, res) => {
  const { status, appId, changeType, riskLevel, startDate, endDate } = req.query;

  let query = `
    SELECT c.*, a.app_name, e.env_name, creator.real_name as creator_name, 
           reviewer.real_name as reviewer_name, implementer.real_name as implementer_name
    FROM change_orders c
    LEFT JOIN applications a ON c.app_id = a.id
    LEFT JOIN environments e ON c.env_id = e.id
    LEFT JOIN users creator ON c.created_by = creator.id
    LEFT JOIN users reviewer ON c.reviewer_id = reviewer.id
    LEFT JOIN users implementer ON c.implemented_by = implementer.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }

  if (appId) {
    query += ' AND c.app_id = ?';
    params.push(appId);
  }

  if (changeType) {
    query += ' AND c.change_type = ?';
    params.push(changeType);
  }

  if (riskLevel) {
    query += ' AND c.risk_level = ?';
    params.push(riskLevel);
  }

  if (startDate) {
    query += ' AND c.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND c.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY c.created_at DESC LIMIT 100';

  const orders = db.prepare(query).all(...params);

  res.json({ changeOrders: orders });
};

const getChangeOrderById = (req, res) => {
  const order = db.prepare(`
    SELECT c.*, a.app_name, e.env_name, creator.real_name as creator_name, 
           reviewer.real_name as reviewer_name, implementer.real_name as implementer_name
    FROM change_orders c
    LEFT JOIN applications a ON c.app_id = a.id
    LEFT JOIN environments e ON c.env_id = e.id
    LEFT JOIN users creator ON c.created_by = creator.id
    LEFT JOIN users reviewer ON c.reviewer_id = reviewer.id
    LEFT JOIN users implementer ON c.implemented_by = implementer.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  res.json({ changeOrder: order });
};

const reviewChangeOrder = (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  const order = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  db.prepare(`
    UPDATE change_orders 
    SET status = ?, reviewer_id = ?, reviewer_comment = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, comment, id);

  res.json({ message: '变更单审核完成' });
};

const getAlerts = (req, res) => {
  const { status, severity, alertType, appId, startDate, endDate } = req.query;

  let query = `
    SELECT a.*, app.app_name, e.env_name, 
           assignee.real_name as assignee_name,
           resolver.real_name as resolver_name
    FROM alerts a
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN environments e ON a.env_id = e.id
    LEFT JOIN users assignee ON a.assignee_id = assignee.id
    LEFT JOIN users resolver ON a.resolved_by = resolver.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  if (severity) {
    query += ' AND a.severity = ?';
    params.push(severity);
  }

  if (alertType) {
    query += ' AND a.alert_type = ?';
    params.push(alertType);
  }

  if (appId) {
    query += ' AND a.app_id = ?';
    params.push(appId);
  }

  if (startDate) {
    query += ' AND a.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND a.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY a.created_at DESC LIMIT 100';

  const alerts = db.prepare(query).all(...params);

  res.json({ alerts });
};

const updateAlertStatus = (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  let updateQuery = `
    UPDATE alerts 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
  `;
  const params = [status];

  if (status === 'acknowledged') {
    updateQuery += ', acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP';
    params.push(req.user.id);
  } else if (status === 'resolved') {
    updateQuery += ', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?';
    params.push(req.user.id, resolutionNotes);
  }

  updateQuery += ' WHERE id = ?';
  params.push(id);

  db.prepare(updateQuery).run(...params);

  res.json({ message: '告警状态已更新' });
};

const getExceptions = (req, res) => {
  const { taskId, compensationStatus, startDate, endDate } = req.query;

  let query = `
    SELECT e.*, handler.real_name as handler_name
    FROM exception_records e
    LEFT JOIN users handler ON e.handled_by = handler.id
    WHERE 1=1
  `;
  const params = [];

  if (taskId) {
    query += ' AND e.task_id = ?';
    params.push(taskId);
  }

  if (compensationStatus) {
    query += ' AND e.compensation_status = ?';
    params.push(compensationStatus);
  }

  if (startDate) {
    query += ' AND e.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND e.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY e.created_at DESC LIMIT 100';

  const exceptions = db.prepare(query).all(...params);

  res.json({ exceptions });
};

const handleException = (req, res) => {
  const { id } = req.params;
  const { compensationAction, compensationStatus, manualNotes } = req.body;

  const exception = db.prepare('SELECT * FROM exception_records WHERE id = ?').get(id);
  if (!exception) {
    return res.status(404).json({ error: '异常记录不存在' });
  }

  db.prepare(`
    UPDATE exception_records 
    SET compensation_action = ?, compensation_status = ?, manual_notes = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(compensationAction, compensationStatus, manualNotes, req.user.id, id);

  res.json({ message: '异常处理完成' });
};

const getDashboardStats = (req, res) => {
  const taskStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM execution_tasks
    GROUP BY status
  `).all();

  const alertStats = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM alerts
    WHERE status != 'closed'
    GROUP BY severity
  `).all();

  const appStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM applications
    GROUP BY status
  `).all();

  const recentActivities = db.prepare(`
    SELECT 'task' as type, task_id as id, task_type as title, status, created_at
    FROM execution_tasks
    UNION ALL
    SELECT 'alert' as type, alert_id as id, title, severity as status, created_at
    FROM alerts
    ORDER BY created_at DESC
    LIMIT 20
  `).all();

  res.json({
    taskStats,
    alertStats,
    appStats,
    recentActivities
  });
};

module.exports = {
  createChangeOrder,
  getChangeOrders,
  getChangeOrderById,
  reviewChangeOrder,
  getAlerts,
  updateAlertStatus,
  getExceptions,
  handleException,
  getDashboardStats
};
