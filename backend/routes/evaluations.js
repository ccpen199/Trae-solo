const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog, operationLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, status, is_rectified } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT e.*, s.item_name, a.application_no, u.real_name as user_name FROM evaluations e LEFT JOIN service_items s ON e.item_id = s.id LEFT JOIN applications a ON e.application_id = a.id LEFT JOIN users u ON e.user_id = u.id WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM evaluations WHERE 1=1';
  let params = [];
  let countParams = [];

  if (req.user.level !== 'admin') {
    sql += ' AND e.user_id = ?';
    countSql += ' AND user_id = ?';
    params.push(req.user.id);
    countParams.push(req.user.id);
  }

  if (status) {
    sql += ' AND e.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  if (is_rectified !== undefined) {
    sql += ' AND e.is_rectified = ?';
    countSql += ' AND is_rectified = ?';
    params.push(is_rectified);
    countParams.push(is_rectified);
  }

  sql += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
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

router.get('/my', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT e.*, s.item_name, a.application_no FROM evaluations e LEFT JOIN service_items s ON e.item_id = s.id LEFT JOIN applications a ON e.application_id = a.id WHERE e.user_id = ? ORDER BY e.id DESC LIMIT ? OFFSET ?';

  db.all(sql, [req.user.id, parseInt(pageSize), offset], (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.get('SELECT COUNT(*) as total FROM evaluations WHERE user_id = ?', [req.user.id], (err, countRow) => {
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

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT e.*, s.item_name, a.application_no, u.real_name as user_name FROM evaluations e LEFT JOIN service_items s ON e.item_id = s.id LEFT JOIN applications a ON e.application_id = a.id LEFT JOIN users u ON e.user_id = u.id WHERE e.id = ?',
    [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '评价不存在' });

    if (req.user.level !== 'admin' && row.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限查看此评价' });
    }

    res.json({ code: 200, data: row });
  });
});

router.post('/', authenticateToken, auditLog('提交评价', '评价管理', 'evaluation'), operationLog('提交评价'), (req, res) => {
  const { application_id, service_item_id, overall_rating, speed_rating, attitude_rating, result_rating, content, suggestions, is_anonymous } = req.body;

  if (!application_id || !overall_rating) {
    return res.status(400).json({ code: 400, message: '办件ID和总体评分为必填项' });
  }

  if (overall_rating < 1 || overall_rating > 5) {
    return res.status(400).json({ code: 400, message: '评分必须在1-5之间' });
  }

  db.get('SELECT id, user_id FROM applications WHERE id = ?', [application_id], (err, app) => {
    if (err || !app) return res.status(404).json({ code: 404, message: '办件不存在' });
    if (app.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能评价自己的办件' });
    }

    db.get('SELECT id FROM evaluations WHERE application_id = ?', [application_id], (err, existing) => {
      if (existing) return res.status(400).json({ code: 400, message: '该办件已评价' });

      db.run('INSERT INTO evaluations (application_id, user_id, item_id, overall_rating, handling_speed_rating, service_attitude_rating, result_satisfaction_rating, content, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [application_id, req.user.id, service_item_id, overall_rating, speed_rating, attitude_rating, result_rating, content || suggestions || '', is_anonymous || 0],
        function(err) {
          if (err) return res.status(500).json({ code: 500, message: err.message });

          if (overall_rating <= 2) {
            db.run('INSERT INTO alerts (alert_type, alert_level, title, content, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)',
              ['bad_review', 'danger', '差评预警', `办件 ${application_id} 收到差评，评分为 ${overall_rating} 星，请及时处理。`, 'evaluation', this.lastID]);
          }

          res.json({ code: 200, data: { id: this.lastID }, message: '评价成功' });
        });
    });
  });
});

router.put('/:id/reply', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), auditLog('回复评价', '评价管理', 'evaluation'), (req, res) => {
  const { reply } = req.body;
  const now = new Date().toISOString();

  db.run('UPDATE evaluations SET reply = ?, reply_time = ?, replier = ? WHERE id = ?',
    [reply, now, req.user.real_name, req.params.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '回复成功' });
    });
});

router.put('/:id/rectification', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin']), auditLog('差评整改', '评价管理', 'evaluation'), (req, res) => {
  const { rectification_plan, rectification_result } = req.body;
  const now = new Date().toISOString();

  db.run('UPDATE evaluations SET rectification_plan = ?, rectification_result = ?, rectification_time = ?, is_rectified = 1 WHERE id = ?',
    [rectification_plan, rectification_result, now, req.params.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });

      db.run('UPDATE alerts SET status = ?, handled_time = ?, handle_result = ? WHERE related_id = ? AND related_type = ?',
        ['handled', now, rectification_result, req.params.id, 'evaluation']);

      res.json({ code: 200, message: '整改完成' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除评价', '评价管理', 'evaluation'), (req, res) => {
  db.run('UPDATE evaluations SET status = ? WHERE id = ?', ['deleted', req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
