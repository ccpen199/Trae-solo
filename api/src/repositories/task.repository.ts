import { db } from '../database/connection';
import type { PickupTask, TaskStatus, PaymentMethod } from '../../../shared/types';
import crypto from 'crypto';

interface TaskRow {
  id: string;
  task_no: string;
  order_id: string;
  order_no: string;
  courier_id?: string;
  courier_name?: string;
  outlet_id: string;
  pickup_code: string;
  sender_address: string;
  sender_phone: string;
  item_type: string;
  estimated_weight: number;
  actual_weight?: number;
  appointment_time: string;
  weight_check_rule: string;
  weight_tolerance?: number;
  freight?: number;
  payment_method?: string;
  photos?: string;
  waybill_no?: string;
  printed_at?: string;
  status: string;
  exception_reason?: string;
  synced: number;
  picked_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): PickupTask {
  return {
    id: row.id,
    taskNo: row.task_no,
    orderId: row.order_id,
    orderNo: row.order_no,
    courierId: row.courier_id,
    courierName: row.courier_name,
    outletId: row.outlet_id,
    pickupCode: row.pickup_code,
    senderAddress: row.sender_address,
    senderPhone: row.sender_phone,
    itemType: row.item_type,
    estimatedWeight: row.estimated_weight,
    actualWeight: row.actual_weight,
    appointmentTime: row.appointment_time,
    status: row.status as TaskStatus,
    freight: row.freight,
    paymentMethod: row.payment_method as PaymentMethod,
    weightCheckRule: row.weight_check_rule as PickupTask['weightCheckRule'],
    weightTolerance: row.weight_tolerance,
    photos: row.photos ? JSON.parse(row.photos) : undefined,
    waybillNo: row.waybill_no,
    printedAt: row.printed_at,
    exceptionReason: row.exception_reason,
    createdAt: row.created_at,
    pickedAt: row.picked_at,
    completedAt: row.completed_at,
    synced: row.synced === 1,
  };
}

interface TaskFilters {
  courierId?: string;
  outletId?: string;
  status?: TaskStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const taskRepository = {
  findAll(filters: TaskFilters = {}): { list: PickupTask[]; total: number } {
    const { courierId, outletId, status, startDate, endDate, page = 1, pageSize = 10 } = filters;
    
    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (courierId) {
      whereSql += ' AND courier_id = ?';
      params.push(courierId);
    }
    if (outletId) {
      whereSql += ' AND outlet_id = ?';
      params.push(outletId);
    }
    if (status) {
      whereSql += ' AND status = ?';
      params.push(status);
    }
    if (startDate) {
      whereSql += ' AND date(created_at) >= date(?)';
      params.push(startDate);
    }
    if (endDate) {
      whereSql += ' AND date(created_at) <= date(?)';
      params.push(endDate);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM pickup_tasks ${whereSql}
    `).get(...params) as { total: number };

    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT * FROM pickup_tasks ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as TaskRow[];

    return {
      list: rows.map(rowToTask),
      total: countRow.total,
    };
  },

  findById(id: string): PickupTask | null {
    const row = db.prepare('SELECT * FROM pickup_tasks WHERE id = ?').get(id) as TaskRow | undefined;
    return row ? rowToTask(row) : null;
  },

  create(taskData: Omit<PickupTask, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): PickupTask {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(`
      INSERT INTO pickup_tasks (
        id, task_no, order_id, order_no, courier_id, courier_name, outlet_id, pickup_code,
        sender_address, sender_phone, item_type, estimated_weight, actual_weight, appointment_time,
        weight_check_rule, weight_tolerance, freight, payment_method, photos, waybill_no, printed_at,
        status, exception_reason, synced, picked_at, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      taskData.taskNo,
      taskData.orderId,
      taskData.orderNo,
      taskData.courierId || null,
      taskData.courierName || null,
      taskData.outletId,
      taskData.pickupCode,
      taskData.senderAddress,
      taskData.senderPhone,
      taskData.itemType,
      taskData.estimatedWeight,
      taskData.actualWeight || null,
      taskData.appointmentTime,
      taskData.weightCheckRule,
      taskData.weightTolerance || null,
      taskData.freight || null,
      taskData.paymentMethod || null,
      taskData.photos ? JSON.stringify(taskData.photos) : null,
      taskData.waybillNo || null,
      taskData.printedAt || null,
      taskData.status,
      taskData.exceptionReason || null,
      1,
      taskData.pickedAt || null,
      taskData.completedAt || null,
      now,
      now
    );

    return taskRepository.findById(id)!;
  },

  update(id: string, taskData: Partial<PickupTask>): PickupTask | null {
    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      courierId: 'courier_id',
      courierName: 'courier_name',
      status: 'status',
      actualWeight: 'actual_weight',
      freight: 'freight',
      paymentMethod: 'payment_method',
      waybillNo: 'waybill_no',
      printedAt: 'printed_at',
      pickedAt: 'picked_at',
      completedAt: 'completed_at',
      exceptionReason: 'exception_reason',
      photos: 'photos',
      synced: 'synced',
    };

    Object.entries(taskData).forEach(([key, value]) => {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = ?`);
        params.push(key === 'photos' ? JSON.stringify(value) : value);
      }
    });

    if (setClauses.length === 0) return taskRepository.findById(id);

    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString().slice(0, 19).replace('T', ' '));
    params.push(id);

    db.prepare(`UPDATE pickup_tasks SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

    return taskRepository.findById(id);
  },

  updateStatus(id: string, status: TaskStatus, extraData?: Partial<PickupTask>): PickupTask | null {
    return taskRepository.update(id, { status, ...extraData });
  },

  findUnsynced(courierId?: string): PickupTask[] {
    let sql = 'SELECT * FROM pickup_tasks WHERE synced = 0';
    const params: any[] = [];

    if (courierId) {
      sql += ' AND courier_id = ?';
      params.push(courierId);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params) as TaskRow[];
    return rows.map(rowToTask);
  },

  bulkSync(taskIds: string[]): void {
    const updateStmt = db.prepare('UPDATE pickup_tasks SET synced = 1 WHERE id = ?');
    const transaction = db.transaction((ids: string[]) => {
      for (const id of ids) {
        updateStmt.run(id);
      }
    });
    transaction(taskIds);
  },

  recordPrint(taskId: string, waybillNo: string, printerName: string, paperSize: string, printedBy: string): void {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(`
      INSERT INTO print_logs (id, task_id, waybill_no, printer_name, paper_size, printed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, taskId, waybillNo, printerName, paperSize, printedBy, now);
  },
};
