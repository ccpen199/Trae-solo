import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('strategy', 'read'), (req, res) => {
  const { alert_type, severity, status, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT a.*, t.task_no, u1.real_name as acknowledger_name, u2.real_name as resolver_name
    FROM alerts a
    LEFT JOIN tasks t ON a.task_id = t.id
    LEFT JOIN users u1 ON a.acknowledged_by = u1.id
    LEFT JOIN users u2 ON a.resolved_by = u2.id
    WHERE 1=1
  `;
  const params = [];

  if (alert_type) {
    query += ' AND a.alert_type = ?';
    params.push(alert_type);
  }
  if (severity) {
    query += ' AND a.severity = ?';
    params.push(severity);
  }
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const alerts = db.prepare(query).all(...params);

  res.json({
    list: alerts,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/:id/acknowledge', checkPermission('alert', 'acknowledge'), (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  if (alert.status !== 'active') {
    return res.status(400).json({ error: '只能确认状态为active的告警' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('task_execute', ?, ?, 'acknowledge', 'alert', ?, ?, ?)
  `).run(req.user.id, req.user.username, req.params.id, alert.alert_no, `确认告警: ${alert.alert_no}`);

  res.json({ message: '告警已确认' });
});

router.post('/:id/resolve', checkPermission('alert', 'acknowledge'), (req, res) => {
  const { resolution_note } = req.body;
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  db.prepare(`
    UPDATE alerts 
    SET status = 'resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, resolution_note || '', req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('task_execute', ?, ?, 'resolve', 'alert', ?, ?, ?)
  `).run(req.user.id, req.user.username, req.params.id, alert.alert_no, `解决告警: ${alert.alert_no}`);

  res.json({ message: '告警已解决' });
});

export default router;
