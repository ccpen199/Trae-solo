import express from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../middleware/operationLog';
import { 
  generateSourceHash, 
  generateUUID, 
  generateBatchId,
  validateRequiredFields,
  parseJSON,
  stringifyJSON
} from '../utils';

const router = express.Router();

router.use(authMiddleware());

router.get('/', (req: AuthRequest, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM devices WHERE user_id = ?';
  const params: any[] = [req.user!.id];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(sql);
  const devices = stmt.all(...params);
  
  res.json({ success: true, data: devices });
});

router.get('/:id', (req: AuthRequest, res) => {
  const stmt = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?');
  const device = stmt.get(req.params.id, req.user!.id);
  
  if (!device) {
    return res.status(404).json({ error: '设备不存在' });
  }
  
  res.json({ success: true, data: device });
});

router.post(
  '/bind',
  logOperation('device_bind', 'devices'),
  (req: AuthRequest, res) => {
    const { device_type, device_name, device_uuid } = req.body;
    const missing = validateRequiredFields(req.body, ['device_type', 'device_name', 'device_uuid']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const checkStmt = db.prepare('SELECT * FROM devices WHERE device_uuid = ?');
    const existing = checkStmt.get(device_uuid);
    
    if (existing) {
      return res.status(400).json({ error: '该设备已被绑定' });
    }

    const authToken = generateUUID();
    
    const stmt = db.prepare(`
      INSERT INTO devices (user_id, device_type, device_name, device_uuid, status, auth_token, last_sync_at)
      VALUES (?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(req.user!.id, device_type, device_name, device_uuid, authToken);
    
    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        auth_token: authToken,
        message: '设备绑定成功'
      }
    });
  }
);

router.put(
  '/:id/status',
  logOperation('device_status', 'devices', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { status, reason } = req.body;
    
    const deviceStmt = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?');
    const device = deviceStmt.get(req.params.id, req.user!.id);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    const validStatuses = ['active', 'disconnected', 'revoked', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的设备状态' });
    }

    const stmt = db.prepare(`
      UPDATE devices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(status, req.params.id);

    if (status === 'revoked') {
      const alertStmt = db.prepare(`
        INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status)
        VALUES (?, 'privacy_revoked', 'medium', ?, ?, ?, 'pending')
      `);
      alertStmt.run(
        req.user!.id,
        '设备授权已撤销',
        `设备 ${(device as any).device_name} 的数据授权已被撤销`,
        stringifyJSON({ device_id: req.params.id, reason }),
        'pending'
      );
    }

    res.json({ success: true, message: '设备状态已更新' });
  }
);

router.delete(
  '/:id',
  logOperation('device_unbind', 'devices', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const deviceStmt = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?');
    const device = deviceStmt.get(req.params.id, req.user!.id);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
    stmt.run(req.params.id);

    res.json({ success: true, message: '设备已解绑' });
  }
);

router.post(
  '/sync',
  logOperation('device_sync', 'device_data'),
  (req: AuthRequest, res) => {
    const { device_id, data_points } = req.body;
    const missing = validateRequiredFields(req.body, ['device_id', 'data_points']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const deviceStmt = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?');
    const device = deviceStmt.get(device_id, req.user!.id);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if ((device as any).status === 'revoked') {
      return res.status(403).json({ error: '设备授权已被撤销，无法同步数据' });
    }

    if ((device as any).status === 'suspended') {
      return res.status(403).json({ error: '设备已暂停同步' });
    }

    const batchId = generateBatchId();
    
    const syncBatchStmt = db.prepare(`
      INSERT INTO sync_batches (batch_id, user_id, device_id, total_records, status)
      VALUES (?, ?, ?, ?, 'processing')
    `);
    const batchResult = syncBatchStmt.run(batchId, req.user!.id, device_id, data_points.length);

    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO device_data 
      (user_id, device_id, data_type, data_value, sample_time, source_hash, sync_batch_id, status, anomaly_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const checkStmt = db.prepare(`
      SELECT id FROM device_data WHERE source_hash = ?
    `);

    const transaction = db.transaction((points: any[]) => {
      for (const point of points) {
        try {
          const sourceHash = generateSourceHash(
            req.user!.id,
            device_id,
            point.data_type,
            point.sample_time,
            point.data_value
          );

          const existing = checkStmt.get(sourceHash);
          if (existing) {
            duplicateCount++;
            continue;
          }

          let status = 'normal';
          let anomalyType = null;

          if (point.data_type === 'heart_rate') {
            const hr = parseInt(point.data_value);
            const userStmt = db.prepare('SELECT age FROM users WHERE id = ?');
            const user = userStmt.get(req.user!.id) as any;
            
            const { detectHeartRateAnomaly } = require('../utils');
            const anomaly = detectHeartRateAnomaly(hr, user?.age || 30);
            
            if (anomaly.isAnomaly) {
              status = 'anomalous';
              anomalyType = anomaly.anomalyType;
              
              const alertStmt = db.prepare(`
                INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status, requires_confirmation)
                VALUES (?, 'heart_rate_anomaly', ?, ?, ?, ?, 'pending', ?)
              `);
              alertStmt.run(
                req.user!.id,
                anomaly.severity,
                '心率异常提醒',
                anomaly.message,
                stringifyJSON({ device_id, data_point: point }),
                anomaly.severity === 'critical' || anomaly.severity === 'high' ? 1 : 0
              );
            }
          }

          if (point.data_type === 'track') {
            const trackData = parseJSON(point.data_value);
            if (trackData && trackData.drift_score && trackData.drift_score > 0.8) {
              status = 'anomalous';
              anomalyType = 'track_drift';
              
              const alertStmt = db.prepare(`
                INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status)
                VALUES (?, 'track_drift', 'medium', ?, ?, ?, 'pending')
              `);
              alertStmt.run(
                req.user!.id,
                '运动轨迹漂移',
                '检测到运动轨迹可能存在漂移，请确认数据准确性',
                stringifyJSON({ device_id, drift_score: trackData.drift_score }),
                'pending'
              );
            }
          }

          const result = insertStmt.run(
            req.user!.id,
            device_id,
            point.data_type,
            point.data_value,
            point.sample_time,
            sourceHash,
            batchId,
            status,
            anomalyType
          );

          if (result.changes > 0) {
            successCount++;
          } else {
            duplicateCount++;
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`数据点 ${point.sample_time}: ${err.message}`);
        }
      }
    });

    let batchStatus = 'completed';
    try {
      transaction(data_points);
    } catch (err: any) {
      batchStatus = 'partial';
      errors.push(`事务错误: ${err.message}`);
    }

    if (errorCount > 0 && successCount === 0) {
      batchStatus = 'failed';
    }

    const updateBatchStmt = db.prepare(`
      UPDATE sync_batches 
      SET success_count = ?, duplicate_count = ?, error_count = ?, status = ?, 
          error_message = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateBatchStmt.run(
      successCount,
      duplicateCount,
      errorCount,
      batchStatus,
      errors.length > 0 ? errors.join('; ') : null,
      batchResult.lastInsertRowid
    );

    const updateDeviceStmt = db.prepare(`
      UPDATE devices SET last_sync_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    updateDeviceStmt.run(device_id);

    if ((device as any).status === 'disconnected') {
      const updateStatusStmt = db.prepare(`
        UPDATE devices SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);
      updateStatusStmt.run(device_id);
    }

    res.json({
      success: true,
      data: {
        batch_id: batchId,
        total: data_points.length,
        success: successCount,
        duplicate: duplicateCount,
        error: errorCount,
        status: batchStatus,
        errors: errors.slice(0, 10)
      }
    });
  }
);

router.post(
  '/sync/retry/:batch_id',
  logOperation('sync_retry', 'sync_batches', (req) => {
    const stmt = db.prepare('SELECT id FROM sync_batches WHERE batch_id = ?');
    const r = stmt.get(req.params.batch_id) as any;
    return r?.id;
  }),
  (req: AuthRequest, res) => {
    const batchStmt = db.prepare('SELECT * FROM sync_batches WHERE batch_id = ? AND user_id = ?');
    const batch = batchStmt.get(req.params.batch_id, req.user!.id) as any;
    
    if (!batch) {
      return res.status(404).json({ error: '同步批次不存在' });
    }

    if (batch.status === 'completed') {
      return res.status(400).json({ error: '该批次已成功完成，无需重试' });
    }

    if (batch.retry_count >= 3) {
      return res.status(400).json({ error: '重试次数已达上限（最多3次），请检查数据后手动补录' });
    }

    const dataStmt = db.prepare(`
      SELECT * FROM device_data WHERE sync_batch_id = ? AND status != 'normal'
    `);
    const failedData = dataStmt.all(req.params.batch_id);

    const updateBatchStmt = db.prepare(`
      UPDATE sync_batches SET status = 'retrying', retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateBatchStmt.run(batch.id);

    const newBatchId = generateBatchId();
    const newSyncBatchStmt = db.prepare(`
      INSERT INTO sync_batches (batch_id, user_id, device_id, total_records, status, retry_count)
      VALUES (?, ?, ?, ?, 'processing', ?)
    `);
    const newBatchResult = newSyncBatchStmt.run(
      newBatchId, 
      batch.user_id, 
      batch.device_id, 
      failedData.length,
      batch.retry_count + 1
    );

    res.json({
      success: true,
      data: {
        message: '重试任务已创建',
        original_batch_id: req.params.batch_id,
        new_batch_id: newBatchId,
        retry_count: batch.retry_count + 1,
        records_to_reprocess: failedData.length
      }
    });
  }
);

router.post(
  '/data/:id/revoke',
  logOperation('data_revoke', 'device_data', (req) => parseInt(req.params.id)),
  (req: AuthRequest, res) => {
    const { reason } = req.body;
    
    const dataStmt = db.prepare('SELECT * FROM device_data WHERE id = ? AND user_id = ?');
    const data = dataStmt.get(req.params.id, req.user!.id);
    
    if (!data) {
      return res.status(404).json({ error: '数据不存在' });
    }

    const stmt = db.prepare(`
      UPDATE device_data SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(req.params.id);

    const alertStmt = db.prepare(`
      INSERT INTO alerts (user_id, alert_type, severity, title, message, related_data, status)
      VALUES (?, 'privacy_revoked', 'low', ?, ?, ?, 'pending')
    `);
    alertStmt.run(
      req.user!.id,
      '数据已撤销',
      `用户主动撤销了一条 ${(data as any).data_type} 数据记录`,
      JSON.stringify({ data_id: req.params.id, reason }),
      'pending'
    );

    res.json({ success: true, message: '数据已撤销' });
  }
);

router.post(
  '/data/supplement',
  logOperation('data_supplement', 'device_data'),
  (req: AuthRequest, res) => {
    const { device_id, data_points } = req.body;
    const missing = validateRequiredFields(req.body, ['device_id', 'data_points']);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: `缺少必填字段: ${missing.join(', ')}` });
    }

    const deviceStmt = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?');
    const device = deviceStmt.get(device_id, req.user!.id);
    
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    const batchId = generateBatchId();
    const syncBatchStmt = db.prepare(`
      INSERT INTO sync_batches (batch_id, user_id, device_id, total_records, status)
      VALUES (?, ?, ?, ?, 'processing')
    `);
    syncBatchStmt.run(batchId, req.user!.id, device_id, data_points.length);

    let successCount = 0;
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO device_data 
      (user_id, device_id, data_type, data_value, sample_time, source_hash, sync_batch_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_review')
    `);

    for (const point of data_points) {
      const sourceHash = generateSourceHash(
        req.user!.id,
        device_id,
        point.data_type,
        point.sample_time,
        point.data_value,
        'supplement'
      );

      const result = insertStmt.run(
        req.user!.id,
        device_id,
        point.data_type,
        point.data_value,
        point.sample_time,
        sourceHash,
        batchId
      );

      if (result.changes > 0) {
        successCount++;
      }
    }

    const updateBatchStmt = db.prepare(`
      UPDATE sync_batches 
      SET success_count = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE batch_id = ?
    `);
    updateBatchStmt.run(successCount, batchId);

    res.json({
      success: true,
      data: {
        batch_id: batchId,
        supplemented: successCount,
        status: 'pending_review',
        message: '补录数据已提交，等待审核'
      }
    });
  }
);

router.get('/data/list', (req: AuthRequest, res) => {
  const { data_type, start_time, end_time, page = 1, page_size = 20 } = req.query;
  
  let sql = 'SELECT * FROM device_data WHERE user_id = ?';
  const params: any[] = [req.user!.id];
  
  if (data_type) {
    sql += ' AND data_type = ?';
    params.push(data_type);
  }
  
  if (start_time) {
    sql += ' AND sample_time >= ?';
    params.push(start_time);
  }
  
  if (end_time) {
    sql += ' AND sample_time <= ?';
    params.push(end_time);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...params) as { total: number };
  
  sql += ' ORDER BY sample_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));
  
  const stmt = db.prepare(sql);
  const data = stmt.all(...params);
  
  res.json({
    success: true,
    data: {
      list: data,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

router.get('/data/sync-history', (req: AuthRequest, res) => {
  const { page = 1, page_size = 20 } = req.query;
  
  const countSql = 'SELECT COUNT(*) as total FROM sync_batches WHERE user_id = ?';
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(req.user!.id) as { total: number };
  
  const sql = `
    SELECT sb.*, d.device_name 
    FROM sync_batches sb 
    LEFT JOIN devices d ON sb.device_id = d.id 
    WHERE sb.user_id = ? 
    ORDER BY sb.created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const stmt = db.prepare(sql);
  const data = stmt.all(
    req.user!.id,
    parseInt(page_size as string),
    (parseInt(page as string) - 1) * parseInt(page_size as string)
  );
  
  res.json({
    success: true,
    data: {
      list: data,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

export default router;
