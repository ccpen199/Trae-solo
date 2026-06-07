/**
 * Work order service with SLA management
 */
import db from '../db.js';

const SLA_HOURS: Record<string, number> = {
  cleaning: 48,
  repair: 24,
  moving: 72,
  renovation: 168
};

function calcDeadline(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function getRemainingHours(deadline: string): number {
  const now = new Date().getTime();
  const dl = new Date(deadline).getTime();
  return Math.round((dl - now) / (1000 * 60 * 60));
}

export function listWorkOrders(filters: any, page = 1, limit = 20) {
  const where: string[] = [];
  const args: any[] = [];
  if (filters.type) { where.push('type = ?'); args.push(filters.type); }
  if (filters.status) { where.push('status = ?'); args.push(filters.status); }
  if (filters.propertyId) { where.push('property_id = ?'); args.push(filters.propertyId); }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const count = (db.prepare(`SELECT COUNT(*) as c FROM work_orders ${whereClause}`).get(...args) as any).c;
  const offset = (page - 1) * limit;
  const list = db.prepare(`
    SELECT w.*,
           w.deadline as sla_deadline,
           p.name as property_name, p.address as property_address,
           r.name as reporter_name,
           a.name as assignee_name,
           s.name as supplier_name,
           (SELECT COUNT(*) FROM work_order_logs l WHERE l.work_order_id = w.id) as logs
    FROM work_orders w
    LEFT JOIN properties p ON w.property_id = p.id
    LEFT JOIN users r ON w.reporter_id = r.id
    LEFT JOIN users a ON w.assignee_id = a.id
    LEFT JOIN suppliers s ON w.supplier_id = s.id
    ${whereClause}
    ORDER BY
      CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
      w.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...args, limit, offset);

  const enriched = (list as any[]).map(w => {
    if (w.status !== 'completed' && w.deadline) {
      const remaining = getRemainingHours(w.deadline);
      return { ...w, remainingHours: remaining, isOverdue: remaining < 0 };
    }
    return { ...w, remainingHours: 0, isOverdue: false };
  });

  return { list: enriched, total: count, page, limit };
}

export function getWorkOrderDetail(id: number) {
  const workOrder = db.prepare(`
    SELECT w.*,
           p.name as property_name, p.address as property_address,
           r.name as reporter_name, r.phone as reporter_phone,
           a.name as assignee_name, a.phone as assignee_phone
    FROM work_orders w
    LEFT JOIN properties p ON w.property_id = p.id
    LEFT JOIN users r ON w.reporter_id = r.id
    LEFT JOIN users a ON w.assignee_id = a.id
    WHERE w.id = ?
  `).get(id) as any;
  if (!workOrder) return null;
  const logs = db.prepare(`
    SELECT l.*, u.name as operator_name
    FROM work_order_logs l
    LEFT JOIN users u ON l.operator_id = u.id
    WHERE work_order_id = ?
    ORDER BY l.created_at
  `).all(id);

  let remainingHours = 0;
  let isOverdue = false;
  if (workOrder.status !== 'completed' && workOrder.deadline) {
    remainingHours = getRemainingHours(workOrder.deadline);
    isOverdue = remainingHours < 0;
  }

  return {
    workOrder: { ...workOrder, remainingHours, isOverdue },
    sla: {
      slaHours: workOrder.sla_hours,
      deadline: workOrder.deadline,
      remainingHours,
      isOverdue,
      progress: workOrder.sla_hours > 0 ? Math.min(100, Math.max(0, 100 - (remainingHours / workOrder.sla_hours * 100))) : 0
    },
    logs
  };
}

export function createWorkOrder(data: any) {
  const slaHours = data.slaHours || SLA_HOURS[data.type] || 48;
  const deadline = calcDeadline(slaHours);
  const info = db.prepare(`
    INSERT INTO work_orders (type, property_id, reporter_id, description, priority, sla_hours, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(data.type, data.propertyId, data.reporterId, data.description, data.priority || 'normal', slaHours, deadline);
  const woId = Number(info.lastInsertRowid);
  db.prepare(`INSERT INTO work_order_logs (work_order_id, action, remark, operator_id) VALUES (?, 'create', ?, ?)`).run(woId, '工单创建', data.reporterId);
  return { id: woId, deadline, slaHours };
}

export function assignWorkOrder(id: number, assigneeId: number, operatorId: number) {
  db.prepare(`UPDATE work_orders SET assignee_id = ?, status = 'assigned' WHERE id = ?`).run(assigneeId, id);
  const assignee = db.prepare('SELECT name FROM users WHERE id = ?').get(assigneeId) as any;
  db.prepare(`INSERT INTO work_order_logs (work_order_id, action, remark, operator_id) VALUES (?, 'assign', ?, ?)`)
    .run(id, `分配给 ${assignee?.name || assigneeId} 处理`, operatorId);
  return { updated: true };
}

export function completeWorkOrder(id: number, result: string, operatorId: number) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(`UPDATE work_orders SET status = 'completed', completed_at = ? WHERE id = ?`).run(now, id);
  db.prepare(`INSERT INTO work_order_logs (work_order_id, action, remark, operator_id) VALUES (?, 'complete', ?, ?)`).run(id, result, operatorId);
  return { updated: true, completedAt: now };
}

export function startWorkOrder(id: number, operatorId: number) {
  db.prepare(`UPDATE work_orders SET status = 'in_progress' WHERE id = ?`).run(id);
  db.prepare(`INSERT INTO work_order_logs (work_order_id, action, remark, operator_id) VALUES (?, 'start', '开始处理', ?)`).run(id, operatorId);
  return { updated: true };
}
