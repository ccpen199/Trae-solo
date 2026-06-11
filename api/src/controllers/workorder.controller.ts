import { Request, Response } from 'express';
import db from '../database/connection.js';
import type { CreateWorkOrderRequest, UpdateWorkOrderStatusRequest, WorkOrder } from '../../../shared/types.js';

export async function getWorkOrders(req: Request & { user?: any }, res: Response) {
  try {
    const { status, type, limit = 20, offset = 0 } = req.query;
    const isProperty = req.user.role === 'property';

    let query = 'SELECT wo.*, u.name as user_name, u2.name as assignee_name, h.building, h.unit, h.room_number FROM work_orders wo';
    query += ' LEFT JOIN users u ON wo.user_id = u.id';
    query += ' LEFT JOIN users u2 ON wo.assignee_id = u2.id';
    query += ' LEFT JOIN houses h ON wo.house_id = h.id';

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (!isProperty) {
      whereClauses.push('wo.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      whereClauses.push('wo.status = ?');
      params.push(status);
    }

    if (type) {
      whereClauses.push('wo.type = ?');
      params.push(type);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY wo.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const workOrders = db.prepare(query).all(...params) as WorkOrder[];

    const countQuery = 'SELECT COUNT(*) as count FROM work_orders wo' + (whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '');
    const total = db.prepare(countQuery).get(...params.slice(0, -2)) as { count: number };

    res.json({ success: true, data: { workOrders, total: total.count } });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ success: false, error: '获取工单列表失败' });
  }
}

export async function getWorkOrderDetail(req: Request & { user?: any }, res: Response) {
  try {
    const { id } = req.params;

    const workOrder = db.prepare(`
      SELECT wo.*, u.name as user_name, u.phone as user_phone, 
             u2.name as assignee_name, h.building, h.unit, h.room_number,
             h.area as house_area
      FROM work_orders wo
      LEFT JOIN users u ON wo.user_id = u.id
      LEFT JOIN users u2 ON wo.assignee_id = u2.id
      LEFT JOIN houses h ON wo.house_id = h.id
      WHERE wo.id = ?
    `).get(id) as (WorkOrder & { user_name: string; user_phone: string; assignee_name: string; building: string; unit: string; room_number: string; house_area: number }) | undefined;

    if (!workOrder) {
      return res.status(404).json({ success: false, error: '工单不存在' });
    }

    if (req.user.role !== 'property' && workOrder.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: '无权查看此工单' });
    }

    const logs = db.prepare(`
      SELECT wol.*, u.name as operator_name
      FROM work_order_logs wol
      LEFT JOIN users u ON wol.operator_id = u.id
      WHERE wol.work_order_id = ?
      ORDER BY wol.created_at DESC
    `).all(id);

    const evaluation = db.prepare('SELECT * FROM work_order_evaluations WHERE work_order_id = ?').get(id);

    res.json({ success: true, data: { workOrder, logs, evaluation } });
  } catch (error) {
    console.error('Get work order detail error:', error);
    res.status(500).json({ success: false, error: '获取工单详情失败' });
  }
}

export async function createWorkOrder(req: Request & { user?: any }, res: Response) {
  try {
    const { type, title, description, location, images, priority }: CreateWorkOrderRequest = req.body;

    if (!type || !title || !description || !location) {
      return res.status(400).json({ success: false, error: '请填写完整的工单信息' });
    }

    const userHouses = db.prepare('SELECT id FROM houses WHERE owner_id = ?').all(req.user.id) as { id: number }[];
    const houseId = userHouses.length > 0 ? userHouses[0].id : null;

    const result = db.prepare(`
      INSERT INTO work_orders (user_id, house_id, type, title, description, location, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      houseId,
      type,
      title,
      description,
      location,
      priority || 'medium'
    );

    db.prepare(`
      INSERT INTO work_order_logs (work_order_id, operator_id, status, remark)
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, req.user.id, 'pending', '工单已创建');

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: workOrder, message: '工单提交成功' });
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ success: false, error: '创建工单失败' });
  }
}

export async function updateWorkOrderStatus(req: Request & { user?: any }, res: Response) {
  try {
    const { id } = req.params;
    const { status, remark }: UpdateWorkOrderStatusRequest = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: '请提供状态' });
    }

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as WorkOrder | undefined;

    if (!workOrder) {
      return res.status(404).json({ success: false, error: '工单不存在' });
    }

    if (req.user.role !== 'property' && workOrder.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: '无权操作此工单' });
    }

    db.prepare(`
      UPDATE work_orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);

    db.prepare(`
      INSERT INTO work_order_logs (work_order_id, operator_id, status, remark)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, status, remark || '');

    res.json({ success: true, message: '工单状态更新成功' });
  } catch (error) {
    console.error('Update work order status error:', error);
    res.status(500).json({ success: false, error: '更新工单状态失败' });
  }
}

export async function evaluateWorkOrder(req: Request & { user?: any }, res: Response) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ success: false, error: '请提供评分' });
    }

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id) as WorkOrder | undefined;

    if (!workOrder) {
      return res.status(404).json({ success: false, error: '工单不存在' });
    }

    if (workOrder.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: '无权评价此工单' });
    }

    const existingEval = db.prepare('SELECT * FROM work_order_evaluations WHERE work_order_id = ?').get(id);
    if (existingEval) {
      return res.status(400).json({ success: false, error: '此工单已评价' });
    }

    db.prepare(`
      INSERT INTO work_order_evaluations (work_order_id, rating, comment)
      VALUES (?, ?, ?)
    `).run(id, rating, comment || '');

    db.prepare(`
      UPDATE work_orders 
      SET status = 'closed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    res.json({ success: true, message: '评价提交成功' });
  } catch (error) {
    console.error('Evaluate work order error:', error);
    res.status(500).json({ success: false, error: '评价失败' });
  }
}

export default { getWorkOrders, getWorkOrderDetail, createWorkOrder, updateWorkOrderStatus, evaluateWorkOrder };
