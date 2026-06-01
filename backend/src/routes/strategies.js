import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('strategy', 'read'), (req, res) => {
  const { env_id, strategy_type, status, keyword, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT bs.*, e.env_name, a.app_code, a.app_name, u.real_name as creator_name, au.real_name as approver_name
    FROM backup_strategies bs
    JOIN environments e ON bs.env_id = e.id
    JOIN applications a ON e.app_id = a.id
    LEFT JOIN users u ON bs.created_by = u.id
    LEFT JOIN users au ON bs.approved_by = au.id
    WHERE 1=1
  `;
  const params = [];

  if (env_id) {
    query += ' AND bs.env_id = ?';
    params.push(env_id);
  }
  if (strategy_type) {
    query += ' AND bs.strategy_type = ?';
    params.push(strategy_type);
  }
  if (status) {
    query += ' AND bs.status = ?';
    params.push(status);
  }
  if (keyword) {
    query += ' AND (bs.strategy_name LIKE ? OR a.app_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY bs.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const strategies = db.prepare(query).all(...params);

  res.json({
    list: strategies,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', checkPermission('strategy', 'create'), (req, res) => {
  const {
    env_id, strategy_name, strategy_type, schedule_type, schedule_cron,
    retention_days, storage_path, compression_enabled, encryption_enabled,
    pre_checks, post_actions
  } = req.body;

  if (!env_id || !strategy_name || !strategy_type || !schedule_type || !storage_path) {
    return res.status(400).json({ error: '必填项不完整' });
  }

  const result = db.prepare(`
    INSERT INTO backup_strategies (
      env_id, strategy_name, strategy_type, schedule_type, schedule_cron,
      retention_days, storage_path, compression_enabled, encryption_enabled,
      rule_version, pre_checks, post_actions, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'v1.0', ?, ?, 'draft', ?)
  `).run(
    env_id, strategy_name, strategy_type, schedule_type, schedule_cron,
    retention_days || 30, storage_path, compression_enabled ? 1 : 0,
    encryption_enabled ? 1 : 0, pre_checks ? JSON.stringify(pre_checks) : null,
    post_actions ? JSON.stringify(post_actions) : null, req.user.id
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'create', 'strategy', ?, ?, ?)
  `).run(req.user.id, req.user.username, result.lastInsertRowid, strategy_name, `创建备份策略: ${strategy_name}`);

  res.json({
    id: result.lastInsertRowid,
    strategy_name,
    message: '备份策略创建成功，状态为草稿'
  });
});

router.put('/:id', checkPermission('strategy', 'update'), (req, res) => {
  const { id } = req.params;
  const {
    strategy_name, strategy_type, schedule_type, schedule_cron,
    retention_days, storage_path, compression_enabled, encryption_enabled,
    pre_checks, post_actions, status
  } = req.body;

  const strategy = db.prepare('SELECT * FROM backup_strategies WHERE id = ?').get(id);
  if (!strategy) {
    return res.status(404).json({ error: '备份策略不存在' });
  }

  db.prepare(`
    UPDATE backup_strategies 
    SET strategy_name = ?, strategy_type = ?, schedule_type = ?, schedule_cron = ?,
        retention_days = ?, storage_path = ?, compression_enabled = ?, encryption_enabled = ?,
        pre_checks = ?, post_actions = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    strategy_name || strategy.strategy_name,
    strategy_type || strategy.strategy_type,
    schedule_type || strategy.schedule_type,
    schedule_cron,
    retention_days || strategy.retention_days,
    storage_path || strategy.storage_path,
    compression_enabled !== undefined ? (compression_enabled ? 1 : 0) : strategy.compression_enabled,
    encryption_enabled !== undefined ? (encryption_enabled ? 1 : 0) : strategy.encryption_enabled,
    pre_checks ? JSON.stringify(pre_checks) : strategy.pre_checks,
    post_actions ? JSON.stringify(post_actions) : strategy.post_actions,
    status || strategy.status,
    id
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'update', 'strategy', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, strategy_name || strategy.strategy_name, `更新备份策略: ${strategy.strategy_name}`);

  res.json({ message: '备份策略更新成功' });
});

router.post('/:id/approve', checkPermission('strategy', 'approve'), (req, res) => {
  const { id } = req.params;

  const strategy = db.prepare('SELECT * FROM backup_strategies WHERE id = ?').get(id);
  if (!strategy) {
    return res.status(404).json({ error: '备份策略不存在' });
  }

  db.prepare(`
    UPDATE backup_strategies 
    SET status = 'active', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'approve', 'strategy', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, strategy.strategy_name, `审批备份策略: ${strategy.strategy_name}`);

  res.json({ message: '备份策略审批通过并激活' });
});

router.get('/:id', checkPermission('strategy', 'read'), (req, res) => {
  const strategy = db.prepare(`
    SELECT bs.*, e.env_name, a.app_code, a.app_name, u.real_name as creator_name, au.real_name as approver_name
    FROM backup_strategies bs
    JOIN environments e ON bs.env_id = e.id
    JOIN applications a ON e.app_id = a.id
    LEFT JOIN users u ON bs.created_by = u.id
    LEFT JOIN users au ON bs.approved_by = au.id
    WHERE bs.id = ?
  `).get(req.params.id);

  if (!strategy) {
    return res.status(404).json({ error: '备份策略不存在' });
  }

  res.json(strategy);
});

router.delete('/:id', checkPermission('strategy', 'delete'), (req, res) => {
  const strategy = db.prepare('SELECT * FROM backup_strategies WHERE id = ?').get(req.params.id);
  if (!strategy) {
    return res.status(404).json({ error: '备份策略不存在' });
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE strategy_id = ?').get(req.params.id).count;
  if (taskCount > 0) {
    return res.status(400).json({ error: '该策略下存在执行任务，无法删除' });
  }

  db.prepare('DELETE FROM backup_strategies WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'delete', 'strategy', ?, ?, ?)
  `).run(req.user.id, req.user.username, req.params.id, strategy.strategy_name, `删除备份策略: ${strategy.strategy_name}`);

  res.json({ message: '备份策略删除成功' });
});

export default router;
