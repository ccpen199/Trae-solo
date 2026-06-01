const router = require('express').Router();
const { getDb, logAction } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  const { status, type, level, keyword, page = 1, pageSize = 20 } = req.query;
  let sql = 'SELECT * FROM warnings WHERE 1=1';
  const countSql = 'SELECT COUNT(*) as c FROM warnings WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; countSql += ' AND status = ?'; params.push(status); }
  if (type) { sql += ' AND type = ?'; countSql += ' AND type = ?'; params.push(type); }
  if (level) { sql += ' AND level = ?'; countSql += ' AND level = ?'; params.push(level); }
  if (keyword) { sql += ' AND (content LIKE ? OR affected_area LIKE ?)'; countSql += ' AND (content LIKE ? OR affected_area LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const p = parseInt(page), ps = parseInt(pageSize);
  params.push(ps, (p - 1) * ps);
  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(countSql).get(...params.slice(0, params.length - 2)).c;
  res.json({ rows, total, page: p, pageSize: ps });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM warnings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { type, level, affected_area, suggested_measures, valid_from, valid_to, issuer, content, template_id, operator } = req.body;
  if (!type || !level || !affected_area || !issuer || !content) {
    return res.status(400).json({ error: 'type, level, affected_area, issuer, content are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO warnings (type, level, affected_area, suggested_measures, valid_from, valid_to, issuer, content, template_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(type, level, affected_area, suggested_measures || null,
    valid_from || null, valid_to || null, issuer, content, template_id || null);
  logAction('create_warning', 'warning', info.lastInsertRowid, operator || issuer, { type, level, affected_area });
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM warnings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const fields = [];
  const values = [];
  const allowed = ['type', 'level', 'affected_area', 'suggested_measures', 'valid_from', 'valid_to', 'issuer', 'content', 'status'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }
  if (fields.length === 0) return res.json({ updated: 0 });
  fields.push("updated_at = datetime('now','localtime')");
  values.push(req.params.id);
  db.prepare(`UPDATE warnings SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  logAction('update_warning', 'warning', req.params.id, req.body.operator || existing.issuer, req.body);
  res.json({ updated: 1 });
});

router.post('/:id/publish', (req, res) => {
  const db = getDb();
  const { channel_ids, operator } = req.body;
  const warning = db.prepare('SELECT * FROM warnings WHERE id = ?').get(req.params.id);
  if (!warning) return res.status(404).json({ error: 'Not found' });
  if (!channel_ids || !Array.isArray(channel_ids) || channel_ids.length === 0) {
    return res.status(400).json({ error: 'channel_ids array is required' });
  }

  const targets = db.prepare('SELECT id FROM targets').all();
  const batchNo = `BATCH-${Date.now()}`;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const tx = db.transaction(() => {
    db.prepare("UPDATE warnings SET status = 'published', updated_at = datetime('now','localtime') WHERE id = ?").run(req.params.id);

    const insertPublish = db.prepare(
      'INSERT INTO publish_records (warning_id, channel_id, batch_no, total_count, success_count, fail_count, fail_list, status, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const insertReceipt = db.prepare(
      'INSERT INTO receipts (publish_record_id, target_id, confirm_status) VALUES (?, ?, ?)'
    );

    const results = [];
    for (const cid of channel_ids) {
      const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(cid);
      if (!channel) continue;
      const failList = [];
      const successRate = Math.random() > 0.3 ? 0.85 : 0.65;
      const total = targets.length;
      const success = Math.floor(total * successRate);
      const fail = total - success;

      const pInfo = insertPublish.run(req.params.id, cid, batchNo, total, success, fail,
        JSON.stringify(targets.slice(success).map(t => t.id)), 'completed', now);

      for (const target of targets) {
        insertReceipt.run(pInfo.lastInsertRowid, target.id, 'pending');
      }
      results.push({ channel_id: cid, publish_id: pInfo.lastInsertRowid, total, success, fail });
    }
    return results;
  });

  const results = tx();
  logAction('publish_warning', 'warning', req.params.id, operator || warning.issuer, { channel_ids, batchNo });
  res.json({ batch_no: batchNo, results });
});

router.post('/:id/cancel', (req, res) => {
  const db = getDb();
  const { reason, operator } = req.body;
  const existing = db.prepare('SELECT * FROM warnings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE warnings SET status = 'cancelled', updated_at = datetime('now','localtime') WHERE id = ?").run(req.params.id);
  logAction('cancel_warning', 'warning', req.params.id, operator || existing.issuer, { reason });
  res.json({ cancelled: 1 });
});

router.get('/templates/list', (req, res) => {
  const db = getDb();
  const { type, level } = req.query;
  let sql = 'SELECT * FROM warning_templates WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (level) { sql += ' AND level = ?'; params.push(level); }
  sql += ' ORDER BY id';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/templates', (req, res) => {
  const db = getDb();
  const { name, type, level, content, suggested_measures, operator } = req.body;
  if (!name || !type || !level || !content) {
    return res.status(400).json({ error: 'name, type, level, content are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO warning_templates (name, type, level, content, suggested_measures) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(name, type, level, content, suggested_measures || null);
  logAction('create_template', 'template', info.lastInsertRowid, operator || 'system', { name, type });
  res.json({ id: info.lastInsertRowid });
});

router.get('/templates/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM warning_templates WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.put('/templates/:id', (req, res) => {
  const db = getDb();
  const fields = [];
  const values = [];
  const allowed = ['name', 'type', 'level', 'content', 'suggested_measures'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }
  if (fields.length === 0) return res.json({ updated: 0 });
  values.push(req.params.id);
  db.prepare(`UPDATE warning_templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  logAction('update_template', 'template', req.params.id, req.body.operator || 'system', req.body);
  res.json({ updated: 1 });
});

router.get('/:id/logs', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM operations_log WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC'
  ).all('warning', req.params.id);
  const logs = rows.map(r => ({
    ...r,
    details: r.details ? JSON.parse(r.details) : null,
  }));
  res.json(logs);
});

module.exports = router;