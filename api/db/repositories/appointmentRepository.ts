import { db, createAuditLog } from '../index.js';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from '../../types/index.js';

function mapRowToAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as number,
    scheduleId: row.schedule_id as number,
    patientName: row.patient_name as string,
    patientPhone: row.patient_phone as string,
    slotTime: row.slot_time as string,
    status: row.status as Appointment['status'],
    rescheduledFrom: row.rescheduled_from as number | undefined,
    notificationLog: row.notification_log as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function findAll(): Appointment[] {
  const stmt = db.prepare('SELECT * FROM appointments ORDER BY created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToAppointment);
}

export function findById(id: number): Appointment | null {
  const stmt = db.prepare('SELECT * FROM appointments WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToAppointment(row) : null;
}

export function findByScheduleId(scheduleId: number): Appointment[] {
  const stmt = db.prepare('SELECT * FROM appointments WHERE schedule_id = ? ORDER BY slot_time ASC');
  const rows = stmt.all(scheduleId) as Record<string, unknown>[];
  return rows.map(mapRowToAppointment);
}

export function findByPatientPhone(patientPhone: string): Appointment[] {
  const stmt = db.prepare('SELECT * FROM appointments WHERE patient_phone = ? ORDER BY created_at DESC');
  const rows = stmt.all(patientPhone) as Record<string, unknown>[];
  return rows.map(mapRowToAppointment);
}

export function findByDateRange(startDate: string, endDate: string): Appointment[] {
  const stmt = db.prepare(`
    SELECT a.* FROM appointments a
    JOIN schedules s ON a.schedule_id = s.id
    WHERE s.date >= ? AND s.date <= ?
    ORDER BY s.date ASC, a.slot_time ASC
  `);
  const rows = stmt.all(startDate, endDate) as Record<string, unknown>[];
  return rows.map(mapRowToAppointment);
}

export function create(dto: CreateAppointmentDto, operator: string = 'system'): Appointment {
  const stmt = db.prepare(`
    INSERT INTO appointments (schedule_id, patient_name, patient_phone, slot_time)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    dto.scheduleId,
    dto.patientName,
    dto.patientPhone,
    dto.slotTime
  );
  const id = result.lastInsertRowid as number;
  const appointment = findById(id)!;
  createAuditLog('appointment', id, 'create', null, appointment, operator);
  return appointment;
}

export function update(id: number, dto: UpdateAppointmentDto, operator: string = 'system'): Appointment | null {
  const existing = findById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (dto.status !== undefined) {
    fields.push('status = ?');
    values.push(dto.status);
  }

  if (fields.length === 0) return existing;

  values.push(id);
  const stmt = db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const updated = findById(id)!;
  createAuditLog('appointment', id, 'update', existing, updated, operator);
  return updated;
}

export function remove(id: number, operator: string = 'system'): boolean {
  const existing = findById(id);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
  const result = stmt.run(id);
  createAuditLog('appointment', id, 'delete', existing, null, operator);
  return result.changes > 0;
}

export function countByScheduleId(scheduleId: number, status?: string): number {
  let query = 'SELECT COUNT(*) as count FROM appointments WHERE schedule_id = ?';
  const params: unknown[] = [scheduleId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params) as { count: number };
  return result.count;
}
