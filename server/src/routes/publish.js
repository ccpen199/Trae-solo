const router = require('express').Router();
const { getDb, logAction } = require('../db');

router.get('/channels', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM channels ORDER BY id').all();
  res.json(rows);
});

router.post('/channels', (req, res) => {
  const db = getDb();
  const { name, channel_type, config, operator } = req.body;
  if (!name || !channel_type) {
    return res.status(400).json({ error: 'name and channel_type are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO channels (name, channel_type, config) VALUES (?, ?, ?)'
  );
  const info = stmt.run(name, channel_type, typeof config === 'object' ? JSON.stringify(config) : (config || null));
  logAction('create_channel', 'channel', info.lastInsertRowid, operator || 'system', { name, channel_type });
  res.json({ id: info.lastInsertRowid });
});

router.put('/channels/:id', (req, res) => {
  const db = getDb();
  const { name, channel_type, config, status, operator } = req.body;
  const fields = [];
  const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (channel_type !== undefined) { fields.push('channel_type = ?'); values.push(channel_type); }
  if (config !== undefined) { fields.push('config = ?'); values.push(typeof config === 'object' ? JSON.stringify(config) : config); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (fields.length === 0) return res.json({ updated: 0 });
  values.push(req.params.id);
  db.prepare(`UPDATE channels SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  logAction('update_channel', 'channel', req.params.id, operator || 'system', req.body);
  res.json({ updated: 1 });
});

router.get('/', (req, res) => {
  const db = getDb();
  const { warning_id, channel_id, batch_no, status, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT pr.*, w.type as warning_type, w.level as warning_level, w.content as warning_content,
           ch.name as channel_name, ch.channel_type
    FROM publish_records pr
    JOIN warnings w ON pr.warning_id = w.id
    JOIN channels ch ON pr.channel_id = ch.id
    WHERE 1=1
  `;
  let countSql = 'SELECT COUNT(*) as c FROM publish_records pr WHERE 1=1';
  const params = [];
  if (warning_id) { sql += ' AND pr.warning_id = ?'; countSql += ' AND pr.warning_id = ?'; params.push(warning_id); }
  if (channel_id) { sql += ' AND pr.channel_id = ?'; countSql += ' AND pr.channel_id = ?'; params.push(channel_id); }
  if (batch_no) { sql += ' AND pr.batch_no = ?'; countSql += ' AND pr.batch_no = ?'; params.push(batch_no); }
  if (status) { sql += ' AND pr.status = ?'; countSql += ' AND pr.status = ?'; params.push(status); }
  sql += ' ORDER BY pr.id DESC LIMIT ? OFFSET ?';
  const p = parseInt(page), ps = parseInt(pageSize);
  params.push(ps, (p - 1) * ps);
  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(countSql).get(...params.slice(0, params.length - 2)).c;
  res.json({ rows, total, page: p, pageSize: ps });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT pr.*, w.type as warning_type, w.level as warning_level, w.content as warning_content,
           ch.name as channel_name, ch.channel_type
    FROM publish_records pr
    JOIN warnings w ON pr.warning_id = w.id
    JOIN channels ch ON pr.channel_id = ch.id
    WHERE pr.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.get('/:id/failures', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM publish_records WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  let failList = [];
  try {
    failList = row.fail_list ? JSON.parse(row.fail_list) : [];
  } catch (e) { failList = []; }
  const targets = db.prepare('SELECT * FROM targets WHERE id IN (' + failList.map(() => '?').join(',') + ')')
    .all(...failList);
  res.json({ targets });
});

router.post('/:id/retry', (req, res) => {
  const db = getDb();
  const { operator } = req.body;
  const existing = db.prepare('SELECT * FROM publish_records WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  let failList = [];
  try { failList = existing.fail_list ? JSON.parse(existing.fail_list) : []; } catch (e) {}
  if (failList.length === 0) return res.json({ retried: 0, message: 'No failures to retry' });

  const newFail = [];
  for (const tid of failList) {
    if (Math.random() > 0.5) {
      newFail.push(tid);
    } else {
      db.prepare("UPDATE receipts SET confirm_status = 'confirmed', confirm_time = datetime('now','localtime') WHERE publish_record_id = ? AND target_id = ?")
        .run(req.params.id, tid);
    }
  }
  const success = failList.length - newFail.length;
  db.prepare('UPDATE publish_records SET success_count = success_count + ?, fail_count = ?, fail_list = ?, status = ? WHERE id = ?')
    .run(success, newFail.length, JSON.stringify(newFail), newFail.length > 0 ? 'completed' : 'completed', req.params.id);
  logAction('retry_publish', 'publish_record', req.params.id, operator || 'system', { retried: success });
  res.json({ retried: success, remaining_failures: newFail.length });
});

router.get('/targets/list', (req, res) => {
  const db = getDb();
  const { target_type } = req.query;
  let sql = 'SELECT * FROM targets';
  const params = [];
  if (target_type) { sql += ' WHERE target_type = ?'; params.push(target_type); }
  sql += ' ORDER BY id';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/targets', (req, res) => {
  const db = getDb();
  const { name, target_type, contact, parent_id, operator } = req.body;
  if (!name || !target_type) {
    return res.status(400).json({ error: 'name and target_type are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO targets (name, target_type, contact, parent_id) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(name, target_type, contact || null, parent_id || null);
  logAction('create_target', 'target', info.lastInsertRowid, operator || 'system', { name, target_type });
  res.json({ id: info.lastInsertRowid });
});

module.exports = router;