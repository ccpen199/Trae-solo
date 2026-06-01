const express = require('express');
const Joi = require('joi');
const db = require('../database');

const router = express.Router();

const taskSchema = Joi.object({
  cert_id: Joi.number().required(),
  domain_id: Joi.number().required(),
  task_type: Joi.string().valid('renewal', 'deployment', 'revocation').default('renewal'),
  trigger_days: Joi.number().default(30),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').default('pending'),
  validation_status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').default('pending'),
  issue_status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').default('pending'),
  deploy_status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').default('pending'),
  verify_status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').default('pending'),
  assignee: Joi.string().allow(''),
  due_date: Joi.string().isoDate().allow(''),
  failure_reason: Joi.string().allow('')
});

const updateStatusSchema = Joi.object({
  field: Joi.string().valid('validation', 'issue', 'deploy', 'verify').required(),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'failed').required(),
  notes: Joi.string().allow(''),
  screenshot_path: Joi.string().allow('')
});

router.get('/', (req, res) => {
  const { status = '', assignee = '', type = '' } = req.query;
  
  let query = `
    SELECT t.*, 
           c.common_name, c.expiry_date,
           d.full_domain, d.business_owner, d.contact_person,
           julianday(c.expiry_date) - julianday('now') as days_left
    FROM renewal_tasks t
    LEFT JOIN certificates c ON t.cert_id = c.id
    LEFT JOIN domains d ON t.domain_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  if (assignee) {
    query += ` AND t.assignee LIKE ?`;
    params.push(`%${assignee}%`);
  }

  if (type) {
    query += ` AND t.task_type = ?`;
    params.push(type);
  }

  query += ` ORDER BY t.created_at DESC`;

  const tasks = db.prepare(query).all(...params);
  
  tasks.forEach(t => {
    t.days_left = t.days_left ? Math.floor(t.days_left) : null;
  });

  res.json({ tasks });
});

router.get('/:id', (req, res) => {
  const task = db.prepare(`
    SELECT t.*, 
           c.common_name, c.ca_provider, c.expiry_date,
           d.full_domain, d.business_owner, d.contact_person
    FROM renewal_tasks t
    LEFT JOIN certificates c ON t.cert_id = c.id
    LEFT JOIN domains d ON t.domain_id = d.id
    WHERE t.id = ?
  `).get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const logs = db.prepare('SELECT * FROM change_logs WHERE task_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ task, logs });
});

router.post('/', (req, res) => {
  const { error, value } = taskSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO renewal_tasks (cert_id, domain_id, task_type, trigger_days, status,
                                 validation_status, issue_status, deploy_status, verify_status,
                                 assignee, due_date, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      value.cert_id,
      value.domain_id,
      value.task_type,
      value.trigger_days,
      value.status,
      value.validation_status,
      value.issue_status,
      value.deploy_status,
      value.verify_status,
      value.assignee,
      value.due_date || null,
      value.failure_reason
    );

    db.prepare(`
      INSERT INTO change_logs (domain_id, cert_id, task_id, change_type, action, description, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(value.domain_id, value.cert_id, result.lastInsertRowid, 'renewal', '创建任务', `创建续签任务`, req.user.username);

    const task = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { error, value } = taskSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const oldTask = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(req.params.id);
  
  if (!oldTask) {
    return res.status(404).json({ error: '任务不存在' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE renewal_tasks 
      SET cert_id = ?, domain_id = ?, task_type = ?, trigger_days = ?, status = ?,
          validation_status = ?, issue_status = ?, deploy_status = ?, verify_status = ?,
          assignee = ?, due_date = ?, failure_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      value.cert_id,
      value.domain_id,
      value.task_type,
      value.trigger_days,
      value.status,
      value.validation_status,
      value.issue_status,
      value.deploy_status,
      value.verify_status,
      value.assignee,
      value.due_date || null,
      value.failure_reason,
      req.params.id
    );

    db.prepare(`
      INSERT INTO change_logs (domain_id, cert_id, task_id, change_type, action, description, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(value.domain_id, value.cert_id, req.params.id, 'renewal', '更新任务', `更新续签任务状态`, req.user.username);

    const task = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(req.params.id);
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/update-status', (req, res) => {
  const { error, value } = updateStatusSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const task = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const fieldMap = {
    'validation': 'validation_status',
    'issue': 'issue_status',
    'deploy': 'deploy_status',
    'verify': 'verify_status'
  };

  const fieldName = fieldMap[value.field];

  db.prepare(`UPDATE renewal_tasks SET ${fieldName} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(value.status, req.params.id);

  const updatedTask = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(req.params.id);
  
  const allStatus = [updatedTask.validation_status, updatedTask.issue_status, updatedTask.deploy_status, updatedTask.verify_status];
  let overallStatus = 'pending';
  if (allStatus.every(s => s === 'completed')) {
    overallStatus = 'completed';
  } else if (allStatus.some(s => s === 'failed')) {
    overallStatus = 'failed';
  } else if (allStatus.some(s => s === 'in_progress')) {
    overallStatus = 'in_progress';
  }

  if (overallStatus !== task.status) {
    db.prepare('UPDATE renewal_tasks SET status = ?, completed_at = ? WHERE id = ?')
      .run(overallStatus, overallStatus === 'completed' ? new Date().toISOString() : null, req.params.id);
  }

  db.prepare(`
    INSERT INTO change_logs (domain_id, cert_id, task_id, change_type, action, description, operator, screenshot_path, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    task.domain_id, task.cert_id, req.params.id, 
    'renewal', `${value.field}状态变更`, 
    `${value.field}状态从 ${task[fieldName]} 变更为 ${value.status}${value.notes ? ': ' + value.notes : ''}`,
    req.user.username,
    value.screenshot_path || null,
    value.status === 'failed' ? 'failed' : 'success'
  );

  const finalTask = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(req.params.id);
  res.json({ task: finalTask });
});

router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM renewal_tasks WHERE id = ?').get(req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }

  db.prepare('DELETE FROM renewal_tasks WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.post('/check-expiring', (req, res) => {
  const thresholds = [30, 15, 7, 1];
  const createdTasks = [];

  thresholds.forEach(days => {
    const certs = db.prepare(`
      SELECT c.id as cert_id, c.domain_id, c.common_name, c.expiry_date
      FROM certificates c
      LEFT JOIN renewal_tasks t ON c.id = t.cert_id AND t.status != 'completed'
      WHERE julianday(c.expiry_date) - julianday('now') <= ?
        AND julianday(c.expiry_date) - julianday('now') > 0
        AND c.status != 'expired'
        AND t.id IS NULL
    `).all(days);

    certs.forEach(cert => {
      const existing = db.prepare('SELECT * FROM renewal_tasks WHERE cert_id = ? AND trigger_days = ?').get(cert.cert_id, days);
      
      if (!existing) {
        const result = db.prepare(`
          INSERT INTO renewal_tasks (cert_id, domain_id, task_type, trigger_days, status, due_date)
          VALUES (?, ?, 'renewal', ?, 'pending', ?)
        `).run(cert.cert_id, cert.domain_id, days, cert.expiry_date);

        createdTasks.push({
          id: result.lastInsertRowid,
          cert_id: cert.cert_id,
          common_name: cert.common_name,
          trigger_days: days
        });

        db.prepare(`
          INSERT INTO alerts (type, level, domain_id, cert_id, message)
          VALUES ('expiry', 'warning', ?, ?, ?)
        `).run(cert.domain_id, cert.cert_id, `证书 ${cert.common_name} 将在 ${days} 天后过期`);

        db.prepare(`
          INSERT INTO change_logs (domain_id, cert_id, task_id, change_type, action, description, operator)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(cert.domain_id, cert.cert_id, result.lastInsertRowid, 'renewal', '自动创建', `到期提醒：${days}天后过期`, 'system');
      }
    });
  });

  const expiredCerts = db.prepare(`
    SELECT c.id as cert_id, c.domain_id, c.common_name
    FROM certificates c
    WHERE julianday(c.expiry_date) - julianday('now') < 0
      AND c.status != 'expired'
  `).all();

  expiredCerts.forEach(cert => {
    db.prepare('UPDATE certificates SET status = ? WHERE id = ?').run('expired', cert.cert_id);
    
    db.prepare(`
      INSERT INTO alerts (type, level, domain_id, cert_id, message)
      VALUES ('expiry', 'critical', ?, ?, ?)
    `).run(cert.domain_id, cert.cert_id, `证书 ${cert.common_name} 已过期`);
  });

  res.json({ 
    message: '检查完成', 
    created_tasks: createdTasks,
    expired_count: expiredCerts.length
  });
});

module.exports = router;
