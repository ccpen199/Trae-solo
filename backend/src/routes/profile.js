const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { maskSensitiveData } = require('../middleware/gmCrypto');

const router = express.Router();

router.get('/info', authenticate, auditLog('profile', 'get_info'), async (req, res) => {
  const roleMap = {
    'admin': 'admin',
    'platform': 'operator',
    'ops': 'maintainer',
  };
  const role = roleMap[req.user.phone] || 'user';
  
  const userInfo = maskSensitiveData({
    id: req.user.id,
    name: req.user.real_name,
    real_name: req.user.real_name,
    phone: req.user.phone,
    id_card_no: req.user.id_card_no,
    avatar: req.user.avatar,
    province: req.user.province,
    city: req.user.city,
    auth_level: req.user.auth_level,
    email: req.user.email,
    role: role,
    status: req.user.status,
    real_name_verified: req.user.status === 1,
    created_at: req.user.created_at,
  });

  const serviceCount = (await db.getAsync('SELECT COUNT(*) as count FROM service_records WHERE user_id = ?', req.user.id)).count;
  const unreadCount = (await db.getAsync('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', req.user.id)).count;

  res.json({
    code: 200,
    data: {
      ...userInfo,
      service_count: serviceCount,
      unread_notifications: unreadCount,
    },
  });
});

router.get('/archives', authenticate, auditLog('profile', 'get_archives'), async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  const archives = await db.allAsync(`
    SELECT * FROM digital_archives
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, req.user.id, pageSizeNum, offset);

  const total = (await db.getAsync('SELECT COUNT(*) as count FROM digital_archives WHERE user_id = ?', req.user.id)).count;

  if (archives.length === 0) {
    const sampleArchives = [
      { archive_type: '社保缴费凭证', title: '2023年度社保缴费证明', file_url: '/static/archive/social_2023.pdf' },
      { archive_type: '养老金证明', title: '养老金领取资格证明', file_url: '/static/archive/pension.pdf' },
      { archive_type: '劳动合同', title: '劳动合同备案', file_url: '/static/archive/contract.pdf' },
    ];
    for (const a of sampleArchives) {
      await db.runAsync(`
        INSERT INTO digital_archives (user_id, archive_type, title, file_url, file_hash)
        VALUES (?, ?, ?, ?, ?)
      `, req.user.id, a.archive_type, a.title, a.file_url, 'hash_' + Date.now());
    }
    const after = await db.allAsync('SELECT * FROM digital_archives WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', req.user.id, pageSizeNum, offset);
    return res.json({ code: 200, data: { list: after, total: 3, page: 1, pageSize: 10 } });
  }

  res.json({
    code: 200,
    data: {
      list: archives,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.get('/notifications', authenticate, auditLog('profile', 'get_notifications'), async (req, res) => {
  const { page = 1, pageSize = 10, type } = req.query;
  const pageNum = parseInt(page);
  const pageSizeNum = parseInt(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  let countSql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?';
  const params = [req.user.id];

  if (type) {
    sql += ' AND type = ?';
    countSql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, pageSizeNum, offset];

  const notifications = await db.allAsync(sql, ...queryParams);
  const total = (await db.getAsync(countSql, ...params)).count;

  res.json({
    code: 200,
    data: {
      list: notifications,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

router.post('/notifications/:id/read', authenticate, auditLog('profile', 'read_notification'), async (req, res) => {
  const { id } = req.params;
  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', id, req.user.id);
  res.json({ code: 200, message: '已标记为已读' });
});

router.post('/notifications/read-all', authenticate, auditLog('profile', 'read_all_notifications'), async (req, res) => {
  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE user_id = ?', req.user.id);
  res.json({ code: 200, message: '全部已读' });
});

router.get('/authorizations', authenticate, auditLog('profile', 'get_authorizations'), async (req, res) => {
  const authorizations = await db.allAsync(`
    SELECT * FROM service_authorizations
    WHERE user_id = ?
    ORDER BY authorized_at DESC
  `, req.user.id);

  if (authorizations.length === 0) {
    const sampleAuths = [
      { service_type: '电子社保卡', authorized: 1 },
      { service_type: '医保电子凭证', authorized: 1 },
      { service_type: '就业服务', authorized: 0 },
    ];
    for (const a of sampleAuths) {
      await db.runAsync(`
        INSERT INTO service_authorizations (user_id, service_type, authorized, authorized_at)
        VALUES (?, ?, ?, ?)
      `, req.user.id, a.service_type, a.authorized, a.authorized ? new Date().toISOString() : null);
    }
    const after = await db.allAsync('SELECT * FROM service_authorizations WHERE user_id = ?', req.user.id);
    return res.json({ code: 200, data: after });
  }

  res.json({ code: 200, data: authorizations });
});

router.post('/authorizations/:id/toggle', authenticate, auditLog('profile', 'toggle_authorization'), async (req, res) => {
  const { id } = req.params;
  const auth = await db.getAsync('SELECT * FROM service_authorizations WHERE id = ? AND user_id = ?', id, req.user.id);
  if (!auth) {
    return res.status(404).json({ code: 404, message: '授权记录不存在' });
  }
  const newStatus = auth.authorized === 1 ? 0 : 1;
  await db.runAsync('UPDATE service_authorizations SET authorized = ?, authorized_at = ? WHERE id = ?', newStatus, newStatus === 1 ? new Date().toISOString() : null, id);
  res.json({ code: 200, message: newStatus === 1 ? '已授权' : '已取消授权' });
});

router.get('/audit-logs', authenticate, auditLog('profile', 'get_audit_logs'), async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const logs = await db.allAsync(`
    SELECT * FROM audit_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, req.user.id, parseInt(pageSize), offset);

  const total = (await db.getAsync('SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?', req.user.id)).count;

  res.json({
    code: 200,
    data: {
      list: logs,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    },
  });
});

module.exports = router;
