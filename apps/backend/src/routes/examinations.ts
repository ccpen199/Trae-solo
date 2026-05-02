import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken, requireRoles } from '../middleware/auth';
import { triageEngine } from '../engines/triage-engine';
import { riskModelEngine } from '../engines/risk-model';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/:departmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const { status } = req.query;

    let queryText = `
      SELECT qi.*, p.phone as patient_phone, p.id_card as patient_id_card
      FROM queue_items qi
      LEFT JOIN patients p ON qi.patient_id = p.id
      WHERE qi.department_id = $1
    `;
    const params: unknown[] = [departmentId];

    if (status) {
      queryText += ` AND qi.status = $2`;
      params.push(status);
    } else {
      queryText += ` AND qi.status IN ('waiting', 'in_examination')`;
    }

    queryText += ` ORDER BY qi.queue_position ASC`;

    const result = await query(queryText, params);

    const queueItems = result.rows.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      patientIdCard: row.patient_id_card,
      departmentId: row.department_id,
      orderId: row.order_id,
      reservationCode: row.reservation_code,
      status: row.status,
      queuePosition: row.queue_position,
      estimatedWaitTime: row.estimated_wait_time,
      assignedDoctorId: row.assigned_doctor_id,
      joinedAt: row.joined_at,
      calledAt: row.called_at,
      completedAt: row.completed_at,
    }));

    res.json(queueItems);
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: '获取队列信息失败' });
  }
});

router.post('/:departmentId/call-next', authenticateToken, requireRoles('department_doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    const queueItem = await triageEngine.callNextPatient(departmentId);

    if (!queueItem) {
      return res.json({ message: '队列中没有等待的患者' });
    }

    await query(
      `UPDATE order_items 
       SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE order_id = $1 AND department_id = $2`,
      [queueItem.orderId, departmentId]
    );

    res.json({
      message: '叫号成功',
      patient: queueItem,
    });
  } catch (error) {
    console.error('Call next patient error:', error);
    res.status(500).json({ message: '叫号失败' });
  }
});

router.post('/:queueItemId/submit', authenticateToken, requireRoles('department_doctor', 'admin'), async (req: Request, res: Response) => {
  try {
    const { queueItemId } = req.params;
    const { values, conclusion } = req.body;

    if (!values || values.length === 0) {
      return res.status(400).json({ message: '请提供检查结果' });
    }

    const queueResult = await query(
      `SELECT qi.*, oi.id as order_item_id, oi.item_name, oi.department_id
       FROM queue_items qi
       LEFT JOIN order_items oi ON qi.order_id = oi.order_id AND qi.department_id = oi.department_id
       WHERE qi.id = $1`,
      [queueItemId]
    );

    if (queueResult.rows.length === 0) {
      return res.status(404).json({ message: '排队记录不存在' });
    }

    const queueItem = queueResult.rows[0];
    const doctorId = req.user?.doctorId;

    let hasAbnormal = false;
    let hasCrisis = false;

    for (const value of values) {
      const crisisCheck = await riskModelEngine.checkCrisisValue(value.name, value.value);
      if (crisisCheck.isCrisis) {
        hasCrisis = true;
        value.isAbnormal = true;
        await this.createCrisisNotification(queueItem.patient_id, queueItem.patient_name, value.name, value.value, crisisCheck.message || '');
      } else if (value.isAbnormal) {
        hasAbnormal = true;
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resultId = uuidv4();
      await client.query(
        `INSERT INTO examination_results (
          id, order_item_id, patient_id, doctor_id, conclusion, 
          is_abnormal, is_crisis, exam_time
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          resultId,
          queueItem.order_item_id,
          queueItem.patient_id,
          doctorId,
          conclusion,
          hasAbnormal,
          hasCrisis,
          new Date(),
        ]
      );

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

      const newStatus = hasCrisis ? 'abnormal' : 'completed';
      await client.query(
        `UPDATE order_items 
         SET status = $1, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [newStatus, queueItem.order_item_id]
      );

      await triageEngine.completeExamination(queueItemId);

      await this.checkOrderCompletion(queueItem.order_id);

      await client.query('COMMIT');

      res.json({
        message: '提交检查结果成功',
        resultId,
        hasAbnormal,
        hasCrisis,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Submit examination error:', error);
    res.status(500).json({ message: '提交检查结果失败' });
  }
});

router.post('/:queueItemId/skip', authenticateToken, requireRoles('department_doctor', 'admin', 'reception'), async (req: Request, res: Response) => {
  try {
    const { queueItemId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE queue_items 
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [queueItemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '排队记录不存在' });
    }

    res.json({ message: '跳过该患者成功', reason });
  } catch (error) {
    console.error('Skip patient error:', error);
    res.status(500).json({ message: '跳过患者失败' });
  }
});

router.get('/order/:orderId/progress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const result = await query(
      `SELECT oi.*, d.name as department_name, d.code as department_code,
              er.conclusion, er.is_abnormal, er.is_crisis
       FROM order_items oi
       LEFT JOIN departments d ON oi.department_id = d.id
       LEFT JOIN examination_results er ON oi.id = er.order_item_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [orderId]
    );

    const items = result.rows.map((row: any) => ({
      id: row.id,
      itemName: row.item_name,
      departmentId: row.department_id,
      departmentName: row.department_name,
      departmentCode: row.department_code,
      itemType: row.item_type,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      conclusion: row.conclusion,
      isAbnormal: row.is_abnormal,
      isCrisis: row.is_crisis,
    }));

    const totalItems = items.length;
    const completedItems = items.filter(i => i.status === 'completed' || i.status === 'abnormal').length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const status = completedItems === totalItems 
      ? 'completed' 
      : completedItems > 0 
        ? 'in_progress' 
        : 'pending';

    res.json({
      orderId,
      totalItems,
      completedItems,
      progress,
      status,
      items,
    });
  } catch (error) {
    console.error('Get order progress error:', error);
    res.status(500).json({ message: '获取检查进度失败' });
  }
});

async function createCrisisNotification(
  this: any,
  patientId: string,
  patientName: string,
  itemName: string,
  value: string,
  message: string
): Promise<void> {
  await query(
    `INSERT INTO notifications (
      id, type, target_type, target_id, title, content, related_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      'crisis_value',
      'admin',
      '0',
      `【危急值预警】${patientName}`,
      `患者${patientName}的${itemName}检测结果异常：${value}。${message}`,
      patientId,
    ]
  );
}

async function checkOrderCompletion(orderId: string): Promise<void> {
  const result = await query(
    `SELECT COUNT(*) as total,
            COUNT(CASE WHEN status IN ('completed', 'abnormal') THEN 1 END) as completed
     FROM order_items
     WHERE order_id = $1`,
    [orderId]
  );

  const { total, completed } = result.rows[0];

  if (total === completed) {
    await query(
      `UPDATE examination_orders 
       SET status = 'examination_completed', updated_at = NOW() 
       WHERE id = $1`,
      [orderId]
    );

    await query(
      `UPDATE reservations 
       SET status = 'examination_completed', updated_at = NOW() 
       WHERE order_id = $1`,
      [orderId]
    );
  }
}

import { pool } from '../database';
export default router;
