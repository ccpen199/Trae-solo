import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '../types';
import {
  pageResult,
  parsePage,
  serializeWorkOrder,
  toDbWorkOrderStatus,
} from '../serializers';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const { status, area } = req.query;
  const { page, pageSize } = parsePage(req);
  const db = getDb();
  const dbStatus = toDbWorkOrderStatus(status);

  let sql = `
    SELECT w.*, d.name as deviceName, d.location as deviceLocation, d.areaId as areaId,
           u1.nickname as reporterName, u2.nickname as handlerName
    FROM workorders w
    LEFT JOIN devices d ON w.deviceId = d.id
    LEFT JOIN users u1 ON w.reporterId = u1.id
    LEFT JOIN users u2 ON w.handlerId = u2.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (dbStatus) {
    sql += ' AND w.status = ?';
    params.push(dbStatus);
  }
  if (area) {
    sql += ' AND d.areaId = ?';
    params.push(area);
  }

  if (req.user?.role === 'resident') {
    sql += ' AND w.reporterId = ?';
    params.push(req.user.userId);
  }

  sql += ' ORDER BY w.createdAt DESC LIMIT 100';
  const workOrders = db.prepare(sql).all(...params).map(serializeWorkOrder);

  res.json(pageResult(workOrders, page, pageSize, workOrders.length));
});

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未认证' });
    return;
  }

  const { title, description, priority } = req.body;
  let { deviceId, type } = req.body;

  if (!description && !title) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const db = getDb();
  if (!deviceId) {
    const firstDevice = db.prepare('SELECT id FROM devices ORDER BY name ASC LIMIT 1').get() as { id: string } | undefined;
    deviceId = firstDevice?.id;
  }
  type = type || 'repair';

  if (!deviceId) {
    res.status(400).json({ error: '缺少关联设备' });
    return;
  }

  const validTypes: WorkOrderType[] = ['repair', 'maintenance', 'complaint'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: '无效的工单类型' });
    return;
  }

  const validPriorities: WorkOrderPriority[] = ['low', 'medium', 'high', 'urgent'];
  const finalPriority = validPriorities.includes(priority) ? priority : 'medium';

  const id = uuidv4();
  const now = new Date().toISOString();
  const status: WorkOrderStatus = 'pending';
  const finalDescription = description || title;

  db.prepare(`
    INSERT INTO workorders (id, deviceId, reporterId, handlerId, type, description, status, priority, createdAt, resolvedAt)
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL)
  `).run(id, deviceId, req.user.userId, type, finalDescription, status, finalPriority, now);

  const workOrder = db.prepare(`
    SELECT w.*, d.name as deviceName, u.nickname as reporterName
    FROM workorders w
    LEFT JOIN devices d ON w.deviceId = d.id
    LEFT JOIN users u ON w.reporterId = u.id
    WHERE w.id = ?
  `).get(id) as Record<string, unknown>;

  res.status(201).json(serializeWorkOrder({ ...workOrder, title }));
});

function updateWorkOrder(req: Request, res: Response): void {
  const { description } = req.body;
  const status = toDbWorkOrderStatus(req.body.status);

  const db = getDb();
  const existing = db.prepare('SELECT * FROM workorders WHERE id = ?').get(req.params.id) as WorkOrder | undefined;

  if (!existing) {
    res.status(404).json({ error: '工单不存在' });
    return;
  }

  if (status) {
    const validStatuses: WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'resolved', 'closed'];
    if (!validStatuses.includes(status as WorkOrderStatus)) {
      res.status(400).json({ error: '无效的工单状态' });
      return;
    }
  }

  let resolvedAt = existing.resolvedAt;
  if (status === 'resolved' || status === 'closed') {
    resolvedAt = new Date().toISOString();
  }

  db.prepare(`
    UPDATE workorders SET
      status = COALESCE(?, status),
      description = COALESCE(?, description),
      resolvedAt = ?
    WHERE id = ?
  `).run(status, description, resolvedAt, req.params.id);

  const updated = db.prepare(`
    SELECT w.*, d.name as deviceName, d.location as deviceLocation,
           u1.nickname as reporterName, u2.nickname as handlerName
    FROM workorders w
    LEFT JOIN devices d ON w.deviceId = d.id
    LEFT JOIN users u1 ON w.reporterId = u1.id
    LEFT JOIN users u2 ON w.handlerId = u2.id
    WHERE w.id = ?
  `).get(req.params.id);

  res.json(serializeWorkOrder(updated));
}

router.put('/:id', authMiddleware, requireRoles('operator', 'property'), updateWorkOrder);
router.patch('/:id', authMiddleware, requireRoles('operator', 'property'), updateWorkOrder);

function assignWorkOrder(req: Request, res: Response): void {
  const handlerId = req.body.handlerId || req.body.assigneeId;

  if (!handlerId) {
    res.status(400).json({ error: '处理人ID不能为空' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM workorders WHERE id = ?').get(req.params.id) as WorkOrder | undefined;

  if (!existing) {
    res.status(404).json({ error: '工单不存在' });
    return;
  }

  const handler = db.prepare('SELECT * FROM users WHERE id = ?').get(handlerId);
  if (!handler) {
    res.status(404).json({ error: '处理人不存在' });
    return;
  }

  db.prepare(`
    UPDATE workorders SET handlerId = ?, status = 'assigned' WHERE id = ?
  `).run(handlerId, req.params.id);

  const updated = db.prepare(`
    SELECT w.*, d.name as deviceName, d.location as deviceLocation,
           u1.nickname as reporterName, u2.nickname as handlerName
    FROM workorders w
    LEFT JOIN devices d ON w.deviceId = d.id
    LEFT JOIN users u1 ON w.reporterId = u1.id
    LEFT JOIN users u2 ON w.handlerId = u2.id
    WHERE w.id = ?
  `).get(req.params.id);

  res.json(serializeWorkOrder(updated));
}

router.put('/:id/assign', authMiddleware, requireRoles('operator', 'property'), assignWorkOrder);
router.post('/:id/assign', authMiddleware, requireRoles('operator', 'property'), assignWorkOrder);

export default router;
