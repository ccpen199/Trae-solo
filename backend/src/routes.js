import db from './database.js';
import { executeTask, generateComparisonReport } from './crawler.js';

const getClientIp = (req) => {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
};

const logOperation = (req, userId, action, targetType, targetId, details) => {
  const ip = getClientIp(req);
  const stmt = db.prepare(`
    INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId, action, targetType, targetId, JSON.stringify(details || {}), ip);
};

export const setupRoutes = (app) => {
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  });

  app.get('/api/competitors', (req, res) => {
    const { category, status } = req.query;
    let query = 'SELECT * FROM competitors WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    
    const competitors = db.prepare(query).all(...params);
    res.json(competitors);
  });

  app.get('/api/competitors/:id', (req, res) => {
    const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    const details = db.prepare('SELECT * FROM competitor_details WHERE competitor_id = ? ORDER BY created_at DESC').all(req.params.id);
    const prices = db.prepare('SELECT * FROM price_history WHERE competitor_id = ? ORDER BY recorded_at DESC').all(req.params.id);
    const reviews = db.prepare('SELECT * FROM reviews WHERE competitor_id = ? AND is_noise = 0 ORDER BY created_at DESC LIMIT 50').all(req.params.id);
    
    res.json({ ...competitor, details, prices, reviews });
  });

  app.post('/api/competitors', (req, res) => {
    const { name, category, official_website, app_store_url, status, created_by } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO competitors (name, category, official_website, app_store_url, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, category, official_website || '', app_store_url || '', status || 'active', created_by);
    
    logOperation(req, created_by, 'create', 'competitor', result.lastInsertRowid, { name, category });
    res.json({ id: result.lastInsertRowid, name, category });
  });

  app.put('/api/competitors/:id', (req, res) => {
    const { name, category, official_website, app_store_url, status } = req.body;
    const updated_by = req.headers['x-user-id'] || 'system';
    
    const stmt = db.prepare(`
      UPDATE competitors 
      SET name = ?, category = ?, official_website = ?, app_store_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(name, category, official_website || '', app_store_url || '', status, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    logOperation(updated_by, 'update', 'competitor', parseInt(req.params.id), { name, category, status });
    res.json({ success: true });
  });

  app.delete('/api/competitors/:id', (req, res) => {
    const deleted_by = req.headers['x-user-id'] || 'system';
    const competitor = db.prepare('SELECT * FROM competitors WHERE id = ?').get(req.params.id);
    
    const stmt = db.prepare('DELETE FROM competitors WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    
    logOperation(req, deleted_by, 'delete', 'competitor', parseInt(req.params.id), { name: competitor?.name });
    res.json({ success: true });
  });

  app.get('/api/crawl-tasks', (req, res) => {
    const { status, competitor_id } = req.query;
    let query = 'SELECT * FROM crawl_tasks WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (competitor_id) {
      query += ' AND competitor_id = ?';
      params.push(competitor_id);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  });

  app.get('/api/crawl-tasks/:id', (req, res) => {
    const task = db.prepare('SELECT * FROM crawl_tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const workflow = db.prepare('SELECT * FROM task_workflow WHERE task_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ ...task, workflow });
  });

  app.post('/api/crawl-tasks', (req, res) => {
    const { competitor_id, task_type, target_url, created_by } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO crawl_tasks (competitor_id, task_type, target_url, status, created_by)
      VALUES (?, ?, ?, 'pending', ?)
    `);
    const result = stmt.run(competitor_id || null, task_type, target_url, created_by);
    
    const workflowStmt = db.prepare(`
      INSERT INTO task_workflow (task_id, action, operator, previous_status, new_status)
      VALUES (?, 'create', ?, NULL, 'pending')
    `);
    workflowStmt.run(result.lastInsertRowid, created_by);
    
    logOperation(req, created_by, 'create', 'crawl_task', result.lastInsertRowid, { task_type, target_url });
    res.json({ id: result.lastInsertRowid, status: 'pending' });
  });

  app.post('/api/crawl-tasks/:id/workflow', (req, res) => {
    const { action, operator, reason, result } = req.body;
    const taskId = req.params.id;
    
    const task = db.prepare('SELECT * FROM crawl_tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const statusMap = {
      create: 'pending',
      submit: 'queued',
      execute: 'running',
      review: 'reviewing',
      reject: 'rejected',
      close: result || 'closed'
    };
    
    const newStatus = statusMap[action] || task.status;
    
    db.prepare('UPDATE crawl_tasks SET status = ? WHERE id = ?').run(newStatus, taskId);
    
    const workflowStmt = db.prepare(`
      INSERT INTO task_workflow (task_id, action, operator, reason, previous_status, new_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    workflowStmt.run(taskId, action, operator, reason || '', task.status, newStatus);
    
    logOperation(req, operator, action, 'crawl_task', parseInt(taskId), { reason, result, from: task.status, to: newStatus });
    res.json({ success: true, status: newStatus });
  });

  app.post('/api/crawl-tasks/:id/execute', async (req, res) => {
    const taskId = req.params.id;
    const task = db.prepare('SELECT * FROM crawl_tasks WHERE id = ?').get(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true, message: '任务已开始执行', task_id: taskId });
    
    setImmediate(async () => {
      await executeTask(taskId);
    });
  });

  app.post('/api/reports/generate-comparison', async (req, res) => {
    const { competitor_ids, generated_by } = req.body;
    
    if (!competitor_ids || !Array.isArray(competitor_ids) || competitor_ids.length === 0) {
      return res.status(400).json({ error: '请选择至少一个竞品进行对比' });
    }
    
    const result = await generateComparisonReport(competitor_ids, generated_by || 'system');
    
    if (result.success) {
      logOperation(req, generated_by || 'system', 'generate', 'report', result.reportId, { competitor_ids });
      res.json({ success: true, report_id: result.reportId });
    } else {
      res.status(500).json({ error: result.error });
    }
  });

  app.get('/api/price-history', (req, res) => {
    const { competitor_id } = req.query;
    let query = 'SELECT * FROM price_history';
    const params = [];
    
    if (competitor_id) {
      query += ' WHERE competitor_id = ?';
      params.push(competitor_id);
    }
    query += ' ORDER BY recorded_at DESC LIMIT 200';
    
    const prices = db.prepare(query).all(...params);
    res.json(prices);
  });

  app.post('/api/price-history', (req, res) => {
    const { competitor_id, plan_name, price, currency, price_unit, source_url } = req.body;
    
    const lastPrice = db.prepare(`
      SELECT price FROM price_history 
      WHERE competitor_id = ? AND plan_name = ? 
      ORDER BY recorded_at DESC LIMIT 1
    `).get(competitor_id, plan_name);
    
    let changeType = 'new';
    let previousPrice = null;
    if (lastPrice) {
      previousPrice = lastPrice.price;
      if (price < lastPrice.price) changeType = 'decrease';
      else if (price > lastPrice.price) changeType = 'increase';
      else changeType = 'stable';
    }
    
    const stmt = db.prepare(`
      INSERT INTO price_history (competitor_id, plan_name, price, currency, price_unit, change_type, previous_price, source_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(competitor_id, plan_name, price, currency, price_unit, changeType, previousPrice, source_url || '');
    
    logOperation(req, 'system', 'create', 'price_history', result.lastInsertRowid, { plan_name, price, changeType });
    res.json({ id: result.lastInsertRowid, change_type: changeType });
  });

  app.get('/api/config-rules', (req, res) => {
    const { rule_type } = req.query;
    let query = 'SELECT * FROM config_rules';
    const params = [];
    
    if (rule_type) {
      query += ' WHERE rule_type = ?';
      params.push(rule_type);
    }
    query += ' ORDER BY created_at DESC';
    
    const rules = db.prepare(query).all(...params);
    res.json(rules);
  });

  app.post('/api/config-rules', (req, res) => {
    const { rule_type, rule_name, rule_value, owner, permission, valid_from, valid_to, is_enabled } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO config_rules (rule_type, rule_name, rule_value, owner, permission, valid_from, valid_to, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(rule_type, rule_name, rule_value || '', owner, permission, valid_from || null, valid_to || null, is_enabled ?? 1);
    
    logOperation(req, owner, 'create', 'config_rule', result.lastInsertRowid, { rule_type, rule_name });
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/config-rules/:id', (req, res) => {
    const { rule_type, rule_name, rule_value, owner, permission, valid_from, valid_to, is_enabled } = req.body;
    
    const stmt = db.prepare(`
      UPDATE config_rules 
      SET rule_type = ?, rule_name = ?, rule_value = ?, owner = ?, permission = ?, 
          valid_from = ?, valid_to = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(rule_type, rule_name, rule_value || '', owner, permission, valid_from || null, valid_to || null, is_enabled ?? 1, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    logOperation(req, owner, 'update', 'config_rule', parseInt(req.params.id), { rule_type, rule_name, is_enabled });
    res.json({ success: true });
  });

  app.get('/api/reviews', (req, res) => {
    const { competitor_id, is_noise } = req.query;
    let query = 'SELECT * FROM reviews WHERE 1=1';
    const params = [];
    
    if (competitor_id) {
      query += ' AND competitor_id = ?';
      params.push(competitor_id);
    }
    if (is_noise !== undefined) {
      query += ' AND is_noise = ?';
      params.push(is_noise);
    }
    query += ' ORDER BY created_at DESC LIMIT 200';
    
    const reviews = db.prepare(query).all(...params);
    res.json(reviews);
  });

  app.post('/api/reviews/:id/mark-noise', (req, res) => {
    const { is_noise, operator } = req.body;
    
    const stmt = db.prepare('UPDATE reviews SET is_noise = ? WHERE id = ?');
    const result = stmt.run(is_noise ? 1 : 0, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    logOperation(req, operator || 'system', is_noise ? 'mark_noise' : 'unmark_noise', 'review', parseInt(req.params.id), {});
    res.json({ success: true });
  });

  app.get('/api/dashboard/stats', (req, res) => {
    const competitorCount = db.prepare('SELECT COUNT(*) as count FROM competitors').get().count;
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM crawl_tasks').get().count;
    const taskByStatus = db.prepare('SELECT status, COUNT(*) as count FROM crawl_tasks GROUP BY status').all();
    const priceChanges = db.prepare(`
      SELECT change_type, COUNT(*) as count 
      FROM price_history 
      WHERE recorded_at >= datetime('now', '-30 days')
      GROUP BY change_type
    `).all();
    
    const recentActivities = db.prepare(`
      SELECT * FROM operation_logs 
      ORDER BY created_at DESC LIMIT 20
    `).all();
    
    res.json({
      competitorCount,
      taskCount,
      taskByStatus,
      priceChanges,
      recentActivities
    });
  });

  app.get('/api/operation-logs', (req, res) => {
    const { target_type, user_id } = req.query;
    let query = 'SELECT * FROM operation_logs WHERE 1=1';
    const params = [];
    
    if (target_type) {
      query += ' AND target_type = ?';
      params.push(target_type);
    }
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  });

  app.get('/api/reports', (req, res) => {
    const reports = db.prepare('SELECT * FROM analysis_reports ORDER BY created_at DESC LIMIT 50').all();
    res.json(reports);
  });

  app.post('/api/reports', (req, res) => {
    const { title, report_type, content, recommendations, generated_by } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO analysis_reports (title, report_type, content, recommendations, generated_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, report_type || 'general', content || '', recommendations || '', generated_by || 'system');
    
    logOperation(req, generated_by || 'system', 'create', 'report', result.lastInsertRowid, { title, report_type });
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/feature-comparisons', (req, res) => {
    const features = db.prepare('SELECT * FROM feature_comparisons ORDER BY created_at DESC').all();
    res.json(features);
  });

  app.post('/api/feature-comparisons', (req, res) => {
    const { feature_name, category } = req.body;
    const stmt = db.prepare('INSERT INTO feature_comparisons (feature_name, category) VALUES (?, ?)');
    const result = stmt.run(feature_name, category || '');
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/competitor-features/:competitorId', (req, res) => {
    const features = db.prepare(`
      SELECT fc.*, cf.has_feature, cf.notes
      FROM feature_comparisons fc
      LEFT JOIN competitor_features cf ON fc.id = cf.feature_id AND cf.competitor_id = ?
      ORDER BY fc.created_at DESC
    `).all(req.params.competitorId);
    res.json(features);
  });

  app.post('/api/competitor-features', (req, res) => {
    const { competitor_id, feature_id, has_feature, notes } = req.body;
    
    const existing = db.prepare(`
      SELECT id FROM competitor_features WHERE competitor_id = ? AND feature_id = ?
    `).get(competitor_id, feature_id);
    
    if (existing) {
      db.prepare(`
        UPDATE competitor_features SET has_feature = ?, notes = ? WHERE id = ?
      `).run(has_feature ? 1 : 0, notes || '', existing.id);
      res.json({ id: existing.id });
    } else {
      const stmt = db.prepare(`
        INSERT INTO competitor_features (competitor_id, feature_id, has_feature, notes)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(competitor_id, feature_id, has_feature ? 1 : 0, notes || '');
      res.json({ id: result.lastInsertRowid });
    }
  });
};
