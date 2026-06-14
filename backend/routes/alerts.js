const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), (req, res) => {
  const { page = 1, pageSize = 20, status, alert_level } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT a.*, u.real_name as handler_name FROM alerts a LEFT JOIN users u ON a.handler_id = u.id WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1';
  let params = [];
  let countParams = [];

  if (status) {
    sql += ' AND a.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  if (alert_level) {
    sql += ' AND a.alert_level = ?';
    countSql += ' AND alert_level = ?';
    params.push(alert_level);
    countParams.push(alert_level);
  }

  sql += ' ORDER BY a.id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, parseInt(pageSize), offset];

  db.get(countSql, countParams, (err, countRow) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.all(sql, queryParams, (err, rows) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({
        code: 200,
        data: {
          list: rows,
          total: countRow.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

router.get('/pending', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), (req, res) => {
  db.all('SELECT a.*, u.real_name as handler_name FROM alerts a LEFT JOIN users u ON a.handler_id = u.id WHERE a.status = ? ORDER BY a.alert_level DESC, a.id DESC LIMIT 20',
    ['pending'], (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows });
  });
});

router.get('/count', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), (req, res) => {
  db.get('SELECT COUNT(*) as total FROM alerts WHERE status = ?', ['pending'], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: { pending_count: row.total } });
  });
});

router.get('/:id', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), (req, res) => {
  db.get('SELECT a.*, u.real_name as handler_name FROM alerts a LEFT JOIN users u ON a.handler_id = u.id WHERE a.id = ?',
    [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '预警不存在' });
    res.json({ code: 200, data: row });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建预警', '预警管理', 'alert'), (req, res) => {
  const { alert_type, alert_level, title, content, related_type, related_id } = req.body;

  if (!alert_type || !title) {
    return res.status(400).json({ code: 400, message: '预警类型和标题不能为空' });
  }

  db.run('INSERT INTO alerts (alert_type, alert_level, title, content, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)',
    [alert_type, alert_level || 'warning', title, content, related_type, related_id],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '预警创建成功' });
    });
});

router.put('/:id/handle', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), auditLog('处理预警', '预警管理', 'alert'), (req, res) => {
  const { handle_result } = req.body;
  const now = new Date().toISOString();

  db.run('UPDATE alerts SET status = ?, handler_id = ?, handled_time = ?, handle_result = ? WHERE id = ?',
    ['handled', req.user.id, now, handle_result, req.params.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '预警已处理' });
    });
});

router.put('/:id/ignore', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('忽略预警', '预警管理', 'alert'), (req, res) => {
  db.run('UPDATE alerts SET status = ?, handler_id = ?, handled_time = ? WHERE id = ?',
    ['ignored', req.user.id, new Date().toISOString(), req.params.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '预警已忽略' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除预警', '预警管理', 'alert'), (req, res) => {
  db.run('DELETE FROM alerts WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

router.get('/check/timeout-applications', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  const now = new Date();
  const thresholdDays = 15;

  db.all(`
    SELECT
      a.id,
      a.application_no,
      s.item_name,
      a.applicant_name,
      a.submit_time,
      JULIANDAY(?) - JULIANDAY(a.submit_time) as days_passed,
      s.handling_time_limit
    FROM applications a
    JOIN service_items s ON a.service_item_id = s.id
    WHERE a.current_status IN (?, ?, ?)
    AND JULIANDAY(?) - JULIANDAY(a.submit_time) > ?
    ORDER BY days_passed DESC
  `, [now.toISOString(), 'pending', 'accepted', 'reviewing', now.toISOString(), thresholdDays],
    (err, rows) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });

      const alerts = [];
      rows.forEach(app => {
        const days = Math.floor(app.days_passed);
        const alertLevel = days > 30 ? 'danger' : days > 20 ? 'warning' : 'info';
        alerts.push({
          alert_type: 'timeout',
          alert_level: alertLevel,
          title: `办件超时预警`,
          content: `办件 ${app.application_no}(${app.item_name})已提交 ${days} 天未办结，承诺时限 ${app.handling_time_limit}，请及时处理。`,
          related_type: 'application',
          related_id: app.id
        });
      });

      res.json({
        code: 200,
        data: {
          timeout_count: rows.length,
          timeout_applications: rows,
          generated_alerts: alerts
        }
      });
    });
});

module.exports = router;
