const router = require('express').Router();
const { getDb, logAction } = require('../db');

router.get('/stations', (req, res) => {
  const db = getDb();
  const { type } = req.query;
  let sql = 'SELECT * FROM stations';
  const params = [];
  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  sql += ' ORDER BY id';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/stations', (req, res) => {
  const db = getDb();
  const { name, code, type, location, lat, lng } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'name and type are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO stations (name, code, type, location, lat, lng) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(name, code || null, type, location || null, lat || null, lng || null);
  logAction('create_station', 'station', info.lastInsertRowid, req.body.operator || 'system', { name, type });
  res.json({ id: info.lastInsertRowid });
});

router.get('/data', (req, res) => {
  const db = getDb();
  const { station_id, data_type, start, end, limit } = req.query;
  let sql = 'SELECT md.*, s.name as station_name, s.code as station_code FROM monitor_data md JOIN stations s ON md.station_id = s.id WHERE 1=1';
  const params = [];
  if (station_id) { sql += ' AND md.station_id = ?'; params.push(station_id); }
  if (data_type) { sql += ' AND md.data_type = ?'; params.push(data_type); }
  if (start) { sql += ' AND md.recorded_at >= ?'; params.push(start); }
  if (end) { sql += ' AND md.recorded_at <= ?'; params.push(end); }
  sql += ' ORDER BY md.recorded_at DESC';
  const lim = parseInt(limit) || 500;
  sql += ' LIMIT ?';
  params.push(lim);
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/data/realtime', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT md.*, s.name as station_name, s.code as station_code, s.type as station_type
    FROM monitor_data md
    JOIN stations s ON md.station_id = s.id
    INNER JOIN (
      SELECT station_id, MAX(recorded_at) as max_time
      FROM monitor_data
      GROUP BY station_id
    ) latest ON md.station_id = latest.station_id AND md.recorded_at = latest.max_time
    ORDER BY s.id
  `).all();
  res.json(rows);
});

router.get('/data/trend', (req, res) => {
  const db = getDb();
  const { data_type, hours = 24 } = req.query;
  const since = new Date(Date.now() - parseInt(hours) * 3600 * 1000)
    .toISOString().slice(0, 19).replace('T', ' ');
  const rows = db.prepare(`
    SELECT md.*, s.name as station_name, s.code as station_code
    FROM monitor_data md
    JOIN stations s ON md.station_id = s.id
    WHERE md.recorded_at >= ?
    ${data_type ? 'AND md.data_type = ?' : ''}
    ORDER BY md.recorded_at ASC
  `).all(since, ...(data_type ? [data_type] : []));
  res.json(rows);
});

router.post('/data', (req, res) => {
  const db = getDb();
  const { station_id, value, data_type, recorded_at, operator } = req.body;
  if (!station_id || value == null || !data_type) {
    return res.status(400).json({ error: 'station_id, value, data_type are required' });
  }
  const ts = recorded_at || new Date().toISOString().slice(0, 19).replace('T', ' ');

  const thresholds = db.prepare('SELECT * FROM thresholds WHERE data_type = ?').all(data_type);
  let hit = 0;
  for (const th of thresholds) {
    const matches = {
      '>': value > th.threshold_value,
      '>=': value >= th.threshold_value,
      '<': value < th.threshold_value,
      '<=': value <= th.threshold_value,
      '==': value === th.threshold_value,
    };
    if (matches[th.comparison]) {
      hit = 1;
      break;
    }
  }

  const stmt = db.prepare(
    'INSERT INTO monitor_data (station_id, value, data_type, recorded_at, threshold_hit) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(station_id, value, data_type, ts, hit);

  if (hit) {
    logAction('threshold_hit', 'monitor_data', info.lastInsertRowid, operator || 'system', { station_id, value, data_type });
  }

  res.json({ id: info.lastInsertRowid, threshold_hit: hit });
});

router.get('/thresholds', (req, res) => {
  const db = getDb();
  const { data_type } = req.query;
  let sql = 'SELECT * FROM thresholds';
  const params = [];
  if (data_type) { sql += ' WHERE data_type = ?'; params.push(data_type); }
  sql += ' ORDER BY data_type, threshold_value';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/thresholds', (req, res) => {
  const db = getDb();
  const { data_type, warning_level, threshold_value, comparison, description, operator } = req.body;
  if (!data_type || !warning_level || threshold_value == null || !comparison) {
    return res.status(400).json({ error: 'data_type, warning_level, threshold_value, comparison are required' });
  }
  const stmt = db.prepare(
    'INSERT INTO thresholds (data_type, warning_level, threshold_value, comparison, description) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(data_type, warning_level, threshold_value, comparison, description || null);
  logAction('create_threshold', 'threshold', info.lastInsertRowid, operator || 'system', req.body);
  res.json({ id: info.lastInsertRowid });
});

router.get('/alerts', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT md.*, s.name as station_name, s.code as station_code
    FROM monitor_data md
    JOIN stations s ON md.station_id = s.id
    WHERE md.threshold_hit = 1
    ORDER BY md.recorded_at DESC
    LIMIT 100
  `).all();

  const logStmt = db.prepare(
    "SELECT details FROM operations_log WHERE target_type = 'monitor_alert' AND target_id = ? ORDER BY created_at DESC LIMIT 1"
  );

  for (const row of rows) {
    const log = logStmt.get(row.id);
    if (log && log.details) {
      try {
        const d = JSON.parse(log.details);
        row.research_status = d.research_status || null;
        row.handler = d.handler || null;
        row.handle_result = d.handle_result || null;
        row.linked_warning_id = d.linked_warning_id || null;
      } catch (e) {
        row.research_status = null;
        row.handler = null;
        row.handle_result = null;
        row.linked_warning_id = null;
      }
    } else {
      row.research_status = null;
      row.handler = null;
      row.handle_result = null;
      row.linked_warning_id = null;
    }
  }

  res.json(rows);
});

router.put('/alerts/:id', (req, res) => {
  const db = getDb();
  const { research_status, handler, handle_result, linked_warning_id } = req.body;
  const id = parseInt(req.params.id);

  const row = db.prepare(`
    SELECT md.*, s.name as station_name, s.code as station_code
    FROM monitor_data md
    JOIN stations s ON md.station_id = s.id
    WHERE md.id = ? AND md.threshold_hit = 1
  `).get(id);

  if (!row) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  logAction('research_alert', 'monitor_alert', id, handler || 'system', {
    research_status,
    handler,
    handle_result,
    linked_warning_id
  });

  const log = db.prepare(
    "SELECT details FROM operations_log WHERE target_type = 'monitor_alert' AND target_id = ? ORDER BY created_at DESC LIMIT 1"
  ).get(id);

  if (log && log.details) {
    try {
      const d = JSON.parse(log.details);
      row.research_status = d.research_status || null;
      row.handler = d.handler || null;
      row.handle_result = d.handle_result || null;
      row.linked_warning_id = d.linked_warning_id || null;
    } catch (e) {
      row.research_status = null;
      row.handler = null;
      row.handle_result = null;
      row.linked_warning_id = null;
    }
  } else {
    row.research_status = null;
    row.handler = null;
    row.handle_result = null;
    row.linked_warning_id = null;
  }

  res.json(row);
});

module.exports = router;