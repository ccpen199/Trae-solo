import db, { run, get, query } from '../config/database.js';
import type { Appointment, AppointmentStatus, FollowUpRecord, Car, User } from '../types/index.js';

const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: []
};

const CAR_JSON_FIELDS = ['images', 'documents'];

function isValidStatusTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

function mapCarRow(row: Record<string, unknown>): Car {
  return {
    id: row.id as number,
    vin: row.vin as string,
    brand: row.brand as string,
    model: row.model as string,
    year: row.year as number,
    month: row.month as number,
    mileage: row.mileage as number,
    color: row.color as string,
    price: row.price as number,
    originalPrice: row.originalPrice as number | undefined,
    configuration: row.configuration as string,
    images: (row.images as string[]) || [],
    documents: (row.documents as Car['documents']) || [],
    dealerId: row.dealerId as number,
    status: row.status as Car['status'],
    statusHistory: [],
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string
  };
}

function mapUserRow(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    username: row.username as string,
    name: row.name as string,
    role: row.role as User['role'],
    phone: row.phone as string,
    email: row.email as string | undefined,
    status: row.status as User['status'],
    createdAt: row.createdAt as string
  };
}

function mapFollowUpRecordRow(row: Record<string, unknown>): FollowUpRecord {
  return {
    id: row.id as number,
    operatorId: row.operatorId as number,
    content: row.content as string,
    createdAt: row.createdAt as string
  };
}

function mapAppointmentRow(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as number,
    carId: row.carId as number,
    buyerId: row.buyerId as number,
    salesId: row.salesId as number | undefined,
    type: row.type as Appointment['type'],
    appointmentTime: row.appointmentTime as string,
    contactPhone: row.contactPhone as string,
    intentionLevel: row.intentionLevel as Appointment['intentionLevel'],
    notes: row.notes as string | undefined,
    status: row.status as AppointmentStatus,
    followUpRecords: [],
    createdAt: row.createdAt as string
  };
}

async function getFollowUpRecordsByAppointmentId(appointmentId: number): Promise<FollowUpRecord[]> {
  const sql = `
    SELECT 
      fur.id, fur.appointment_id as appointmentId, fur.operator_id as operatorId,
      fur.content, fur.created_at as createdAt,
      u.id as operator_id, u.username as operator_username, u.name as operator_name,
      u.role as operator_role, u.phone as operator_phone, u.email as operator_email,
      u.status as operator_status, u.created_at as operator_createdAt
    FROM follow_up_records fur
    LEFT JOIN users u ON fur.operator_id = u.id
    WHERE fur.appointment_id = ?
    ORDER BY fur.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, [appointmentId]);

  return rows.map(row => {
    const record = mapFollowUpRecordRow(row);
    if (row.operator_id) {
      record.operator = mapUserRow({
        id: row.operator_id,
        username: row.operator_username,
        name: row.operator_name,
        role: row.operator_role,
        phone: row.operator_phone,
        email: row.operator_email,
        status: row.operator_status,
        createdAt: row.operator_createdAt
      });
    }
    return record;
  });
}

export async function getAppointments(filters?: {
  buyerId?: number;
  salesId?: number;
  status?: string;
  carId?: number;
}): Promise<Appointment[]> {
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (filters?.buyerId !== undefined) {
    conditions.push('a.buyer_id = ?');
    params.push(filters.buyerId);
  }

  if (filters?.salesId !== undefined) {
    conditions.push('a.sales_id = ?');
    params.push(filters.salesId);
  }

  if (filters?.status !== undefined) {
    conditions.push('a.status = ?');
    params.push(filters.status);
  }

  if (filters?.carId !== undefined) {
    conditions.push('a.car_id = ?');
    params.push(filters.carId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      a.id, a.car_id as carId, a.buyer_id as buyerId, a.sales_id as salesId,
      a.type, a.appointment_time as appointmentTime, a.contact_phone as contactPhone,
      a.intention_level as intentionLevel, a.notes, a.status, a.created_at as createdAt,
      c.id as car_id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color,
      c.price, c.original_price as originalPrice, c.configuration,
      c.images_json as images, c.documents_json as documents,
      c.dealer_id as dealerId, c.status as car_status,
      c.created_at as car_createdAt, c.updated_at as car_updatedAt,
      b.id as buyer_id, b.username as buyer_username, b.name as buyer_name,
      b.role as buyer_role, b.phone as buyer_phone, b.email as buyer_email,
      b.status as buyer_status, b.created_at as buyer_createdAt,
      s.id as sales_id, s.username as sales_username, s.name as sales_name,
      s.role as sales_role, s.phone as sales_phone, s.email as sales_email,
      s.status as sales_status, s.created_at as sales_createdAt
    FROM appointments a
    LEFT JOIN cars c ON a.car_id = c.id
    LEFT JOIN users b ON a.buyer_id = b.id
    LEFT JOIN users s ON a.sales_id = s.id
    ${whereClause}
    ORDER BY a.created_at DESC
  `;

  const rows = query<Record<string, unknown>>(sql, params, CAR_JSON_FIELDS);

  const appointments: Appointment[] = [];
  for (const row of rows) {
    const appointment = mapAppointmentRow(row);

    if (row.car_id) {
      appointment.car = mapCarRow({
        id: row.car_id,
        vin: row.vin,
        brand: row.brand,
        model: row.model,
        year: row.year,
        month: row.month,
        mileage: row.mileage,
        color: row.color,
        price: row.price,
        originalPrice: row.originalPrice,
        configuration: row.configuration,
        images: row.images,
        documents: row.documents,
        dealerId: row.dealerId,
        status: row.car_status,
        createdAt: row.car_createdAt,
        updatedAt: row.car_updatedAt
      });
    }

    if (row.buyer_id) {
      appointment.buyer = mapUserRow({
        id: row.buyer_id,
        username: row.buyer_username,
        name: row.buyer_name,
        role: row.buyer_role,
        phone: row.buyer_phone,
        email: row.buyer_email,
        status: row.buyer_status,
        createdAt: row.buyer_createdAt
      });
    }

    if (row.sales_id) {
      appointment.sales = mapUserRow({
        id: row.sales_id,
        username: row.sales_username,
        name: row.sales_name,
        role: row.sales_role,
        phone: row.sales_phone,
        email: row.sales_email,
        status: row.sales_status,
        createdAt: row.sales_createdAt
      });
    }

    appointment.followUpRecords = await getFollowUpRecordsByAppointmentId(appointment.id);
    appointments.push(appointment);
  }

  return appointments;
}

export async function getAppointmentById(id: number): Promise<Appointment | null> {
  const sql = `
    SELECT 
      a.id, a.car_id as carId, a.buyer_id as buyerId, a.sales_id as salesId,
      a.type, a.appointment_time as appointmentTime, a.contact_phone as contactPhone,
      a.intention_level as intentionLevel, a.notes, a.status, a.created_at as createdAt,
      c.id as car_id, c.vin, c.brand, c.model, c.year, c.month, c.mileage, c.color,
      c.price, c.original_price as originalPrice, c.configuration,
      c.images_json as images, c.documents_json as documents,
      c.dealer_id as dealerId, c.status as car_status,
      c.created_at as car_createdAt, c.updated_at as car_updatedAt,
      b.id as buyer_id, b.username as buyer_username, b.name as buyer_name,
      b.role as buyer_role, b.phone as buyer_phone, b.email as buyer_email,
      b.status as buyer_status, b.created_at as buyer_createdAt,
      s.id as sales_id, s.username as sales_username, s.name as sales_name,
      s.role as sales_role, s.phone as sales_phone, s.email as sales_email,
      s.status as sales_status, s.created_at as sales_createdAt
    FROM appointments a
    LEFT JOIN cars c ON a.car_id = c.id
    LEFT JOIN users b ON a.buyer_id = b.id
    LEFT JOIN users s ON a.sales_id = s.id
    WHERE a.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [id], CAR_JSON_FIELDS);

  if (!row) return null;

  const appointment = mapAppointmentRow(row);

  if (row.car_id) {
    appointment.car = mapCarRow({
      id: row.car_id,
      vin: row.vin,
      brand: row.brand,
      model: row.model,
      year: row.year,
      month: row.month,
      mileage: row.mileage,
      color: row.color,
      price: row.price,
      originalPrice: row.originalPrice,
      configuration: row.configuration,
      images: row.images,
      documents: row.documents,
      dealerId: row.dealerId,
      status: row.car_status,
      createdAt: row.car_createdAt,
      updatedAt: row.car_updatedAt
    });
  }

  if (row.buyer_id) {
    appointment.buyer = mapUserRow({
      id: row.buyer_id,
      username: row.buyer_username,
      name: row.buyer_name,
      role: row.buyer_role,
      phone: row.buyer_phone,
      email: row.buyer_email,
      status: row.buyer_status,
      createdAt: row.buyer_createdAt
    });
  }

  if (row.sales_id) {
    appointment.sales = mapUserRow({
      id: row.sales_id,
      username: row.sales_username,
      name: row.sales_name,
      role: row.sales_role,
      phone: row.sales_phone,
      email: row.sales_email,
      status: row.sales_status,
      createdAt: row.sales_createdAt
    });
  }

  appointment.followUpRecords = await getFollowUpRecordsByAppointmentId(appointment.id);

  return appointment;
}

export async function createAppointment(
  data: Partial<Appointment> & { carId: number; buyerId: number }
): Promise<Appointment> {
  const car = get<{ id: number; status: string }>(
    'SELECT id, status FROM cars WHERE id = ?',
    [data.carId]
  );

  if (!car) {
    throw new Error('车源不存在');
  }

  if (car.status !== 'on_sale') {
    throw new Error('车源状态不是在售，无法预约');
  }

  const existingAppointment = get<{ id: number }>(
    'SELECT id FROM appointments WHERE car_id = ? AND status IN (?, ?)',
    [data.carId, 'pending', 'confirmed']
  );

  if (existingAppointment) {
    throw new Error('该车源已有未完成的预约');
  }

  const buyer = get<{ id: number }>(
    'SELECT id FROM users WHERE id = ? AND role = ?',
    [data.buyerId, 'buyer']
  );

  if (!buyer) {
    throw new Error('买家不存在或角色不正确');
  }

  const transaction = db.transaction(() => {
    const insertResult = run(
      `INSERT INTO appointments (
        car_id, buyer_id, sales_id, type, appointment_time,
        contact_phone, intention_level, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.carId,
        data.buyerId,
        data.salesId || null,
        data.type || 'view',
        data.appointmentTime,
        data.contactPhone,
        data.intentionLevel || 'medium',
        data.notes || null,
        'pending'
      ]
    );

    if (data.salesId) {
      const sales = get<{ id: number }>(
        'SELECT id FROM users WHERE id = ? AND role IN (?, ?)',
        [data.salesId, 'sales', 'admin']
      );
      if (!sales) {
        throw new Error('销售不存在或角色不正确');
      }
    }

    return insertResult.lastInsertRowid as number;
  });

  const appointmentId = transaction();

  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) {
    throw new Error('创建预约失败');
  }

  return appointment;
}

export async function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus,
  operatorId: number,
  notes?: string
): Promise<Appointment> {
  const existing = get<{ id: number; status: string; car_id: number }>(
    'SELECT id, status, car_id FROM appointments WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new Error('预约不存在');
  }

  const currentStatus = existing.status as AppointmentStatus;

  if (!isValidStatusTransition(currentStatus, status)) {
    throw new Error(`不允许从${currentStatus}变更为${status}`);
  }

  const transaction = db.transaction(() => {
    run(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );

    if (notes) {
      run(
        'UPDATE appointments SET notes = COALESCE(notes, "") || ? WHERE id = ?',
        [`\n状态变更备注: ${notes}`, id]
      );
    }

    if (status === 'cancelled' || status === 'completed' || status === 'no_show') {
      const car = get<{ id: number; status: string }>(
        'SELECT id, status FROM cars WHERE id = ?',
        [existing.car_id]
      );
      if (car && car.status === 'locked') {
        run(
          'UPDATE cars SET status = ? WHERE id = ?',
          ['on_sale', existing.car_id]
        );
      }
    }
  });

  transaction();

  const updated = await getAppointmentById(id);
  if (!updated) {
    throw new Error('更新预约状态失败');
  }

  return updated;
}

export async function addFollowUpRecord(
  appointmentId: number,
  operatorId: number,
  content: string
): Promise<FollowUpRecord> {
  const appointment = get<{ id: number }>(
    'SELECT id FROM appointments WHERE id = ?',
    [appointmentId]
  );

  if (!appointment) {
    throw new Error('预约不存在');
  }

  const operator = get<{ id: number }>(
    'SELECT id FROM users WHERE id = ? AND role IN (?, ?, ?)',
    [operatorId, 'sales', 'admin', 'customer_service']
  );

  if (!operator) {
    throw new Error('操作员不存在或无权限添加跟进记录');
  }

  const result = run(
    'INSERT INTO follow_up_records (appointment_id, operator_id, content) VALUES (?, ?, ?)',
    [appointmentId, operatorId, content]
  );

  const recordId = result.lastInsertRowid as number;

  const sql = `
    SELECT 
      fur.id, fur.appointment_id as appointmentId, fur.operator_id as operatorId,
      fur.content, fur.created_at as createdAt,
      u.id as operator_id, u.username as operator_username, u.name as operator_name,
      u.role as operator_role, u.phone as operator_phone, u.email as operator_email,
      u.status as operator_status, u.created_at as operator_createdAt
    FROM follow_up_records fur
    LEFT JOIN users u ON fur.operator_id = u.id
    WHERE fur.id = ?
    LIMIT 1
  `;

  const row = get<Record<string, unknown>>(sql, [recordId]);

  if (!row) {
    throw new Error('添加跟进记录失败');
  }

  const record = mapFollowUpRecordRow(row);
  if (row.operator_id) {
    record.operator = mapUserRow({
      id: row.operator_id,
      username: row.operator_username,
      name: row.operator_name,
      role: row.operator_role,
      phone: row.operator_phone,
      email: row.operator_email,
      status: row.operator_status,
      createdAt: row.operator_createdAt
    });
  }

  return record;
}
