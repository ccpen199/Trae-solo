import { Router, Request, Response } from 'express';
import { db } from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SV${dateStr}${random}`;
}

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { status, page = '1', pageSize = '10' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let countSql = 'SELECT COUNT(*) as total FROM service_orders WHERE user_id = ?';
    let listSql = 'SELECT * FROM service_orders WHERE user_id = ?';
    const params: any[] = [req.user!.id];

    if (status) {
      countSql += ' AND status = ?';
      listSql += ' AND status = ?';
      params.push(status);
    }

    listSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = (db.prepare(countSql).get(...params) as any).total;
    const orders = db.prepare(listSql).all(...params, Number(pageSize), offset);

    res.json({
      success: true,
      data: { list: orders, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { device_id, type, appointment_time, fault_description } = req.body;
    if (!device_id || !type) {
      return res.status(400).json({ success: false, message: '缺少必填字段device_id和type' });
    }

    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(device_id, req.user!.id) as any;
    if (!device) {
      return res.status(404).json({ success: false, message: '设备不存在' });
    }

    const order_no = generateOrderNo();
    const result = db.prepare(
      'INSERT INTO service_orders (order_no, device_id, user_id, type, status, appointment_time, fault_description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(order_no, device_id, req.user!.id, type, 'pending', appointment_time || null, fault_description || null);

    const order = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!order) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    const { status, progress, engineer_id } = req.body;
    const validTransitions: Record<string, string[]> = {
      pending: ['diagnosing', 'cancelled'],
      diagnosing: ['repairing', 'cancelled'],
      repairing: ['completed', 'cancelled']
    };

    if (status && validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({ success: false, message: `无法从 ${order.status} 转换为 ${status}` });
    }

    db.prepare(
      `UPDATE service_orders SET status = COALESCE(?, status), progress = COALESCE(?, progress), engineer_id = COALESCE(?, engineer_id) WHERE id = ?`
    ).run(status || null, progress || null, engineer_id || null, id);

    const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/diagnose', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!order) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(order.device_id) as any;
    const metrics = db.prepare('SELECT * FROM device_metrics WHERE device_id = ? ORDER BY timestamp DESC LIMIT 10').all(order.device_id) as any[];

    const faultKeywords: Record<string, string[]> = {
      air_conditioner: ['不制冷', '噪音异常', '漏水'],
      washer: ['不脱水', '异响', '门锁故障'],
      fridge: ['不制冷', '温度异常', '异响'],
      tv: ['无信号', '花屏', '遥控失灵']
    };

    const possibleFaults = faultKeywords[device?.type] || ['功能异常', '运行异常'];
    const diagnosisResult = JSON.stringify({
      device_type: device?.type,
      device_brand: device?.brand,
      possible_faults: possibleFaults,
      metrics_summary: metrics.map(m => ({ key: m.metric_key, value: m.metric_value, time: m.timestamp })),
      confidence: 0.85,
      recommendation: '建议安排工程师上门检修，预计维修时间1-2小时'
    });

    db.prepare('UPDATE service_orders SET status = ?, diagnosis_result = ? WHERE id = ?').run('diagnosing', diagnosisResult, id);

    const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(id) as any;
    res.json({
      success: true,
      data: { ...updated, diagnosis_result: JSON.parse(diagnosisResult) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/extend-warranty', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM service_orders WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!order) {
      return res.status(404).json({ success: false, message: '工单不存在' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只有已完成的工单才能延保' });
    }

    db.prepare('UPDATE service_orders SET extended_warranty = 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM service_orders WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
