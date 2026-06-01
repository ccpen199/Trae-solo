import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '53404', 10);
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '43404', 10);
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

const dataDir = path.join(projectRoot, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS config_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('switch','text','navigation','api_url','experiment','rate_limit')),
  value_type TEXT NOT NULL DEFAULT 'string',
  default_value TEXT,
  description TEXT,
  page_scope TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_item_id INTEGER NOT NULL,
  environment TEXT DEFAULT 'production',
  user_group TEXT,
  version_range TEXT,
  channel TEXT,
  tenant TEXT,
  time_window_start TEXT,
  time_window_end TEXT,
  value TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (config_item_id) REFERENCES config_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS change_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','preview','approved','canary','full','paused','rolled_back')),
  diff_snapshot TEXT,
  created_by TEXT DEFAULT 'system',
  approved_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS change_set_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  change_set_id INTEGER NOT NULL,
  config_item_id INTEGER NOT NULL,
  old_value TEXT,
  new_value TEXT,
  FOREIGN KEY (change_set_id) REFERENCES change_sets(id) ON DELETE CASCADE,
  FOREIGN KEY (config_item_id) REFERENCES config_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_pulls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT,
  environment TEXT,
  user_group TEXT,
  version TEXT,
  channel TEXT,
  tenant TEXT,
  config_key TEXT,
  matched_value TEXT,
  cache_version TEXT,
  request_time TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'success',
  fail_reason TEXT
);

CREATE TABLE IF NOT EXISTS effect_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_item_id INTEGER NOT NULL,
  page_scope TEXT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  period TEXT NOT NULL,
  baseline INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (config_item_id) REFERENCES config_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  change_set_id INTEGER NOT NULL,
  approver TEXT NOT NULL,
  comment TEXT,
  action TEXT NOT NULL DEFAULT 'approve',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (change_set_id) REFERENCES change_sets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL DEFAULT 'info',
  category TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

const app = express();
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '5mb' }));

function log(level, category, message) {
  db.prepare('INSERT INTO system_logs (level, category, message) VALUES (?, ?, ?)').run(level, category, message);
}

function matchRule(rule, ctx) {
  if (!rule.enabled) return false;
  if (rule.environment && ctx.environment && rule.environment !== ctx.environment) return false;
  if (rule.user_group && ctx.user_group && rule.user_group !== ctx.user_group) return false;
  if (rule.channel && ctx.channel && rule.channel !== ctx.channel) return false;
  if (rule.tenant && ctx.tenant && rule.tenant !== ctx.tenant) return false;
  if (rule.version_range && ctx.version) {
    try {
      const ranges = rule.version_range.split(',').map(s => s.trim());
      const v = ctx.version;
      const matched = ranges.some(r => {
        if (r.includes('-')) {
          const [lo, hi] = r.split('-').map(s => s.trim());
          return v >= lo && v <= hi;
        }
        return r === v;
      });
      if (!matched) return false;
    } catch { return false; }
  }
  if (rule.time_window_start && rule.time_window_end) {
    const now = new Date();
    const start = new Date(rule.time_window_start);
    const end = new Date(rule.time_window_end);
    if (now < start || now > end) return false;
  }
  return true;
}

app.get('/api/health', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM config_items').get();
  res.json({ status: 'ok', config_items: count, ts: new Date().toISOString() });
});

app.get('/api/config-items', (req, res) => {
  const rows = db.prepare('SELECT * FROM config_items ORDER BY id DESC').all();
  res.json(rows);
});

app.get('/api/config-items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM config_items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

app.post('/api/config-items', (req, res) => {
  const { key, name, type, value_type, default_value, description, page_scope } = req.body;
  if (!key || !name || !type) return res.status(400).json({ error: 'key/name/type required' });
  try {
    const info = db.prepare(`
      INSERT INTO config_items (key, name, type, value_type, default_value, description, page_scope)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(key, name, type, value_type || 'string', default_value || '', description || '', page_scope || '');
    log('info', 'config_item', `Created config ${key}`);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/config-items/:id', (req, res) => {
  const { key, name, type, value_type, default_value, description, page_scope } = req.body;
  if (!key || !name || !type) return res.status(400).json({ error: 'key/name/type required' });
  try {
    const info = db.prepare(`
      UPDATE config_items SET key=?, name=?, type=?, value_type=?, default_value=?, description=?, page_scope=?, updated_at=datetime('now')
      WHERE id=?
    `).run(key, name, type, value_type || 'string', default_value || '', description || '', page_scope || '', req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
    log('info', 'config_item', `Updated config ${key}`);
    res.json({ ok: true, id: req.params.id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/config-items/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM config_items WHERE id=?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
    log('info', 'config_item', `Deleted config id=${req.params.id}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/delivery-rules', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, c.key as config_key, c.name as config_name
    FROM delivery_rules r JOIN config_items c ON r.config_item_id = c.id
    ORDER BY r.priority DESC, r.id DESC
  `).all();
  res.json(rows);
});

app.post('/api/delivery-rules', (req, res) => {
  const { config_item_id, environment, user_group, version_range, channel, tenant, time_window_start, time_window_end, value, priority, enabled } = req.body;
  if (!config_item_id) return res.status(400).json({ error: '请选择配置项' });
  const cfgId = parseInt(config_item_id, 10);
  if (isNaN(cfgId)) return res.status(400).json({ error: '配置项ID格式错误' });
  const cfg = db.prepare('SELECT id, key FROM config_items WHERE id = ?').get(cfgId);
  if (!cfg) return res.status(400).json({ error: '配置项不存在' });
  if (value === undefined || value === null || value === '') return res.status(400).json({ error: '请填写下发值' });
  try {
    const info = db.prepare(`
      INSERT INTO delivery_rules (config_item_id, environment, user_group, version_range, channel, tenant, time_window_start, time_window_end, value, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cfgId, environment || 'production', user_group || '', version_range || '', channel || '', tenant || '',
          time_window_start || null, time_window_end || null, String(value), priority ? parseInt(priority, 10) : 0, enabled ?? 1);
    log('info', 'delivery_rule', `Created rule for ${cfg.key}: value=${value} env=${environment || 'production'}`);
    res.json({ id: info.lastInsertRowid, config_key: cfg.key });
  } catch (e) {
    log('error', 'delivery_rule', `Create failed: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/delivery-rules/:id', (req, res) => {
  const f = req.body;
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) return res.status(400).json({ error: '规则ID格式错误' });
  if (!f.config_item_id) return res.status(400).json({ error: '请选择配置项' });
  const cfgId = parseInt(f.config_item_id, 10);
  if (isNaN(cfgId)) return res.status(400).json({ error: '配置项ID格式错误' });
  const cfg = db.prepare('SELECT id, key FROM config_items WHERE id = ?').get(cfgId);
  if (!cfg) return res.status(400).json({ error: '配置项不存在' });
  if (f.value === undefined || f.value === null || f.value === '') return res.status(400).json({ error: '请填写下发值' });
  try {
    const info = db.prepare(`
      UPDATE delivery_rules SET
        config_item_id=?, environment=?, user_group=?, version_range=?, channel=?, tenant=?,
        time_window_start=?, time_window_end=?, value=?, priority=?, enabled=?, updated_at=datetime('now')
      WHERE id=?
    `).run(cfgId, f.environment || 'production', f.user_group || '', f.version_range || '',
          f.channel || '', f.tenant || '', f.time_window_start || null, f.time_window_end || null,
          String(f.value), f.priority ? parseInt(f.priority, 10) : 0, f.enabled ?? 1, ruleId);
    if (info.changes === 0) return res.status(404).json({ error: '规则不存在' });
    log('info', 'delivery_rule', `Updated rule #${ruleId} for ${cfg.key}: value=${f.value}`);
    res.json({ ok: true, id: ruleId });
  } catch (e) {
    log('error', 'delivery_rule', `Update #${ruleId} failed: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/delivery-rules/:id', (req, res) => {
  const ruleId = parseInt(req.params.id, 10);
  if (isNaN(ruleId)) return res.status(400).json({ error: '规则ID格式错误' });
  try {
    const rule = db.prepare('SELECT id, config_item_id FROM delivery_rules WHERE id=?').get(ruleId);
    if (!rule) return res.status(404).json({ error: '规则不存在' });
    const cfg = db.prepare('SELECT key FROM config_items WHERE id=?').get(rule.config_item_id);
    db.prepare('DELETE FROM delivery_rules WHERE id=?').run(ruleId);
    log('info', 'delivery_rule', `Deleted rule #${ruleId} for ${cfg?.key || 'unknown'}`);
    res.json({ ok: true });
  } catch (e) {
    log('error', 'delivery_rule', `Delete #${ruleId} failed: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/delivery-preview', (req, res) => {
  const ctx = req.body;
  const rules = db.prepare(`
    SELECT r.*, c.key as config_key, c.default_value
    FROM delivery_rules r JOIN config_items c ON r.config_item_id = c.id
    WHERE r.enabled = 1
    ORDER BY r.priority DESC
  `).all();
  const results = [];
  const configs = db.prepare('SELECT * FROM config_items').all();
  for (const cfg of configs) {
    const matched = rules.find(r => r.config_item_id === cfg.id && matchRule(r, ctx));
    results.push({
      config_key: cfg.key,
      config_name: cfg.name,
      type: cfg.type,
      default_value: cfg.default_value,
      matched_value: matched ? matched.value : cfg.default_value,
      matched_rule_id: matched ? matched.id : null,
      hit: !!matched
    });
  }
  res.json({ context: ctx, results });
});

app.post('/api/client-pull', (req, res) => {
  const ctx = req.body;
  const clientId = ctx.client_id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const rules = db.prepare(`
    SELECT r.*, c.key as config_key
    FROM delivery_rules r JOIN config_items c ON r.config_item_id = c.id
    WHERE r.enabled = 1
    ORDER BY r.priority DESC
  `).all();
  const configs = db.prepare('SELECT * FROM config_items').all();
  const pulled = {};
  for (const cfg of configs) {
    const matched = rules.find(r => r.config_item_id === cfg.id && matchRule(r, ctx));
    const val = matched ? matched.value : cfg.default_value;
    pulled[cfg.key] = {
      value: val,
      type: cfg.type,
      page_scope: cfg.page_scope,
      cache_version: ctx.cache_version || 'v1',
      hit: !!matched
    };
    db.prepare(`
      INSERT INTO client_pulls (client_id, environment, user_group, version, channel, tenant, config_key, matched_value, cache_version, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(clientId, ctx.environment || '', ctx.user_group || '', ctx.version || '', ctx.channel || '',
          ctx.tenant || '', cfg.key, val || '', ctx.cache_version || 'v1', 'success');
  }
  res.json({ client_id: clientId, configs: pulled });
});

app.get('/api/client-pulls', (req, res) => {
  const limit = parseInt(req.query.limit || '200', 10);
  const rows = db.prepare('SELECT * FROM client_pulls ORDER BY id DESC LIMIT ?').all(limit);
  res.json(rows);
});

app.get('/api/change-sets', (req, res) => {
  const rows = db.prepare('SELECT * FROM change_sets ORDER BY id DESC').all();
  res.json(rows);
});

app.get('/api/change-sets/:id', (req, res) => {
  const cs = db.prepare('SELECT * FROM change_sets WHERE id=?').get(req.params.id);
  if (!cs) return res.status(404).json({ error: 'not found' });
  const items = db.prepare(`
    SELECT i.*, c.key as config_key, c.name as config_name
    FROM change_set_items i JOIN config_items c ON i.config_item_id = c.id
    WHERE i.change_set_id = ?
  `).all(req.params.id);
  cs.items = items;
  res.json(cs);
});

app.post('/api/change-sets', (req, res) => {
  const { title, items } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const tx = db.transaction(() => {
    const info = db.prepare('INSERT INTO change_sets (title, status) VALUES (?, ?)').run(title, 'draft');
    const csId = info.lastInsertRowid;
    if (items && Array.isArray(items)) {
      const insert = db.prepare('INSERT INTO change_set_items (change_set_id, config_item_id, old_value, new_value) VALUES (?, ?, ?, ?)');
      for (const it of items) insert.run(csId, it.config_item_id, it.old_value || '', it.new_value || '');
    }
    return csId;
  });
  const id = tx();
  res.json({ id });
});

app.post('/api/change-sets/:id/transition', (req, res) => {
  const { status, approver, comment } = req.body;
  const valid = ['draft','preview','approved','canary','full','paused','rolled_back'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'invalid status' });
  const cs = db.prepare('SELECT * FROM change_sets WHERE id=?').get(req.params.id);
  if (!cs) return res.status(404).json({ error: 'not found' });

  const tx = db.transaction(() => {
    db.prepare(`UPDATE change_sets SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, req.params.id);
    if (status === 'approved' || status === 'canary' || status === 'full') {
      if (approver) db.prepare('INSERT INTO approvals (change_set_id, approver, comment, action) VALUES (?, ?, ?, ?)').run(req.params.id, approver, comment || '', 'approve');
      const items = db.prepare('SELECT * FROM change_set_items WHERE change_set_id=?').all(req.params.id);
      for (const it of items) {
        db.prepare('UPDATE config_items SET default_value=?, updated_at=datetime("now") WHERE id=?').run(it.new_value, it.config_item_id);
      }
    }
    if (status === 'rolled_back') {
      const items = db.prepare('SELECT * FROM change_set_items WHERE change_set_id=?').all(req.params.id);
      for (const it of items) {
        db.prepare('UPDATE config_items SET default_value=?, updated_at=datetime("now") WHERE id=?').run(it.old_value, it.config_item_id);
      }
    }
  });
  tx();
  log('info', 'change_set', `Change set ${req.params.id} -> ${status}`);
  res.json({ ok: true });
});

app.get('/api/effect-metrics', (req, res) => {
  const { config_item_id, page_scope, period } = req.query;
  let sql = 'SELECT * FROM effect_metrics WHERE 1=1';
  const params = [];
  if (config_item_id) { sql += ' AND config_item_id=?'; params.push(config_item_id); }
  if (page_scope) { sql += ' AND page_scope=?'; params.push(page_scope); }
  if (period) { sql += ' AND period=?'; params.push(period); }
  sql += ' ORDER BY recorded_at DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/effect-metrics', (req, res) => {
  const { config_item_id, page_scope, metric_name, metric_value, period, baseline } = req.body;
  const info = db.prepare(`
    INSERT INTO effect_metrics (config_item_id, page_scope, metric_name, metric_value, period, baseline)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(config_item_id, page_scope || '', metric_name, metric_value, period || 'daily', baseline || 0);
  res.json({ id: info.lastInsertRowid });
});

app.get('/api/effect-summary', (req, res) => {
  const rows = db.prepare(`
    SELECT em.config_item_id, c.key as config_key, c.name as config_name, c.page_scope,
           em.metric_name,
           AVG(CASE WHEN em.baseline=1 THEN em.metric_value END) as baseline_avg,
           AVG(CASE WHEN em.baseline=0 THEN em.metric_value END) as current_avg
    FROM effect_metrics em JOIN config_items c ON em.config_item_id = c.id
    GROUP BY em.config_item_id, em.metric_name
  `).all();
  res.json(rows);
});

app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  res.json(db.prepare('SELECT * FROM system_logs ORDER BY id DESC LIMIT ?').all(limit));
});

app.post('/api/seed', (req, res) => {
  const items = [
    { key: 'home_banner_switch', name: '首页Banner开关', type: 'switch', value_type: 'boolean', default_value: 'true', page_scope: 'home' },
    { key: 'nav_title', name: '导航标题', type: 'text', value_type: 'string', default_value: '配置平台', page_scope: 'global' },
    { key: 'api_base_url', name: 'API基础地址', type: 'api_url', value_type: 'string', default_value: 'https://api.example.com', page_scope: 'global' },
    { key: 'ab_test_color', name: 'AB测试按钮颜色', type: 'experiment', value_type: 'string', default_value: 'blue', page_scope: 'detail' },
    { key: 'rate_limit_qps', name: '限流QPS阈值', type: 'rate_limit', value_type: 'number', default_value: '100', page_scope: 'api' },
    { key: 'checkout_nav', name: '结算页导航', type: 'navigation', value_type: 'string', default_value: '/checkout', page_scope: 'checkout' }
  ];
  const insertItem = db.prepare('INSERT OR IGNORE INTO config_items (key, name, type, value_type, default_value, description, page_scope) VALUES (?, ?, ?, ?, ?, ?, ?)');
  let count = 0;
  for (const it of items) {
    const info = insertItem.run(it.key, it.name, it.type, it.value_type, it.default_value, `${it.name}示例`, it.page_scope);
    if (info.changes > 0) count++;
  }
  res.json({ ok: true, inserted: count });
});

app.listen(BACKEND_PORT, BACKEND_HOST, () => {
  console.log(`Backend running on http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
