const express = require('express');
const router = express.Router();
const { query, getOne, runTransaction } = require('../utils/db');
const { success, error, paginate, logOperation } = require('../utils/response');
const { auth, requireRole } = require('../middleware/auth');

router.get('/centers', auth, (req, res) => {
  const { syncStatus } = req.query;
  let sql = 'SELECT * FROM offline_centers WHERE 1=1';
  const params = [];
  if (syncStatus && syncStatus !== 'all') {
    sql += ' AND sync_status = ?';
    params.push(syncStatus);
  }
  sql += ' ORDER BY region, center_name';
  const list = query(sql, params);
  res.json(success(list));
});

router.get('/centers/:id', auth, (req, res) => {
  const center = getOne('SELECT * FROM offline_centers WHERE id = ?', [req.params.id]);
  if (!center) {
    return res.json(error('便民服务中心不存在', 404));
  }
  const pendingCount = getOne(
    'SELECT COUNT(*) as count FROM offline_records WHERE center_id = ? AND sync_status = \'pending\'',
    [req.params.id]
  );
  const todaySynced = getOne(
    `SELECT COUNT(*) as count FROM offline_records 
     WHERE center_id = ? AND sync_status = 'synced' AND date(sync_time) = date('now')`,
    [req.params.id]
  );
  res.json(success({
    ...center,
    pendingCount: pendingCount?.count || 0,
    todaySynced: todaySynced?.count || 0
  }));
});

router.get('/records', auth, (req, res) => {
  const { page = 1, pageSize = 10, centerId, syncStatus, recordType } = req.query;
  let sql = `SELECT ors.*, oc.center_name, oc.center_code 
             FROM offline_records ors 
             LEFT JOIN offline_centers oc ON ors.center_id = oc.id 
             WHERE 1=1`;
  const params = [];
  if (centerId) {
    sql += ' AND ors.center_id = ?';
    params.push(centerId);
  }
  if (syncStatus && syncStatus !== 'all') {
    sql += ' AND ors.sync_status = ?';
    params.push(syncStatus);
  }
  if (recordType && recordType !== 'all') {
    sql += ' AND ors.record_type = ?';
    params.push(recordType);
  }
  sql += ' ORDER BY ors.created_at DESC';
  const list = query(sql, params);
  
  list.forEach(item => {
    try {
      item.record_data = JSON.parse(item.record_data);
    } catch (e) {}
  });
  
  res.json(success(paginate(list, page, pageSize)));
});

router.post('/offline-submit', (req, res) => {
  const { centerCode, records } = req.body;
  if (!centerCode || !records || records.length === 0) {
    return res.json(error('中心编码和记录不能为空', 400));
  }
  
  const center = getOne('SELECT * FROM offline_centers WHERE center_code = ?', [centerCode]);
  if (!center) {
    return res.json(error('便民服务中心不存在', 404));
  }
  
  const batchNo = `BATCH${Date.now()}`;
  const insertSql = `
    INSERT INTO offline_records
    (center_id, record_type, record_data, offline_time, sync_status, sync_batch_no)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `;
  
  runTransaction(() => {
    records.forEach(rec => {
      query(
        insertSql,
        [
          center.id,
          rec.recordType,
          JSON.stringify(rec.recordData),
          rec.offlineTime || new Date().toISOString(),
          batchNo
        ]
      );
    });
  });
  
  query(
    'UPDATE offline_centers SET last_sync_time = CURRENT_TIMESTAMP, sync_status = \'online\' WHERE id = ?',
    [center.id]
  );
  
  res.json(success({
    batchNo,
    count: records.length,
    message: '离线数据提交成功，等待同步处理'
  }));
});

router.post('/sync', auth, requireRole('admin'), (req, res) => {
  const { centerId, recordIds } = req.body;
  if (!centerId && !recordIds) {
    return res.json(error('请指定中心或记录ID', 400));
  }
  
  let records;
  if (recordIds && recordIds.length > 0) {
    records = query(
      'SELECT * FROM offline_records WHERE id IN (' + recordIds.map(() => '?').join(',') + ') AND sync_status = \'pending\'',
      recordIds
    );
  } else {
    records = query(
      'SELECT * FROM offline_records WHERE center_id = ? AND sync_status = \'pending\' ORDER BY created_at',
      [centerId]
    );
  }
  
  if (records.length === 0) {
    return res.json(success({ synced: 0, message: '没有待同步记录' }));
  }
  
  const syncedIds = [];
  const errors = [];
  
  records.forEach(rec => {
    try {
      const data = JSON.parse(rec.record_data);
      let syncSuccess = true;
      
      switch (rec.record_type) {
        case 'qualification_verify':
          if (data.idCard && data.name) {
            const user = getOne('SELECT * FROM users WHERE id_card = ?', [data.idCard]);
            if (user) {
              query(
                `INSERT INTO qualification_verifications
                 (user_id, id_card, name, method, biometric_score, behavior_score, confidence, result, remark)
                 VALUES (?, ?, ?, 'combined', 0.88, 0.85, 0.865, 'pass', '便民中心离线认证')`,
                [user.id, data.idCard, data.name]
              );
            } else {
              syncSuccess = false;
            }
          }
          break;
        case 'card_apply':
          if (data.idCard && data.name) {
            const user = getOne('SELECT * FROM users WHERE id_card = ?', [data.idCard]);
            if (user) {
              query(
                `INSERT INTO card_operations
                 (card_id, user_id, operation_type, reason, status, progress, tracking_no)
                 VALUES ((SELECT id FROM social_cards WHERE user_id = ? LIMIT 1), ?, 'replace', '便民中心申请', 'pending', 10, ?)`,
                [user.id, user.id, `BK${rec.id}${Date.now()}`]
              );
            } else {
              syncSuccess = false;
            }
          }
          break;
        case 'payment':
          if (data.idCard && data.amount) {
            const user = getOne('SELECT * FROM users WHERE id_card = ?', [data.idCard]);
            if (user) {
              query(
                `INSERT INTO insurance_payments
                 (user_id, social_card_no, merchant_id, merchant_name, merchant_type, total_amount,
                  insurance_payment, personal_payment, payment_status, transaction_no)
                 VALUES (?, ?, 1, '乡镇便民中心', 'pharmacy', ?, ?, ?, 'completed', ?)`,
                [
                  user.id,
                  user.social_card_no,
                  data.amount,
                  Math.floor(data.amount * 0.45),
                  Math.ceil(data.amount * 0.55),
                  `PAY${rec.id}${Date.now()}`
                ]
              );
            } else {
              syncSuccess = false;
            }
          }
          break;
        default:
          syncSuccess = true;
      }
      
      if (syncSuccess) {
        query(
          'UPDATE offline_records SET sync_status = \'synced\', sync_time = CURRENT_TIMESTAMP WHERE id = ?',
          [rec.id]
        );
        syncedIds.push(rec.id);
      } else {
        errors.push({ id: rec.id, error: '数据同步失败，用户信息不匹配' });
      }
    } catch (e) {
      errors.push({ id: rec.id, error: e.message });
    }
  });
  
  query(
    'UPDATE offline_centers SET last_sync_time = CURRENT_TIMESTAMP, sync_status = \'online\' WHERE id = ?',
    [records[0].center_id]
  );
  
  logOperation(
    { query },
    req.user.userId,
    req.user.userType,
    'offline_sync',
    `离线同步：中心ID=${centerId || '多中心'}，成功${syncedIds.length}条，失败${errors.length}条`,
    req.ip
  );
  
  res.json(success({
    synced: syncedIds.length,
    failed: errors.length,
    syncedIds,
    errors,
    message: `同步完成，成功${syncedIds.length}条，失败${errors.length}条`
  }));
});

router.get('/sync-history', auth, (req, res) => {
  const { page = 1, pageSize = 10, centerId } = req.query;
  let sql = `
    SELECT sync_batch_no, center_id, COUNT(*) as record_count,
           MIN(created_at) as offline_time,
           MAX(sync_time) as sync_time,
           SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END) as synced_count
    FROM offline_records
    WHERE sync_batch_no IS NOT NULL
  `;
  const params = [];
  if (centerId) {
    sql += ' AND center_id = ?';
    params.push(centerId);
  }
  sql += ' GROUP BY sync_batch_no, center_id ORDER BY sync_time DESC';
  const list = query(sql, params);
  
  res.json(success(paginate(list, page, pageSize)));
});

router.get('/statistics', auth, (req, res) => {
  const totalCenters = getOne('SELECT COUNT(*) as count FROM offline_centers').count;
  const onlineCenters = getOne('SELECT COUNT(*) as count FROM offline_centers WHERE sync_status = \'online\'').count;
  const pendingRecords = getOne('SELECT COUNT(*) as count FROM offline_records WHERE sync_status = \'pending\'').count;
  const todaySynced = getOne(`SELECT COUNT(*) as count FROM offline_records WHERE sync_status = 'synced' AND date(sync_time) = date('now')`).count;
  
  const byType = query(`
    SELECT record_type, COUNT(*) as total,
           SUM(CASE WHEN sync_status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM offline_records
    GROUP BY record_type
  `);
  
  res.json(success({
    totalCenters,
    onlineCenters,
    offlineCenters: totalCenters - onlineCenters,
    pendingRecords,
    todaySynced,
    byType
  }));
});

router.post('/heartbeat', (req, res) => {
  const { centerCode, status, pendingCount } = req.body;
  if (!centerCode) {
    return res.json(error('中心编码不能为空', 400));
  }
  query(
    'UPDATE offline_centers SET last_sync_time = CURRENT_TIMESTAMP, sync_status = ? WHERE center_code = ?',
    [status || 'online', centerCode]
  );
  res.json(success({ message: '心跳上报成功', serverTime: new Date().toISOString() }));
});

module.exports = router;
