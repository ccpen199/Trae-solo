const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/sync-status', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  const { page = 1, pageSize = 20, sync_type, sync_status } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM national_platform_sync WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM national_platform_sync WHERE 1=1';
  let params = [];
  let countParams = [];

  if (sync_type) {
    sql += ' AND sync_type = ?';
    countSql += ' AND sync_type = ?';
    params.push(sync_type);
    countParams.push(sync_type);
  }
  if (sync_status) {
    sql += ' AND sync_status = ?';
    countSql += ' AND sync_status = ?';
    params.push(sync_status);
    countParams.push(sync_status);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
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

router.post('/sync-items', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('事项同步', '国家平台对接', 'sync'), (req, res) => {
  const { direction = 'outbound', item_ids = [] } = req.body;

  db.all('SELECT * FROM service_items WHERE status = 1' + (item_ids.length > 0 ? ' AND id IN (' + item_ids.map(() => '?').join(',') + ')' : ''),
    item_ids, (err, items) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });

      const now = new Date().toISOString();
      const results = items.map(item => ({
        item_code: item.item_code,
        item_name: item.item_name,
        sync_status: 'success',
        sync_time: now,
        response_data: JSON.stringify({ code: 200, message: '同步成功', national_item_id: 'NAT-' + item.item_code })
      }));

      const stmt = db.prepare('INSERT INTO national_platform_sync (sync_type, sync_direction, data_type, data_id, sync_status, sync_time, response_data) VALUES (?, ?, ?, ?, ?, ?, ?)');
      results.forEach((r, i) => {
        stmt.run(['item_sync', direction, 'service_item', items[i].id, r.sync_status, r.sync_time, r.response_data]);
      });
      stmt.finalize();

      res.json({
        code: 200,
        message: `成功同步 ${items.length} 个事项到国家政务服务平台`,
        data: {
          count: items.length,
          results,
          platform: '国家政务服务平台',
          sync_time: now
        }
      });
    });
});

router.post('/user-auth', authenticateToken, auditLog('用户互认', '国家平台对接', 'sync'), (req, res) => {
  const { id_card, user_name } = req.body;

  const now = new Date().toISOString();

  db.run('INSERT INTO national_platform_sync (sync_type, sync_direction, data_type, sync_status, sync_time, response_data) VALUES (?, ?, ?, ?, ?, ?)',
    ['user_auth', 'both', 'user', 'success', now, JSON.stringify({ code: 200, message: '用户互认成功' })],
    function(err) {
      res.json({
        code: 200,
        message: '国家政务服务平台用户互认成功',
        data: {
          platform: '国家政务服务平台',
          auth_time: now,
          result: {
            user_name: user_name || req.user.real_name,
            id_card: id_card || req.user.id_card,
            is_verified: true,
            national_user_id: 'NAT-USER-' + (req.user.id || '0001'),
            trust_level: 'high'
          }
        }
      });
    });
});

router.post('/cert-call', authenticateToken, auditLog('电子证照调用', '国家平台对接', 'sync'), (req, res) => {
  const { cert_type, cert_no, user_name, id_card } = req.body;

  const now = new Date().toISOString();

  db.run('INSERT INTO national_platform_sync (sync_type, sync_direction, data_type, sync_status, sync_time, response_data) VALUES (?, ?, ?, ?, ?, ?)',
    ['cert_call', 'outbound', 'certificate', 'success', now, JSON.stringify({ code: 200, message: '证照调用成功' })],
    function(err) {
      res.json({
        code: 200,
        message: '国家政务服务平台电子证照调用成功',
        data: {
          platform: '国家政务服务平台',
          call_time: now,
          cert_info: {
            cert_type: cert_type || '居民身份证',
            cert_no: cert_no || id_card || '510104199001010001',
            holder_name: user_name || req.user.real_name,
            status: 'valid',
            issue_authority: '国家政务服务平台证照库',
            verify_result: '验证通过',
            cert_file_url: '/mock/cert/' + this.lastID + '.pdf'
          },
          usage_record: {
            usage_id: 'USAGE-' + Date.now(),
            usage_purpose: '政务服务事项办理',
            authorized: true
          }
        }
      });
    });
});

router.post('/access-source', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('配置接入源', '多源接入', 'access_source'), (req, res) => {
  const { source_name, source_code, access_mode, api_url, api_key, callback_url } = req.body;

  if (!source_name || !source_code || !access_mode) {
    return res.status(400).json({ code: 400, message: '接入源名称、编码和方式不能为空' });
  }

  if (!['reverse_link', 'api_push', 'joint_build'].includes(access_mode)) {
    return res.status(400).json({ code: 400, message: '接入方式必须是 reverse_link、api_push 或 joint_build' });
  }

  db.run('INSERT INTO access_sources (source_name, source_code, access_mode, api_url, api_key, callback_url) VALUES (?, ?, ?, ?, ?, ?)',
    [source_name, source_code, access_mode, api_url, api_key, callback_url],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '接入源配置成功' });
    });
});

router.get('/access-sources', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin']), (req, res) => {
  db.all('SELECT * FROM access_sources WHERE status = 1 ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({
      code: 200,
      data: rows.map(r => ({
        ...r,
        access_mode_text: {
          'reverse_link': '反向链接',
          'api_push': 'API推送',
          'joint_build': '联合共建'
        }[r.access_mode] || r.access_mode
      }))
    });
  });
});

router.put('/access-sources/:id/sync', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('触发接入同步', '多源接入', 'access_source'), (req, res) => {
  db.get('SELECT * FROM access_sources WHERE id = ?', [req.params.id], (err, source) => {
    if (err || !source) return res.status(404).json({ code: 404, message: '接入源不存在' });

    const now = new Date().toISOString();
    db.run('UPDATE access_sources SET last_sync_time = ? WHERE id = ?', [now, req.params.id]);

    const mockCount = Math.floor(Math.random() * 50) + 10;
    res.json({
      code: 200,
      message: `从 ${source.source_name} 同步数据成功`,
      data: {
        source_name: source.source_name,
        access_mode: source.access_mode,
        sync_time: now,
        synced_count: mockCount,
        new_items: Math.floor(mockCount * 0.3),
        updated_items: Math.floor(mockCount * 0.7)
      }
    });
  });
});

module.exports = router;
