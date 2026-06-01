const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, severity, appId, alertType } = req.query;
    let sql = `
      SELECT a.*, app.name as app_name, t.task_id, u.name as handled_by_name
      FROM alerts a
      LEFT JOIN applications app ON a.app_id = app.id
      LEFT JOIN tasks t ON a.task_id = t.id
      LEFT JOIN users u ON a.handled_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (severity) {
      sql += ' AND a.severity = ?';
      params.push(severity);
    }
    if (appId) {
      sql += ' AND a.app_id = ?';
      params.push(appId);
    }
    if (alertType) {
      sql += ' AND a.alert_type = ?';
      params.push(alertType);
    }

    sql += ' ORDER BY a.created_at DESC';
    const alerts = await db.all(sql, params);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await db.get(`
      SELECT a.*, app.name as app_name, t.task_id, u.name as handled_by_name
      FROM alerts a
      LEFT JOIN applications app ON a.app_id = app.id
      LEFT JOIN tasks t ON a.task_id = t.id
      LEFT JOIN users u ON a.handled_by = u.id
      WHERE a.id = ?
    `, [req.params.id]);
    
    if (!alert) {
      return res.status(404).json({ error: '告警不存在' });
    }
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/handle', authenticateToken, requireRole('admin', 'ops', 'security'), async (req, res) => {
  try {
    const alert = await db.get('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    if (!alert) {
      return res.status(404).json({ error: '告警不存在' });
    }
    if (alert.status !== 'open') {
      return res.status(400).json({ error: '只有未处理告警可以处理' });
    }

    const { remark } = req.body;

    await db.run(
      `UPDATE alerts SET status = 'handled', handled_by = ?, handled_at = CURRENT_TIMESTAMP, remark = ? WHERE id = ?`,
      [req.user.id, remark, req.params.id]
    );

    await createAuditLog(
      req.user.id,
      'handle',
      'alert',
      req.params.id,
      { status: 'open' },
      { status: 'handled', remark },
      req.ip,
      req.get('User-Agent')
    );

    const updatedAlert = await db.get('SELECT * FROM alerts WHERE id = ?', [req.params.id]);
    res.json(updatedAlert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
