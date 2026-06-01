const express = require('express');
const { getDb } = require('../database/schema');
const { authenticateToken, requireRole, logAction } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { status, severity, limit = 50 } = req.query;
  
  let query = `
    SELECT si.*,
      u.username as reporter_name,
      a.username as assignee_name,
      COUNT(DISTINCT ic.credential_id) as affected_credentials
    FROM security_incidents si
    LEFT JOIN users u ON si.reported_by = u.id
    LEFT JOIN users a ON si.assigned_to = a.id
    LEFT JOIN incident_credentials ic ON si.id = ic.incident_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND si.status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND si.severity = ?';
    params.push(severity);
  }

  query += `
    GROUP BY si.id
    ORDER BY si.created_at DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));

  const incidents = db.prepare(query).all(...params);
  res.json({ incidents });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const incident = db.prepare(`
    SELECT si.*,
      u.username as reporter_name,
      a.username as assignee_name
    FROM security_incidents si
    LEFT JOIN users u ON si.reported_by = u.id
    LEFT JOIN users a ON si.assigned_to = a.id
    WHERE si.id = ?
  `).get(id);

  if (!incident) {
    return res.status(404).json({ error: '事件不存在' });
  }

  const affectedCredentials = db.prepare(`
    SELECT ic.*, c.title, c.type, c.project_id, p.name as project_name
    FROM incident_credentials ic
    JOIN credentials c ON ic.credential_id = c.id
    JOIN projects p ON c.project_id = p.id
    WHERE ic.incident_id = ?
  `).all(id);

  res.json({ incident, affected_credentials: affectedCredentials });
});

router.post('/', authenticateToken, (req, res) => {
  const { incident_type, severity, title, description, credential_ids = [] } = req.body;
  
  if (!incident_type || !severity || !title) {
    return res.status(400).json({ error: '事件类型、严重程度和标题不能为空' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO security_incidents (
      incident_type, severity, title, description, reported_by
    ) VALUES (?, ?, ?, ?, ?)
  `).run(incident_type, severity, title, description, req.user.id);

  const incidentId = result.lastInsertRowid;

  credential_ids.forEach(credId => {
    try {
      db.prepare(`
        INSERT INTO incident_credentials (incident_id, credential_id, impact_level)
        VALUES (?, ?, 'unknown')
      `).run(incidentId, credId);
      
      db.prepare(`
        UPDATE credentials SET is_frozen = 1, frozen_at = CURRENT_TIMESTAMP, frozen_by = ?
        WHERE id = ?
      `).run(req.user.id, credId);
    } catch (e) {}
  });

  logAction(req, 'create_incident', 'incident', incidentId, { credential_ids });
  res.json({ id: incidentId, message: '安全事件已创建' });
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, assigned_to, resolution_notes } = req.body;
  
  const db = getDb();
  const incident = db.prepare('SELECT * FROM security_incidents WHERE id = ?').get(id);

  if (!incident) {
    return res.status(404).json({ error: '事件不存在' });
  }

  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
    if (status === 'resolved') {
      updates.push('resolved_at = CURRENT_TIMESTAMP');
    }
  }
  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    params.push(assigned_to);
  }
  if (resolution_notes !== undefined) {
    updates.push('resolution_notes = ?');
    params.push(resolution_notes);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE security_incidents SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  logAction(req, 'update_incident', 'incident', id, { status });
  res.json({ message: '事件已更新' });
});

router.post('/:id/credentials', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { credential_id, impact_level, notes } = req.body;
  
  const db = getDb();
  
  try {
    db.prepare(`
      INSERT INTO incident_credentials (incident_id, credential_id, impact_level, notes)
      VALUES (?, ?, ?, ?)
    `).run(id, credential_id, impact_level || 'unknown', notes);

    db.prepare(`
      UPDATE credentials SET is_frozen = 1, frozen_at = CURRENT_TIMESTAMP, frozen_by = ?
      WHERE id = ?
    `).run(req.user.id, credential_id);

    logAction(req, 'add_incident_credential', 'incident', id, { credential_id });
    res.json({ message: '已添加受影响凭据' });
  } catch (err) {
    res.status(400).json({ error: '凭据已添加或添加失败' });
  }
});

router.post('/:id/freeze-all', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以批量冻结' });
  }

  const db = getDb();
  
  db.prepare(`
    UPDATE credentials c
    JOIN incident_credentials ic ON c.id = ic.credential_id
    SET c.is_frozen = 1, c.frozen_at = CURRENT_TIMESTAMP, c.frozen_by = ?
    WHERE ic.incident_id = ?
  `).run(req.user.id, id);

  logAction(req, 'freeze_incident_credentials', 'incident', id);
  res.json({ message: '相关凭据已全部冻结' });
});

router.post('/:id/unfreeze-all', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以批量解冻' });
  }

  const db = getDb();
  
  db.prepare(`
    UPDATE credentials c
    JOIN incident_credentials ic ON c.id = ic.credential_id
    SET c.is_frozen = 0, c.frozen_at = NULL, c.frozen_by = NULL
    WHERE ic.incident_id = ?
  `).run(id);

  logAction(req, 'unfreeze_incident_credentials', 'incident', id);
  res.json({ message: '相关凭据已全部解冻' });
});

router.get('/anomalies/detection', authenticateToken, requireRole('admin'), (req, res) => {
  const db = getDb();
  
  const recentViews = db.prepare(`
    SELECT 
      cv.viewer_id,
      u.username as viewer_name,
      COUNT(*) as view_count,
      GROUP_CONCAT(DISTINCT c.title) as viewed_credentials
    FROM credential_views cv
    JOIN users u ON cv.viewer_id = u.id
    JOIN credentials c ON cv.credential_id = c.id
    WHERE cv.created_at > datetime('now', '-1 hour')
    GROUP BY cv.viewer_id
    HAVING view_count >= 10
    ORDER BY view_count DESC
  `).all();

  const afterHoursAccess = db.prepare(`
    SELECT 
      cv.viewer_id,
      u.username as viewer_name,
      c.title as credential_title,
      cv.created_at
    FROM credential_views cv
    JOIN users u ON cv.viewer_id = u.id
    JOIN credentials c ON cv.credential_id = c.id
    WHERE cv.created_at > datetime('now', '-24 hours')
      AND (strftime('%H', cv.created_at) < '06' OR strftime('%H', cv.created_at) >= '22')
    ORDER BY cv.created_at DESC
    LIMIT 20
  `).all();

  const massExports = db.prepare(`
    SELECT 
      al.user_id,
      u.username as user_name,
      al.details,
      al.created_at
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.action = 'mass_export'
      AND al.created_at > datetime('now', '-7 days')
    ORDER BY al.created_at DESC
  `).all();

  res.json({
    high_frequency_views: recentViews,
    after_hours_access: afterHoursAccess,
    mass_exports: massExports
  });
});

module.exports = router;
