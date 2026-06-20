import { db } from '../database/connection';
import type { Order, OrderStatus } from '../../../shared/types';

interface OrderRow {
  id: string;
  order_no: string;
  sender_name: string;
  sender_phone: string;
  sender_province?: string;
  sender_city?: string;
  sender_district?: string;
  sender_address: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_province?: string;
  receiver_city?: string;
  receiver_district?: string;
  receiver_address: string;
  item_type: string;
  estimated_weight: number;
  actual_weight?: number;
  appointment_time: string;
  pickup_code: string;
  remark?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNo: row.order_no,
    sender: {
      name: row.sender_name,
      phone: row.sender_phone,
      province: row.sender_province || '',
      city: row.sender_city || '',
      district: row.sender_district || '',
      address: row.sender_address,
      fullAddress: `${row.sender_province || ''}${row.sender_city || ''}${row.sender_district || ''}${row.sender_address}`,
    },
    receiver: {
      name: row.receiver_name,
      phone: row.receiver_phone,
      province: row.receiver_province || '',
      city: row.receiver_city || '',
      district: row.receiver_district || '',
      address: row.receiver_address,
      fullAddress: `${row.receiver_province || ''}${row.receiver_city || ''}${row.receiver_district || ''}${row.receiver_address}`,
    },
    itemType: row.item_type,
    estimatedWeight: row.estimated_weight,
    actualWeight: row.actual_weight,
    appointmentTime: row.appointment_time,
    pickupCode: row.pickup_code,
    status: row.status as OrderStatus,
    remark: row.remark,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface OrderFilters {
  outletId?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}

export const orderRepository = {
  findAll(filters: OrderFilters = {}): { list: Order[]; total: number } {
    const { outletId, status, page = 1, pageSize = 10 } = filters;
    
    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (outletId) {
      whereSql += ' AND o.id IN (SELECT order_id FROM pickup_tasks WHERE outlet_id = ?)';
      params.push(outletId);
    }
    if (status) {
      whereSql += ' AND o.status = ?';
      params.push(status);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM orders o ${whereSql}
    `).get(...params) as { total: number };

    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT o.* FROM orders o ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as OrderRow[];

    return {
      list: rows.map(rowToOrder),
      total: countRow.total,
    };
  },

  findById(id: string): Order | null {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
    return row ? rowToOrder(row) : null;
  },

  findByPickupCode(pickupCode: string): Order | null {
    const row = db.prepare('SELECT * FROM orders WHERE pickup_code = ?').get(pickupCode) as OrderRow | undefined;
    return row ? rowToOrder(row) : null;
  },

  updateStatus(id: string, status: OrderStatus): Order | null {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    return orderRepository.findById(id);
  },
};
