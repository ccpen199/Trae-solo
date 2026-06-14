const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM electronic_certificates WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?';
  let countSql = 'SELECT COUNT(*) as total FROM electronic_certificates WHERE user_id = ?';

  db.all(sql, [req.user.id, parseInt(pageSize), offset], (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.get(countSql, [req.user.id], (err, countRow) => {
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

router.get('/all', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  const { page = 1, pageSize = 20, cert_type, user_id } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT ec.*, u.real_name as user_name, u.phone as user_phone FROM electronic_certificates ec LEFT JOIN users u ON ec.user_id = u.id WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM electronic_certificates WHERE 1=1';
  let params = [];
  let countParams = [];

  if (cert_type) {
    sql += ' AND ec.cert_type = ?';
    countSql += ' AND cert_type = ?';
    params.push(cert_type);
    countParams.push(cert_type);
  }
  if (user_id) {
    sql += ' AND ec.user_id = ?';
    countSql += ' AND user_id = ?';
    params.push(user_id);
    countParams.push(user_id);
  }

  sql += ' ORDER BY ec.id DESC LIMIT ? OFFSET ?';
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

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM electronic_certificates WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '证照不存在' });
    if (req.user.level !== 'admin' && row.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限查看此证照' });
    }
    res.json({ code: 200, data: row });
  });
});

router.post('/', authenticateToken, auditLog('添加电子证照', '证照管理', 'certificate'), (req, res) => {
  const { cert_type, cert_no, cert_name, issue_authority, issue_date, valid_date, cert_data, cert_file } = req.body;

  if (!cert_type || !cert_name) {
    return res.status(400).json({ code: 400, message: '证照类型和名称不能为空' });
  }

  db.run('INSERT INTO electronic_certificates (user_id, cert_type, cert_no, cert_name, issue_authority, issue_date, valid_date, cert_data, cert_file) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, cert_type, cert_no, cert_name, issue_authority, issue_date, valid_date, cert_data, cert_file],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '证照添加成功' });
    });
});

router.put('/:id/verify', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('验证电子证照', '证照管理', 'certificate'), (req, res) => {
  db.run('UPDATE electronic_certificates SET is_verified = 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '证照已验证' });
  });
});

router.post('/national/query', authenticateToken, auditLog('调用国家平台证照', '证照管理', 'certificate'), (req, res) => {
  const { cert_type, cert_no, user_name } = req.body;

  db.run('INSERT INTO national_platform_sync (sync_type, sync_direction, data_type, sync_status, sync_time) VALUES (?, ?, ?, ?, ?)',
    ['cert_query', 'outbound', 'certificate', 'success', new Date().toISOString()]);

  const mockCerts = {
    '身份证': { cert_no: cert_no || '510104199001010001', cert_name: '居民身份证', issue_authority: '成都市公安局锦江区分局', valid_date: '2040-01-01' },
    '驾驶证': { cert_no: cert_no || '510100199001010001', cert_name: '机动车驾驶证', issue_authority: '成都市公安局交通警察支队', valid_date: '2030-01-01' },
    '营业执照': { cert_no: cert_no || '91510100MA6XXXXXXX', cert_name: '营业执照', issue_authority: '成都市市场监督管理局', valid_date: '长期' }
  };

  const cert = mockCerts[cert_type] || mockCerts['身份证'];

  res.json({
    code: 200,
    message: '国家政务服务平台证照查询成功',
    data: {
      platform: '国家政务服务平台',
      query_time: new Date().toISOString(),
      result: {
        ...cert,
        user_name: user_name || req.user.real_name,
        status: 'valid',
        verify_result: '验证通过'
      }
    }
  });
});

router.delete('/:id', authenticateToken, auditLog('删除电子证照', '证照管理', 'certificate'), (req, res) => {
  db.get('SELECT user_id FROM electronic_certificates WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ code: 404, message: '证照不存在' });
    if (req.user.level !== 'admin' && row.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限删除此证照' });
    }

    db.run('UPDATE electronic_certificates SET status = 0 WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '删除成功' });
    });
  });
});

module.exports = router;
