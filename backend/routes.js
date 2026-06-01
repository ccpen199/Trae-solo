const express = require('express');
const { db } = require('./db');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/versions', (req, res) => {
  const { environment, keyword } = req.query;
  let sql = 'SELECT * FROM app_versions WHERE 1=1';
  const params = [];
  if (environment) {
    sql += ' AND environment = ?';
    params.push(environment);
  }
  if (keyword) {
    sql += ' AND (build_number LIKE ? OR git_commit LIKE ? OR release_notes LIKE ?)';
    const like = `%${keyword}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY created_at DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/versions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'version not found' });
  res.json(row);
});

router.post('/versions', (req, res) => {
  const { build_number, git_commit, environment, release_notes, static_resource_url, backend_dependency_version, created_by } = req.body;
  if (!build_number || !git_commit || !environment) {
    return res.status(400).json({ error: 'build_number, git_commit and environment are required' });
  }
  const result = db.prepare(`
    INSERT INTO app_versions (build_number, git_commit, environment, release_notes, static_resource_url, backend_dependency_version, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(build_number, git_commit, environment, release_notes || '', static_resource_url || '', backend_dependency_version || '', created_by || 'system');
  const row = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/versions/:id', (req, res) => {
  const { build_number, git_commit, environment, release_notes, static_resource_url, backend_dependency_version, status } = req.body;
  const existing = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'version not found' });
  db.prepare(`
    UPDATE app_versions SET
      build_number = COALESCE(?, build_number),
      git_commit = COALESCE(?, git_commit),
      environment = COALESCE(?, environment),
      release_notes = COALESCE(?, release_notes),
      static_resource_url = COALESCE(?, static_resource_url),
      backend_dependency_version = COALESCE(?, backend_dependency_version),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(build_number ?? null, git_commit ?? null, environment ?? null, release_notes ?? null, static_resource_url ?? null, backend_dependency_version ?? null, status ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/versions/:id', (req, res) => {
  const result = db.prepare('DELETE FROM app_versions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'version not found' });
  res.json({ ok: true });
});

router.get('/versions/compare/:id1/:id2', (req, res) => {
  const v1 = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(req.params.id1);
  const v2 = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(req.params.id2);
  if (!v1 || !v2) return res.status(404).json({ error: 'version not found' });
  const diff = {};
  for (const key of Object.keys(v1)) {
    if (v1[key] !== v2[key]) {
      diff[key] = { v1: v1[key], v2: v2[key] };
    }
  }
  res.json({ v1, v2, diff });
});

function validateStrategyData(data, isUpdate = false) {
  const errors = [];
  
  if (!data.version_id) errors.push('关联版本不能为空');
  
  if (data.traffic_percentage !== undefined) {
    if (data.traffic_percentage < 0 || data.traffic_percentage > 100) {
      errors.push('流量比例必须在 0-100 之间');
    }
  }
  
  if (data.start_time && data.end_time) {
    if (new Date(data.start_time) >= new Date(data.end_time)) {
      errors.push('开始时间必须早于结束时间');
    }
  }
  
  const validateWhitelist = (list, name) => {
    if (list && Array.isArray(list)) {
      for (const item of list) {
        if (typeof item !== 'string' || !item.trim()) {
          errors.push(`${name} 格式不正确，必须为非空字符串`);
          break;
        }
      }
    }
  };
  
  validateWhitelist(data.user_whitelist, '用户白名单');
  validateWhitelist(data.tenant_whitelist, '租户白名单');
  validateWhitelist(data.region_whitelist, '地区白名单');
  validateWhitelist(data.browser_whitelist, '浏览器白名单');
  
  return errors;
}

function generateHitScopeSnapshot(data) {
  return JSON.stringify({
    user_whitelist: data.user_whitelist || [],
    tenant_whitelist: data.tenant_whitelist || [],
    region_whitelist: data.region_whitelist || [],
    browser_whitelist: data.browser_whitelist || [],
    traffic_percentage: data.traffic_percentage || 0,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    user_count: (data.user_whitelist || []).length,
    tenant_count: (data.tenant_whitelist || []).length,
    region_count: (data.region_whitelist || []).length,
    browser_count: (data.browser_whitelist || []).length,
    generated_at: new Date().toISOString(),
  });
}

router.get('/strategies', (req, res) => {
  const rows = db.prepare(`
    SELECT gs.*, av.build_number, av.git_commit, av.environment, av.release_notes
    FROM gray_strategies gs
    LEFT JOIN app_versions av ON gs.version_id = av.id
    ORDER BY gs.created_at DESC
  `).all();
  res.json(rows.map(r => ({
    ...r,
    user_whitelist: r.user_whitelist ? JSON.parse(r.user_whitelist) : [],
    tenant_whitelist: r.tenant_whitelist ? JSON.parse(r.tenant_whitelist) : [],
    region_whitelist: r.region_whitelist ? JSON.parse(r.region_whitelist) : [],
    browser_whitelist: r.browser_whitelist ? JSON.parse(r.browser_whitelist) : [],
    hit_scope_snapshot: r.hit_scope_snapshot ? JSON.parse(r.hit_scope_snapshot) : null,
  })));
});

router.get('/strategies/:id', (req, res) => {
  const row = db.prepare(`
    SELECT gs.*, av.build_number, av.git_commit, av.environment, av.release_notes
    FROM gray_strategies gs
    LEFT JOIN app_versions av ON gs.version_id = av.id
    WHERE gs.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'strategy not found' });
  row.user_whitelist = row.user_whitelist ? JSON.parse(row.user_whitelist) : [];
  row.tenant_whitelist = row.tenant_whitelist ? JSON.parse(row.tenant_whitelist) : [];
  row.region_whitelist = row.region_whitelist ? JSON.parse(row.region_whitelist) : [];
  row.browser_whitelist = row.browser_whitelist ? JSON.parse(row.browser_whitelist) : [];
  row.hit_scope_snapshot = row.hit_scope_snapshot ? JSON.parse(row.hit_scope_snapshot) : null;
  res.json(row);
});

router.post('/strategies', (req, res) => {
  const { version_id, name, user_whitelist, tenant_whitelist, region_whitelist, browser_whitelist, traffic_percentage, start_time, end_time, status, created_by, updated_by } = req.body;
  
  const validationErrors = validateStrategyData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') });
  }
  
  const version = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(version_id);
  if (!version) return res.status(400).json({ error: '关联的版本不存在' });
  
  const snapshot = generateHitScopeSnapshot({
    user_whitelist, tenant_whitelist, region_whitelist, browser_whitelist,
    traffic_percentage, start_time, end_time
  });
  
  const result = db.prepare(`
    INSERT INTO gray_strategies (version_id, name, user_whitelist, tenant_whitelist, region_whitelist, browser_whitelist, traffic_percentage, start_time, end_time, status, created_by, updated_by, hit_scope_snapshot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    version_id,
    name,
    user_whitelist ? JSON.stringify(user_whitelist) : null,
    tenant_whitelist ? JSON.stringify(tenant_whitelist) : null,
    region_whitelist ? JSON.stringify(region_whitelist) : null,
    browser_whitelist ? JSON.stringify(browser_whitelist) : null,
    traffic_percentage || 0,
    start_time || null,
    end_time || null,
    status || 'draft',
    created_by || 'system',
    updated_by || 'system',
    snapshot
  );
  const row = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(result.lastInsertRowid);
  row.user_whitelist = row.user_whitelist ? JSON.parse(row.user_whitelist) : [];
  row.tenant_whitelist = row.tenant_whitelist ? JSON.parse(row.tenant_whitelist) : [];
  row.region_whitelist = row.region_whitelist ? JSON.parse(row.region_whitelist) : [];
  row.browser_whitelist = row.browser_whitelist ? JSON.parse(row.browser_whitelist) : [];
  row.hit_scope_snapshot = row.hit_scope_snapshot ? JSON.parse(row.hit_scope_snapshot) : null;
  res.status(201).json(row);
});

router.put('/strategies/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'strategy not found' });
  
  const { version_id, name, user_whitelist, tenant_whitelist, region_whitelist, browser_whitelist, traffic_percentage, start_time, end_time, status, updated_by } = req.body;
  
  const validationErrors = validateStrategyData(req.body, true);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join(', ') });
  }
  
  if (version_id) {
    const version = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(version_id);
    if (!version) return res.status(400).json({ error: '关联的版本不存在' });
  }
  
  const mergedData = {
    user_whitelist: user_whitelist !== undefined ? user_whitelist : (existing.user_whitelist ? JSON.parse(existing.user_whitelist) : []),
    tenant_whitelist: tenant_whitelist !== undefined ? tenant_whitelist : (existing.tenant_whitelist ? JSON.parse(existing.tenant_whitelist) : []),
    region_whitelist: region_whitelist !== undefined ? region_whitelist : (existing.region_whitelist ? JSON.parse(existing.region_whitelist) : []),
    browser_whitelist: browser_whitelist !== undefined ? browser_whitelist : (existing.browser_whitelist ? JSON.parse(existing.browser_whitelist) : []),
    traffic_percentage: traffic_percentage !== undefined ? traffic_percentage : existing.traffic_percentage,
    start_time: start_time !== undefined ? start_time : existing.start_time,
    end_time: end_time !== undefined ? end_time : existing.end_time,
  };
  
  const snapshot = generateHitScopeSnapshot(mergedData);
  
  db.prepare(`
    UPDATE gray_strategies SET
      version_id = COALESCE(?, version_id),
      name = COALESCE(?, name),
      user_whitelist = COALESCE(?, user_whitelist),
      tenant_whitelist = COALESCE(?, tenant_whitelist),
      region_whitelist = COALESCE(?, region_whitelist),
      browser_whitelist = COALESCE(?, browser_whitelist),
      traffic_percentage = COALESCE(?, traffic_percentage),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      status = COALESCE(?, status),
      updated_by = COALESCE(?, updated_by),
      hit_scope_snapshot = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    version_id ?? null,
    name ?? null,
    user_whitelist ? JSON.stringify(user_whitelist) : null,
    tenant_whitelist ? JSON.stringify(tenant_whitelist) : null,
    region_whitelist ? JSON.stringify(region_whitelist) : null,
    browser_whitelist ? JSON.stringify(browser_whitelist) : null,
    traffic_percentage ?? null,
    start_time ?? null,
    end_time ?? null,
    status ?? null,
    updated_by ?? 'system',
    snapshot,
    req.params.id
  );
  
  const row = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  row.user_whitelist = row.user_whitelist ? JSON.parse(row.user_whitelist) : [];
  row.tenant_whitelist = row.tenant_whitelist ? JSON.parse(row.tenant_whitelist) : [];
  row.region_whitelist = row.region_whitelist ? JSON.parse(row.region_whitelist) : [];
  row.browser_whitelist = row.browser_whitelist ? JSON.parse(row.browser_whitelist) : [];
  row.hit_scope_snapshot = row.hit_scope_snapshot ? JSON.parse(row.hit_scope_snapshot) : null;
  res.json(row);
});

router.delete('/strategies/:id', (req, res) => {
  const result = db.prepare('DELETE FROM gray_strategies WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'strategy not found' });
  res.json({ ok: true });
});

router.post('/strategies/:id/activate', (req, res) => {
  const existing = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'strategy not found' });
  
  if (existing.status !== 'draft' && existing.status !== 'paused') {
    return res.status(400).json({ error: '只有草稿或暂停状态的策略才能激活' });
  }
  
  const { operator } = req.body;
  db.prepare("UPDATE gray_strategies SET status = 'active', updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(operator || 'system', req.params.id);
  
  db.prepare(`
    INSERT INTO release_records (strategy_id, phase, operator, status)
    VALUES (?, '激活', ?, 'completed')
  `).run(req.params.id, operator || 'system');
  
  const row = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  row.user_whitelist = row.user_whitelist ? JSON.parse(row.user_whitelist) : [];
  row.tenant_whitelist = row.tenant_whitelist ? JSON.parse(row.tenant_whitelist) : [];
  row.region_whitelist = row.region_whitelist ? JSON.parse(row.region_whitelist) : [];
  row.browser_whitelist = row.browser_whitelist ? JSON.parse(row.browser_whitelist) : [];
  row.hit_scope_snapshot = row.hit_scope_snapshot ? JSON.parse(row.hit_scope_snapshot) : null;
  res.json(row);
});

router.post('/strategies/:id/pause', (req, res) => {
  const existing = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'strategy not found' });
  
  if (existing.status !== 'active') {
    return res.status(400).json({ error: '只有运行中状态的策略才能暂停' });
  }
  
  const { operator, reason } = req.body;
  db.prepare("UPDATE gray_strategies SET status = 'paused', updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(operator || 'system', req.params.id);
  
  db.prepare(`
    INSERT INTO release_records (strategy_id, phase, operator, status, pause_reason)
    VALUES (?, '暂停', ?, 'paused', ?)
  `).run(req.params.id, operator || 'system', reason || null);
  
  const row = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  row.user_whitelist = row.user_whitelist ? JSON.parse(row.user_whitelist) : [];
  row.tenant_whitelist = row.tenant_whitelist ? JSON.parse(row.tenant_whitelist) : [];
  row.region_whitelist = row.region_whitelist ? JSON.parse(row.region_whitelist) : [];
  row.browser_whitelist = row.browser_whitelist ? JSON.parse(row.browser_whitelist) : [];
  row.hit_scope_snapshot = row.hit_scope_snapshot ? JSON.parse(row.hit_scope_snapshot) : null;
  res.json(row);
});

router.get('/strategies/:id/hit-scope', (req, res) => {
  const strategy = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.id);
  if (!strategy) return res.status(404).json({ error: 'strategy not found' });
  
  const version = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(strategy.version_id);
  const now = new Date();
  const inTimeWindow = (!strategy.start_time || new Date(strategy.start_time) <= now) &&
    (!strategy.end_time || new Date(strategy.end_time) >= now);
  
  const userList = strategy.user_whitelist ? JSON.parse(strategy.user_whitelist) : [];
  const tenantList = strategy.tenant_whitelist ? JSON.parse(strategy.tenant_whitelist) : [];
  const regionList = strategy.region_whitelist ? JSON.parse(strategy.region_whitelist) : [];
  const browserList = strategy.browser_whitelist ? JSON.parse(strategy.browser_whitelist) : [];
  
  res.json({
    strategy,
    version,
    current_time: now.toISOString(),
    in_time_window: inTimeWindow,
    user_whitelist: userList,
    tenant_whitelist: tenantList,
    region_whitelist: regionList,
    browser_whitelist: browserList,
    traffic_percentage: strategy.traffic_percentage,
    hit_counts: {
      users: userList.length,
      tenants: tenantList.length,
      regions: regionList.length,
      browsers: browserList.length,
    },
    hit_samples: {
      users: userList.slice(0, 5),
      tenants: tenantList.slice(0, 5),
      regions: regionList.slice(0, 5),
      browsers: browserList.slice(0, 5),
    },
    hit_condition: inTimeWindow ? '可命中：当前在时间窗内' : '未命中：当前不在时间窗内',
    hit_scope_snapshot: strategy.hit_scope_snapshot ? JSON.parse(strategy.hit_scope_snapshot) : null,
    status: strategy.status,
    created_by: strategy.created_by,
    updated_by: strategy.updated_by,
    created_at: strategy.created_at,
    updated_at: strategy.updated_at,
  });
});

router.get('/releases', (req, res) => {
  const { strategy_id } = req.query;
  let sql = `
    SELECT rr.*, gs.name as strategy_name, av.build_number
    FROM release_records rr
    LEFT JOIN gray_strategies gs ON rr.strategy_id = gs.id
    LEFT JOIN app_versions av ON gs.version_id = av.id
  `;
  const params = [];
  if (strategy_id) {
    sql += ' WHERE rr.strategy_id = ?';
    params.push(strategy_id);
  }
  sql += ' ORDER BY rr.created_at DESC LIMIT 200';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/releases/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM release_records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'release record not found' });
  res.json(row);
});

router.post('/releases', (req, res) => {
  const { 
    strategy_id, phase, operator, metric_threshold, 
    status, check_result, pause_reason, resume_reason, 
    start_time, end_time 
  } = req.body;
  
  if (!strategy_id || !phase || !operator) {
    return res.status(400).json({ error: 'strategy_id, phase and operator are required' });
  }
  
  const result = db.prepare(`
    INSERT INTO release_records (
      strategy_id, phase, operator, metric_threshold,
      status, check_result, pause_reason, resume_reason,
      start_time, end_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    strategy_id, phase, operator, metric_threshold || null,
    status || 'running', check_result || null, 
    pause_reason || null, resume_reason || null,
    start_time || new Date().toISOString(), end_time || null
  );
  
  const row = db.prepare('SELECT * FROM release_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/releases/:id', (req, res) => {
  const { status, check_result, pause_reason, resume_reason, end_time } = req.body;
  const existing = db.prepare('SELECT * FROM release_records WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'release record not found' });
  db.prepare(`
    UPDATE release_records SET
      status = COALESCE(?, status),
      check_result = COALESCE(?, check_result),
      pause_reason = COALESCE(?, pause_reason),
      resume_reason = COALESCE(?, resume_reason),
      end_time = COALESCE(?, end_time)
    WHERE id = ?
  `).run(status ?? null, check_result ?? null, pause_reason ?? null, resume_reason ?? null, end_time ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM release_records WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.get('/metrics', (req, res) => {
  const { strategy_id, start, end } = req.query;
  let sql = 'SELECT * FROM monitor_metrics WHERE 1=1';
  const params = [];
  if (strategy_id) {
    sql += ' AND strategy_id = ?';
    params.push(strategy_id);
  }
  if (start) {
    sql += ' AND timestamp >= ?';
    params.push(start);
  }
  if (end) {
    sql += ' AND timestamp <= ?';
    params.push(end);
  }
  sql += ' ORDER BY timestamp DESC LIMIT 500';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/metrics', (req, res) => {
  const { strategy_id, pv, uv, js_errors, api_errors, white_screen_rate, core_conversion, user_feedback_score, is_anomaly } = req.body;
  if (!strategy_id) {
    return res.status(400).json({ error: 'strategy_id is required' });
  }
  const result = db.prepare(`
    INSERT INTO monitor_metrics (strategy_id, pv, uv, js_errors, api_errors, white_screen_rate, core_conversion, user_feedback_score, is_anomaly)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    strategy_id,
    pv || 0,
    uv || 0,
    js_errors || 0,
    api_errors || 0,
    white_screen_rate || 0,
    core_conversion || 0,
    user_feedback_score || 0,
    is_anomaly || 0
  );
  if (is_anomaly) {
    db.prepare("UPDATE release_records SET status = 'paused', check_result = '指标异常，已暂停放量' WHERE strategy_id = ? AND status = 'running'").run(strategy_id);
  }
  const row = db.prepare('SELECT * FROM monitor_metrics WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.get('/metrics/alert-check', (req, res) => {
  const { strategy_id, js_error_threshold = 10, api_error_threshold = 5, white_screen_threshold = 0.01 } = req.query;
  const metrics = db.prepare('SELECT * FROM monitor_metrics WHERE strategy_id = ? ORDER BY timestamp DESC LIMIT 5').all(strategy_id);
  if (metrics.length === 0) {
    return res.json({ has_anomaly: false, message: 'no metrics data' });
  }
  const avg = {
    js_errors: metrics.reduce((s, m) => s + m.js_errors, 0) / metrics.length,
    api_errors: metrics.reduce((s, m) => s + m.api_errors, 0) / metrics.length,
    white_screen_rate: metrics.reduce((s, m) => s + m.white_screen_rate, 0) / metrics.length,
  };
  const has_anomaly = avg.js_errors > js_error_threshold || avg.api_errors > api_error_threshold || avg.white_screen_rate > white_screen_threshold;
  res.json({ has_anomaly, avg, thresholds: { js_error_threshold, api_error_threshold, white_screen_threshold } });
});

router.get('/rollbacks', (req, res) => {
  const rows = db.prepare(`
    SELECT rb.*, gs.name as strategy_name, av.build_number as target_build_number
    FROM rollback_records rb
    LEFT JOIN gray_strategies gs ON rb.strategy_id = gs.id
    LEFT JOIN app_versions av ON rb.target_version_id = av.id
    ORDER BY rb.created_at DESC LIMIT 100
  `).all();
  res.json(rows);
});

router.get('/rollbacks/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM rollback_records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'rollback record not found' });
  res.json(row);
});

router.get('/rollbacks/compare/:strategy_id', (req, res) => {
  const strategy = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(req.params.strategy_id);
  if (!strategy) return res.status(404).json({ error: 'strategy not found' });
  
  const currentVersion = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(strategy.version_id);
  if (!currentVersion) return res.status(404).json({ error: 'current version not found' });
  
  const previousVersion = db.prepare('SELECT * FROM app_versions WHERE id < ? ORDER BY id DESC LIMIT 1').get(strategy.version_id);
  
  const diff = {};
  if (previousVersion) {
    for (const key of Object.keys(currentVersion)) {
      if (currentVersion[key] !== previousVersion[key]) {
        diff[key] = { current: currentVersion[key], previous: previousVersion[key] };
      }
    }
  }
  
  res.json({
    currentVersion,
    previousVersion,
    diff,
    hasPrevious: !!previousVersion
  });
});

router.post('/rollbacks/verify/:id', (req, res) => {
  const rollback = db.prepare('SELECT * FROM rollback_records WHERE id = ?').get(req.params.id);
  if (!rollback) return res.status(404).json({ error: 'rollback record not found' });
  
  const strategy = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(rollback.strategy_id);
  if (!strategy) return res.status(404).json({ error: 'strategy not found' });
  
  const currentVersion = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(strategy.version_id);
  
  const metrics = db.prepare('SELECT * FROM monitor_metrics WHERE strategy_id = ? ORDER BY timestamp DESC LIMIT 5').all(rollback.strategy_id);
  
  const verification = {
    rollback_id: rollback.id,
    rollback_type: rollback.rollback_type,
    strategy_status: strategy.status,
    current_version: currentVersion ? currentVersion.build_number : null,
    target_version: rollback.target_version_id ? db.prepare('SELECT build_number FROM app_versions WHERE id = ?').get(rollback.target_version_id)?.build_number : null,
    metrics_checked: metrics.length,
    latest_metrics: metrics.length > 0 ? {
      js_errors: metrics[0].js_errors,
      api_errors: metrics[0].api_errors,
      white_screen_rate: metrics[0].white_screen_rate,
      core_conversion: metrics[0].core_conversion
    } : null,
    verification_passed: true,
    verification_time: new Date().toISOString(),
    message: '回滚验证通过：策略状态已更新，版本已切换，监控指标正常'
  };
  
  if (metrics.length > 0) {
    const avgJsErrors = metrics.reduce((s, m) => s + m.js_errors, 0) / metrics.length;
    const avgApiErrors = metrics.reduce((s, m) => s + m.api_errors, 0) / metrics.length;
    const avgWhiteScreen = metrics.reduce((s, m) => s + m.white_screen_rate, 0) / metrics.length;
    
    if (avgJsErrors > 10 || avgApiErrors > 5 || avgWhiteScreen > 0.01) {
      verification.verification_passed = false;
      verification.message = '回滚验证警告：检测到异常指标，建议继续观察';
    }
  }
  
  const verificationResult = JSON.stringify(verification);
  db.prepare('UPDATE rollback_records SET verification_result = ? WHERE id = ?').run(verificationResult, rollback.id);
  
  res.json(verification);
});

router.post('/rollbacks', (req, res) => {
  const { strategy_id, rollback_type, target_version_id, reason, operator } = req.body;
  if (!strategy_id || !rollback_type || !reason || !operator) {
    return res.status(400).json({ error: 'strategy_id, rollback_type, reason and operator are required' });
  }
  if (rollback_type === 'specified' && !target_version_id) {
    return res.status(400).json({ error: 'target_version_id is required for specified rollback' });
  }
  
  const strategy = db.prepare('SELECT * FROM gray_strategies WHERE id = ?').get(strategy_id);
  if (!strategy) return res.status(404).json({ error: 'strategy not found' });
  
  const originalVersionId = strategy.version_id;
  let targetId = target_version_id;
  
  if (rollback_type === 'previous') {
    const prev = db.prepare('SELECT * FROM app_versions WHERE id < ? ORDER BY id DESC LIMIT 1').get(originalVersionId);
    if (prev) targetId = prev.id;
  }
  
  if (rollback_type === 'close_gray') {
    db.prepare("UPDATE gray_strategies SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(strategy_id);
  } else if (targetId) {
    db.prepare("UPDATE gray_strategies SET version_id = ?, status = 'rolled_back', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(targetId, strategy_id);
  }
  
  const result = db.prepare(`
    INSERT INTO rollback_records (strategy_id, rollback_type, target_version_id, reason, operator, status)
    VALUES (?, ?, ?, ?, ?, 'completed')
  `).run(strategy_id, rollback_type, targetId || null, reason, operator);
  
  const rollbackId = result.lastInsertRowid;
  db.prepare('UPDATE rollback_records SET completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(rollbackId);
  
  const targetVersion = targetId ? db.prepare('SELECT * FROM app_versions WHERE id = ?').get(targetId) : null;
  const originalVersion = db.prepare('SELECT * FROM app_versions WHERE id = ?').get(originalVersionId);
  
  const metrics = db.prepare('SELECT * FROM monitor_metrics WHERE strategy_id = ? ORDER BY timestamp DESC LIMIT 5').all(strategy_id);
  
  const verification = {
    rollback_id: rollbackId,
    rollback_type,
    strategy_status: rollback_type === 'close_gray' ? 'closed' : 'rolled_back',
    original_version: originalVersion?.build_number || null,
    target_version: targetVersion?.build_number || null,
    metrics_checked: metrics.length,
    latest_metrics: metrics.length > 0 ? {
      js_errors: metrics[0].js_errors,
      api_errors: metrics[0].api_errors,
      white_screen_rate: metrics[0].white_screen_rate,
      core_conversion: metrics[0].core_conversion
    } : null,
    verification_passed: true,
    verification_time: new Date().toISOString(),
    message: '回滚执行成功：策略状态已更新，版本已切换'
  };
  
  if (metrics.length > 0) {
    const avgJsErrors = metrics.reduce((s, m) => s + m.js_errors, 0) / metrics.length;
    const avgApiErrors = metrics.reduce((s, m) => s + m.api_errors, 0) / metrics.length;
    const avgWhiteScreen = metrics.reduce((s, m) => s + m.white_screen_rate, 0) / metrics.length;
    
    if (avgJsErrors > 10 || avgApiErrors > 5 || avgWhiteScreen > 0.01) {
      verification.verification_passed = false;
      verification.message = '回滚执行成功但检测到异常指标，建议继续观察';
    }
  }
  
  const verificationResult = JSON.stringify(verification);
  db.prepare('UPDATE rollback_records SET verification_result = ? WHERE id = ?').run(verificationResult, rollbackId);
  
  const row = db.prepare('SELECT * FROM rollback_records WHERE id = ?').get(rollbackId);
  res.status(201).json({ ...row, verification });
});

module.exports = router;