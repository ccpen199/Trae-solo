const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, alert_type, severity } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }
  if (alert_type) {
    whereClause += ' AND a.alert_type = ?';
    params.push(alert_type);
  }
  if (severity) {
    whereClause += ' AND a.severity = ?';
    params.push(severity);
  }

  const alerts = db.prepare(`
    SELECT a.*, t.task_no, app.app_name, handler.name as handler_name
    FROM alerts a
    LEFT JOIN execution_tasks t ON a.task_id = t.id
    LEFT JOIN applications app ON a.app_id = app.id
    LEFT JOIN users handler ON a.handled_by = handler.id
    ${whereClause}
    ORDER BY a.created_at DESC
  `).all(...params);

  res.json(alerts);
});

router.post('/:id/handle', (req, res) => {
  const alertId = req.params.id;
  const { status, handle_result } = req.body;

  db.prepare(`
    UPDATE alerts 
    SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP, handle_result = ?
    WHERE id = ?
  `).run(status, req.user.id, handle_result, alertId);

  res.json({ message: '处理成功' });
});

module.exports = router;
