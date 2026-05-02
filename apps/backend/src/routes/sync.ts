import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { deviceId, records } = req.body;

    if (!deviceId || !records || records.length === 0) {
      return res.status(400).json({ message: '请提供设备ID和同步记录' });
    }

    const results = [];

    for (const record of records) {
      const syncRecord = {
        id: uuidv4(),
        deviceId,
        operation: record.operation,
        entity: record.entity,
        localId: record.localId,
        data: record.data,
        status: 'pending' as const,
        attempts: 0,
        createdAt: new Date(),
      };

      try {
        const processed = await this.processSyncRecord(syncRecord, req);
        results.push({
          localId: record.localId,
          success: true,
          serverId: processed.serverId,
        });

        await query(
          `INSERT INTO offline_sync_records (
            id, device_id, operation, entity, local_id, data, status, synced_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            deviceId,
            record.operation,
            record.entity,
            record.localId,
            JSON.stringify(record.data),
            'synced',
            new Date(),
          ]
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        results.push({
          localId: record.localId,
          success: false,
          error: errorMessage,
        });

        await query(
          `INSERT INTO offline_sync_records (
            id, device_id, operation, entity, local_id, data, status, attempts, error_message
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            uuidv4(),
            deviceId,
            record.operation,
            record.entity,
            record.localId,
            JSON.stringify(record.data),
            'failed',
            1,
            errorMessage,
          ]
        );
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    res.json({
      message: `同步完成：成功${successCount}条，失败${failedCount}条`,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: '同步失败' });
  }
});

router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.query;

    let queryText = `SELECT * FROM offline_sync_records WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (deviceId) {
      queryText += ` AND device_id = $${paramIndex++}`;
      params.push(deviceId);
    }

    queryText += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await query(queryText, params);

    const syncRecords = result.rows.map((row: any) => ({
      id: row.id,
      deviceId: row.device_id,
      operation: row.operation,
      entity: row.entity,
      localId: row.local_id,
      data: row.data,
      status: row.status,
      attempts: row.attempts,
      errorMessage: row.error_message,
      syncedAt: row.synced_at,
      createdAt: row.created_at,
    }));

    const pendingResult = await query(
      `SELECT COUNT(*) as count FROM offline_sync_records WHERE status = 'pending'`
    );

    const failedResult = await query(
      `SELECT COUNT(*) as count FROM offline_sync_records WHERE status = 'failed'`
    );

    res.json({
      records: syncRecords,
      statistics: {
        pending: parseInt(pendingResult.rows[0].count, 10),
        failed: parseInt(failedResult.rows[0].count, 10),
      },
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ message: '获取同步状态失败' });
  }
});

router.post('/retry/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM offline_sync_records WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '同步记录不存在' });
    }

    const record = result.rows[0];

    if (record.status === 'synced') {
      return res.json({ message: '该记录已同步成功' });
    }

    try {
      const syncRecord = {
        id: record.id,
        deviceId: record.device_id,
        operation: record.operation,
        entity: record.entity,
        localId: record.local_id,
        data: record.data,
        status: 'pending' as const,
        attempts: record.attempts + 1,
        createdAt: record.created_at,
      };

      const processed = await this.processSyncRecord(syncRecord, req);

      await query(
        `UPDATE offline_sync_records 
         SET status = 'synced', attempts = $1, error_message = NULL, synced_at = $2 
         WHERE id = $3`,
        [record.attempts + 1, new Date(), id]
      );

      res.json({
        message: '重试成功',
        serverId: processed.serverId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      await query(
        `UPDATE offline_sync_records 
         SET status = 'failed', attempts = $1, error_message = $2 
         WHERE id = $3`,
        [record.attempts + 1, errorMessage, id]
      );

      res.status(500).json({
        message: '重试失败',
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('Retry sync error:', error);
    res.status(500).json({ message: '重试同步失败' });
  }
});

async function processSyncRecord(
  this: any,
  record: {
    id: string;
    deviceId: string;
    operation: string;
    entity: string;
    localId: string;
    data: Record<string, unknown>;
    status: 'pending' | 'synced' | 'failed';
    attempts: number;
    createdAt: Date;
  },
  req: Request
): Promise<{ serverId: string }> {
  const { operation, entity, data } = record;

  switch (entity) {
    case 'examination_result':
      return await this.syncExaminationResult(data, req);
    case 'patient':
      return await this.syncPatient(data, req);
    default:
      throw new Error(`不支持的实体类型: ${entity}`);
  }
}

async function syncExaminationResult(
  this: any,
  data: Record<string, unknown>,
  req: Request
): Promise<{ serverId: string }> {
  const { orderItemId, patientId, values, conclusion } = data as any;

  const existingResult = await query(
    `SELECT id FROM examination_results WHERE order_item_id = $1`,
    [orderItemId]
  );

  if (existingResult.rows.length > 0) {
    return { serverId: existingResult.rows[0].id };
  }

  const doctorId = req.user?.doctorId;
  const resultId = uuidv4();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO examination_results (
        id, order_item_id, patient_id, doctor_id, conclusion, exam_time
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        resultId,
        orderItemId,
        patientId,
        doctorId,
        conclusion,
        new Date(),
      ]
    );

    if (values && values.length > 0) {
      for (const value of values) {
        await client.query(
          `INSERT INTO result_values (
            id, result_id, name, value, unit, normal_range, is_abnormal
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uuidv4(),
            resultId,
            value.name,
            value.value,
            value.unit || '',
            value.normalRange || '',
            value.isAbnormal || false,
          ]
        );
      }
    }

    await client.query(
      `UPDATE order_items SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [orderItemId]
    );

    await client.query('COMMIT');
    return { serverId: resultId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function syncPatient(
  this: any,
  data: Record<string, unknown>,
  req: Request
): Promise<{ serverId: string }> {
  const { name, gender, birthDate, idCard, phone, email, address } = data as any;

  const existingPatient = await query(
    `SELECT id FROM patients WHERE id_card = $1`,
    [idCard]
  );

  if (existingPatient.rows.length > 0) {
    return { serverId: existingPatient.rows[0].id };
  }

  const patientId = uuidv4();

  await query(
    `INSERT INTO patients (
      id, name, gender, birth_date, id_card, phone, email, address
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      patientId,
      name,
      gender,
      new Date(birthDate),
      idCard,
      phone,
      email,
      address,
    ]
  );

  return { serverId: patientId };
}

import { pool } from '../database';
export default router;
