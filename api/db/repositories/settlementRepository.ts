import { db, createAuditLog } from '../index.js';
import type { Settlement } from '../../types/index.js';

function mapRowToSettlement(row: Record<string, unknown>): Settlement {
  return {
    id: row.id as number,
    period: row.period as string,
    doctorId: row.doctor_id as number,
    institutionId: row.institution_id as number,
    visitCount: row.visit_count as number,
    totalIncome: row.total_income as number,
    defaultCount: row.default_count as number,
    status: row.status as Settlement['status'],
    createdAt: row.created_at as string,
  };
}

export function findAll(): Settlement[] {
  const stmt = db.prepare('SELECT * FROM settlements ORDER BY period DESC, created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToSettlement);
}

export function findById(id: number): Settlement | null {
  const stmt = db.prepare('SELECT * FROM settlements WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToSettlement(row) : null;
}

export function findByPeriod(period: string): Settlement[] {
  const stmt = db.prepare('SELECT * FROM settlements WHERE period = ? ORDER BY created_at DESC');
  const rows = stmt.all(period) as Record<string, unknown>[];
  return rows.map(mapRowToSettlement);
}

export function findByDoctorId(doctorId: number, period?: string): Settlement[] {
  let query = 'SELECT * FROM settlements WHERE doctor_id = ?';
  const params: unknown[] = [doctorId];

  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }

  query += ' ORDER BY period DESC, created_at DESC';
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToSettlement);
}

export function findByInstitutionId(institutionId: number, period?: string): Settlement[] {
  let query = 'SELECT * FROM settlements WHERE institution_id = ?';
  const params: unknown[] = [institutionId];

  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }

  query += ' ORDER BY period DESC, created_at DESC';
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as Record<string, unknown>[];
  return rows.map(mapRowToSettlement);
}

export function create(
  period: string,
  doctorId: number,
  institutionId: number,
  visitCount: number,
  totalIncome: number,
  defaultCount: number,
  operator: string = 'system'
): Settlement {
  const stmt = db.prepare(`
    INSERT INTO settlements (period, doctor_id, institution_id, visit_count, total_income, default_count, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(period, doctorId, institutionId, visitCount, totalIncome, defaultCount);
  const id = result.lastInsertRowid as number;
  const settlement = findById(id)!;
  createAuditLog('settlement', id, 'create', null, settlement, operator);
  return settlement;
}

export function updateStatus(id: number, status: 'pending' | 'settled', operator: string = 'system'): Settlement | null {
  const existing = findById(id);
  if (!existing) return null;

  const stmt = db.prepare('UPDATE settlements SET status = ? WHERE id = ?');
  stmt.run(status, id);

  const updated = findById(id)!;
  createAuditLog('settlement', id, 'update', existing, updated, operator);
  return updated;
}

export function remove(id: number, operator: string = 'system'): boolean {
  const existing = findById(id);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM settlements WHERE id = ?');
  const result = stmt.run(id);
  createAuditLog('settlement', id, 'delete', existing, null, operator);
  return result.changes > 0;
}

export function findByDoctorAndInstitution(doctorId: number, institutionId: number, period?: string): Settlement | null {
  let query = 'SELECT * FROM settlements WHERE doctor_id = ? AND institution_id = ?';
  const params: unknown[] = [doctorId, institutionId];

  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }

  query += ' ORDER BY created_at DESC LIMIT 1';
  const stmt = db.prepare(query);
  const row = stmt.get(...params) as Record<string, unknown> | undefined;
  return row ? mapRowToSettlement(row) : null;
}
