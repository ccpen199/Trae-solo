const router = require('express').Router();
const { getDb, logAction } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  const { publish_record_id, target_id, confirm_status, page = 1, pageSize = 50 } = req.query;
  let sql = `
    SELECT r.*, pr.batch_no, pr.warning_id, w.type as warning_type, w.level as warning_level,
           w.content as warning_content, w.affected_area, w.suggested_measures,
           t.name as target_name, t.target_type, t.contact
    FROM receipts r
    JOIN publish_records pr ON r.publish_record_id = pr.id
    JOIN targets t ON r.target_id = t.id
    LEFT JOIN warnings w ON pr.warning_id = w.id
    WHERE 1=1
  `;
  let countSql = `
    SELECT COUNT(*) as c FROM receipts r
    JOIN publish_records pr ON r.publish_record_id = pr.id
    JOIN targets t ON r.target_id = t.id
    WHERE 1=1
  `;
  const params = [];
  if (publish_record_id) { sql += ' AND r.publish_record_id = ?'; countSql += ' AND r.publish_record_id = ?'; params.push(publish_record_id); }
  if (target_id) { sql += ' AND r.target_id = ?'; countSql += ' AND r.target_id = ?'; params.push(target_id); }
  if (confirm_status) { sql += ' AND r.confirm_status = ?'; countSql += ' AND r.confirm_status = ?'; params.push(confirm_status); }
  sql += ' ORDER BY r.id DESC LIMIT ? OFFSET ?';
  const p = parseInt(page), ps = parseInt(pageSize);
  params.push(ps, (p - 1) * ps);
  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(countSql).get(...params.slice(0, params.length - 2)).c;
  res.json({ rows, total, page: p, pageSize: ps });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT r.*, pr.batch_no, pr.warning_id, w.type as warning_type, w.level as warning_level,
           w.content as warning_content, w.affected_area, w.suggested_measures,
           t.name as target_name, t.target_type, t.contact
    FROM receipts r
    JOIN publish_records pr ON r.publish_record_id = pr.id
    JOIN targets t ON r.target_id = t.id
    LEFT JOIN warnings w ON pr.warning_id = w.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/:id/confirm', (req, res) => {
  const db = getDb();
  const { operator, confirm_time } = req.body;
  const existing = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const ct = confirm_time || new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare("UPDATE receipts SET confirm_status = 'confirmed', confirm_time = ? WHERE id = ?")
    .run(ct, req.params.id);
  logAction('confirm_receipt', 'receipt', req.params.id, operator || existing.target_name, { publish_record_id: existing.publish_record_id });
  res.json({ confirmed: 1 });
});

router.post('/:id/forward', (req, res) => {
  const db = getDb();
  const { forward_to, operator, confirm_time } = req.body;
  const existing = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (!forward_to) return res.status(400).json({ error: 'forward_to is required' });
  const ct = confirm_time || new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare("UPDATE receipts SET confirm_status = 'forwarded', confirm_time = ?, forward_to = ? WHERE id = ?")
    .run(ct, forward_to, req.params.id);
  logAction('forward_receipt', 'receipt', req.params.id, operator || existing.target_name, { forward_to });
  res.json({ forwarded: 1 });
});

router.post('/:id/act', (req, res) => {
  const db = getDb();
  const { action_measures, operator, confirm_time } = req.body;
  const existing = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (!action_measures) return res.status(400).json({ error: 'action_measures is required' });
  const ct = confirm_time || new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare("UPDATE receipts SET confirm_status = 'acted', confirm_time = ?, action_measures = ? WHERE id = ?")
    .run(ct, action_measures, req.params.id);
  logAction('act_receipt', 'receipt', req.params.id, operator || existing.target_name, { action_measures });
  res.json({ acted: 1 });
});

router.post('/:id/no-response', (req, res) => {
  const db = getDb();
  const { operator } = req.body;
  const existing = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE receipts SET confirm_status = 'no_response' WHERE id = ?").run(req.params.id);
  logAction('mark_no_response', 'receipt', req.params.id, operator || 'system', {});
  res.json({ marked: 1 });
});

router.post('/:id/feedback', (req, res) => {
  const db = getDb();
  const { feedback, operator } = req.body;
  const existing = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (!feedback) return res.status(400).json({ error: 'feedback is required' });
  db.prepare('UPDATE receipts SET feedback = ? WHERE id = ?').run(feedback, req.params.id);
  logAction('add_feedback', 'receipt', req.params.id, operator || existing.target_name, { feedback });
  res.json({ updated: 1 });
});

router.get('/summary/by-warning', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      w.id as warning_id, w.type, w.level, w.affected_area, w.status as warning_status,
      COUNT(DISTINCT pr.id) as publish_count,
      COUNT(r.id) as total_targets,
      SUM(CASE WHEN r.confirm_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN r.confirm_status = 'forwarded' THEN 1 ELSE 0 END) as forwarded,
      SUM(CASE WHEN r.confirm_status = 'acted' THEN 1 ELSE 0 END) as acted,
      SUM(CASE WHEN r.confirm_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN r.confirm_status = 'no_response' THEN 1 ELSE 0 END) as no_response
    FROM warnings w
    LEFT JOIN publish_records pr ON pr.warning_id = w.id
    LEFT JOIN receipts r ON r.publish_record_id = pr.id
    GROUP BY w.id
    ORDER BY w.id DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

router.get('/summary/by-target', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      t.id as target_id, t.name, t.target_type, t.contact,
      COUNT(r.id) as total_receipts,
      SUM(CASE WHEN r.confirm_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN r.confirm_status = 'forwarded' THEN 1 ELSE 0 END) as forwarded,
      SUM(CASE WHEN r.confirm_status = 'acted' THEN 1 ELSE 0 END) as acted,
      SUM(CASE WHEN r.confirm_status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN r.confirm_status = 'no_response' THEN 1 ELSE 0 END) as no_response
    FROM targets t
    LEFT JOIN receipts r ON r.target_id = t.id
    GROUP BY t.id
    ORDER BY t.id
    LIMIT 100
  `).all();
  res.json(rows);
});

module.exports = router;