const router = require('express').Router();
const { getDb } = require('../db');

router.get('/overview', (req, res) => {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM warnings WHERE status = 'published') as active_warnings,
      (SELECT COUNT(*) FROM warnings WHERE status = 'draft') as drafts,
      (SELECT COUNT(*) FROM warnings WHERE status = 'cancelled') as cancelled,
      (SELECT COUNT(*) FROM publish_records) as total_publishes,
      (SELECT COUNT(*) FROM receipts WHERE confirm_status = 'pending') as pending_receipts,
      (SELECT COUNT(*) FROM receipts WHERE confirm_status = 'no_response') as no_response,
      (SELECT COUNT(*) FROM monitor_data WHERE threshold_hit = 1) as total_alerts,
      (SELECT COUNT(*) FROM targets) as total_targets,
      (SELECT COUNT(*) FROM channels WHERE status = 'active') as active_channels
  `).get();
  res.json(stats);
});

router.get('/warning-stats', (req, res) => {
  const db = getDb();
  const { start, end } = req.query;
  let sql = `
    SELECT type, level, status, COUNT(*) as count
    FROM warnings
    WHERE 1=1
  `;
  const params = [];
  if (start) { sql += ' AND created_at >= ?'; params.push(start); }
  if (end) { sql += ' AND created_at <= ?'; params.push(end); }
  sql += ' GROUP BY type, level, status ORDER BY count DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/publish-stats', (req, res) => {
  const db = getDb();
  const { start, end } = req.query;
  let sql = `
    SELECT
      ch.channel_type, ch.name as channel_name,
      COUNT(pr.id) as publish_count,
      SUM(pr.total_count) as total_targets,
      SUM(pr.success_count) as total_success,
      SUM(pr.fail_count) as total_fail,
      ROUND(CASE WHEN SUM(pr.total_count) > 0
        THEN SUM(pr.success_count) * 100.0 / SUM(pr.total_count) ELSE 0 END, 2) as success_rate
    FROM publish_records pr
    JOIN channels ch ON pr.channel_id = ch.id
    WHERE 1=1
  `;
  const params = [];
  if (start) { sql += ' AND pr.created_at >= ?'; params.push(start); }
  if (end) { sql += ' AND pr.created_at <= ?'; params.push(end); }
  sql += ' GROUP BY ch.id ORDER BY publish_count DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/receipt-stats', (req, res) => {
  const db = getDb();
  const { start, end } = req.query;
  let sql = `
    SELECT
      confirm_status, COUNT(*) as count
    FROM receipts
    WHERE 1=1
  `;
  const params = [];
  if (start) { sql += ' AND created_at >= ?'; params.push(start); }
  if (end) { sql += ' AND created_at <= ?'; params.push(end); }
  sql += ' GROUP BY confirm_status';
  const rows = db.prepare(sql).all(...params);

  const total = rows.reduce((s, r) => s + r.count, 0);
  const rates = rows.map(r => ({
    ...r,
    rate: total > 0 ? +(r.count * 100.0 / total).toFixed(2) : 0
  }));
  res.json({ rows: rates, total });
});

router.get('/timeliness', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      w.id, w.type, w.level, w.affected_area, w.created_at,
      pr.created_at as published_at,
      (CAST((julianday(pr.created_at) - julianday(w.created_at)) * 86400 AS INTEGER)) as delay_seconds
    FROM warnings w
    JOIN publish_records pr ON pr.warning_id = w.id
    WHERE w.status = 'published'
    ORDER BY w.id DESC
    LIMIT 100
  `).all();
  const avgDelay = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + (r.delay_seconds || 0), 0) / rows.length)
    : 0;
  res.json({ rows, avg_delay_seconds: avgDelay, avg_delay_minutes: (avgDelay / 60).toFixed(1) });
});

router.get('/coverage', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      w.id, w.type, w.level, w.affected_area,
      COUNT(DISTINCT t.id) as total_targets,
      COUNT(DISTINCT CASE WHEN r.confirm_status IN ('confirmed','forwarded','acted') THEN t.id END) as responded,
      ROUND(CASE WHEN COUNT(DISTINCT t.id) > 0
        THEN COUNT(DISTINCT CASE WHEN r.confirm_status IN ('confirmed','forwarded','acted') THEN t.id END) * 100.0
        / COUNT(DISTINCT t.id) ELSE 0 END, 2) as coverage_rate
    FROM warnings w
    JOIN publish_records pr ON pr.warning_id = w.id
    JOIN receipts r ON r.publish_record_id = pr.id
    JOIN targets t ON r.target_id = t.id
    GROUP BY w.id
    ORDER BY w.id DESC
    LIMIT 50
  `).all();
  const avgCoverage = rows.length > 0
    ? +(rows.reduce((s, r) => s + r.coverage_rate, 0) / rows.length).toFixed(2)
    : 0;
  res.json({ rows, avg_coverage_rate: avgCoverage });
});

router.get('/hit-accuracy', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      th.data_type, th.warning_level, th.threshold_value, th.comparison,
      (SELECT COUNT(*) FROM monitor_data md WHERE md.data_type = th.data_type) as total_readings,
      (SELECT COUNT(*) FROM monitor_data md WHERE md.data_type = th.data_type AND md.threshold_hit = 1) as hit_count
    FROM thresholds th
    ORDER BY th.data_type, th.threshold_value
  `).all();
  res.json(rows);
});

router.get('/cancellation-log', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      w.id, w.type, w.level, w.affected_area, w.issuer,
      w.created_at, w.updated_at,
      (CAST((julianday(w.updated_at) - julianday(w.created_at)) * 86400 AS INTEGER)) as active_duration_seconds
    FROM warnings w
    WHERE w.status = 'cancelled'
    ORDER BY w.updated_at DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

router.get('/ops-log', (req, res) => {
  const db = getDb();
  const { action, operator, start, end, page = 1, pageSize = 50 } = req.query;
  let sql = 'SELECT * FROM operations_log WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as c FROM operations_log WHERE 1=1';
  const params = [];
  if (action) { sql += ' AND action = ?'; countSql += ' AND action = ?'; params.push(action); }
  if (operator) { sql += ' AND operator LIKE ?'; countSql += ' AND operator LIKE ?'; params.push(`%${operator}%`); }
  if (start) { sql += ' AND created_at >= ?'; countSql += ' AND created_at >= ?'; params.push(start); }
  if (end) { sql += ' AND created_at <= ?'; countSql += ' AND created_at <= ?'; params.push(end); }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const p = parseInt(page), ps = parseInt(pageSize);
  params.push(ps, (p - 1) * ps);
  const rows = db.prepare(sql).all(...params);
  const total = db.prepare(countSql).get(...params.slice(0, params.length - 2)).c;
  res.json({ rows, total, page: p, pageSize: ps });
});

module.exports = router;