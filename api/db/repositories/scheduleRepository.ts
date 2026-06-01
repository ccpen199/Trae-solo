import { db, createAuditLog } from '../index.js';
import type { Schedule, CreateScheduleDto, UpdateScheduleDto, ConflictItem } from '../../types/index.js';

function mapRowToSchedule(row: Record<string, unknown>): Schedule {
  return {
    id: row.id as number,
    doctorId: row.doctor_id as number,
    institutionId: row.institution_id as number,
    departmentId: row.department_id as number,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    slotCount: row.slot_count as number,
    status: row.status as Schedule['status'],
    conflicts: row.conflicts ? JSON.parse(row.conflicts as string) : [],
    isHospitalShift: row.is_hospital_shift as number | undefined,
    createdAt: row.created_at as string,
  };
}

export function findAll(): Schedule[] {
  const stmt = db.prepare('SELECT * FROM schedules ORDER BY date DESC, start_time ASC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToSchedule);
}

export function findById(id: number): Schedule | null {
  const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToSchedule(row) : null;
}

export function findByDoctorId(doctorId: number, date?: string): Schedule[] {
  let query = 'SELECT * FROM schedules WHERE doctor_id = ?';
  const params: unknown[] = [doctorId];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  query += ' ORDER BY date DESC, start_time ASC';
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToSchedule);
}

export function findByInstitutionId(institutionId: number, date?: string): Schedule[] {
  let query = 'SELECT * FROM schedules WHERE institution_id = ?';
  const params: unknown[] = [institutionId];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  query += ' ORDER BY date DESC, start_time ASC';
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToSchedule);
}

export function findByDateRange(startDate: string, endDate: string): Schedule[] {
  const stmt = db.prepare(`
    SELECT * FROM schedules 
    WHERE date >= ? AND date <= ? 
    ORDER BY date ASC, start_time ASC
  `);
  const rows = stmt.all(startDate, endDate) as Record<string, unknown>[];
  return rows.map(mapRowToSchedule);
}

export function findByDoctorAndDateRange(doctorId: number, startDate: string, endDate: string): Schedule[] {
  const stmt = db.prepare(`
    SELECT * FROM schedules 
    WHERE doctor_id = ? AND date >= ? AND date <= ? 
    ORDER BY date ASC, start_time ASC
  `);
  const rows = stmt.all(doctorId, startDate, endDate) as Record<string, unknown>[];
  return rows.map(mapRowToSchedule);
}

export function create(dto: CreateScheduleDto, conflicts: ConflictItem[] = [], operator: string = 'system'): Schedule {
  const stmt = db.prepare(`
    INSERT INTO schedules (doctor_id, institution_id, department_id, date, start_time, end_time, slot_count, status, conflicts, is_hospital_shift)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    dto.doctorId,
    dto.institutionId,
    dto.departmentId,
    dto.date,
    dto.startTime,
    dto.endTime,
    dto.slotCount || 20,
    dto.status || 'draft',
    JSON.stringify(conflicts),
    dto.isHospitalShift || 0
  );
  const id = result.lastInsertRowid as number;
  const schedule = findById(id)!;
  createAuditLog('schedule', id, 'create', null, schedule, operator);
  return schedule;
}

export function update(id: number, dto: UpdateScheduleDto, conflicts?: ConflictItem[], operator: string = 'system'): Schedule | null {
  const existing = findById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (dto.doctorId !== undefined) {
    fields.push('doctor_id = ?');
    values.push(dto.doctorId);
  }
  if (dto.institutionId !== undefined) {
    fields.push('institution_id = ?');
    values.push(dto.institutionId);
  }
  if (dto.departmentId !== undefined) {
    fields.push('department_id = ?');
    values.push(dto.departmentId);
  }
  if (dto.date !== undefined) {
    fields.push('date = ?');
    values.push(dto.date);
  }
  if (dto.startTime !== undefined) {
    fields.push('start_time = ?');
    values.push(dto.startTime);
  }
  if (dto.endTime !== undefined) {
    fields.push('end_time = ?');
    values.push(dto.endTime);
  }
  if (dto.slotCount !== undefined) {
    fields.push('slot_count = ?');
    values.push(dto.slotCount);
  }
  if (dto.status !== undefined) {
    fields.push('status = ?');
    values.push(dto.status);
  }
  if (dto.isHospitalShift !== undefined) {
    fields.push('is_hospital_shift = ?');
    values.push(dto.isHospitalShift);
  }
  if (conflicts !== undefined) {
    fields.push('conflicts = ?');
    values.push(JSON.stringify(conflicts));
  }

  if (fields.length === 0) return existing;

  values.push(id);
  const stmt = db.prepare(`UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const updated = findById(id)!;
  createAuditLog('schedule', id, 'update', existing, updated, operator);
  return updated;
}

export function remove(id: number, operator: string = 'system'): boolean {
  const existing = findById(id);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
  const result = stmt.run(id);
  createAuditLog('schedule', id, 'delete', existing, null, operator);
  return result.changes > 0;
}
