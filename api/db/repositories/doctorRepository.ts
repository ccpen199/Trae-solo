import { db, createAuditLog } from '../index.js';
import type { Doctor, CreateDoctorDto, UpdateDoctorDto } from '../../types/index.js';

function mapRowToDoctor(row: Record<string, unknown>): Doctor {
  return {
    id: row.id as number,
    name: row.name as string,
    licenseNo: row.license_no as string,
    specialty: row.specialty as string,
    title: row.title as string,
    practiceScope: row.practice_scope as string,
    status: row.status as Doctor['status'],
    availableInstitutions: row.available_institutions ? JSON.parse(row.available_institutions as string) : [],
    visitPrice: row.visit_price as number,
    complianceStatus: row.compliance_status as string | undefined,
    practiceCertExpiry: row.practice_cert_expiry as string | undefined,
    createdAt: row.created_at as string,
  };
}

export function findAll(): Doctor[] {
  const stmt = db.prepare('SELECT * FROM doctors ORDER BY created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapRowToDoctor);
}

export function findById(id: number): Doctor | null {
  const stmt = db.prepare('SELECT * FROM doctors WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToDoctor(row) : null;
}

export function findByLicenseNo(licenseNo: string): Doctor | null {
  const stmt = db.prepare('SELECT * FROM doctors WHERE license_no = ?');
  const row = stmt.get(licenseNo) as Record<string, unknown> | undefined;
  return row ? mapRowToDoctor(row) : null;
}

export function create(dto: CreateDoctorDto, operator: string = 'system'): Doctor {
  const stmt = db.prepare(`
    INSERT INTO doctors (name, license_no, specialty, title, practice_scope, status, available_institutions, visit_price, practice_cert_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    dto.name,
    dto.licenseNo,
    dto.specialty,
    dto.title,
    dto.practiceScope,
    dto.status || 'pending',
    dto.availableInstitutions ? JSON.stringify(dto.availableInstitutions) : '[]',
    dto.visitPrice || 0,
    dto.practiceCertExpiry || null
  );
  const id = result.lastInsertRowid as number;
  const doctor = findById(id)!;
  createAuditLog('doctor', id, 'create', null, doctor, operator);
  return doctor;
}

export function update(id: number, dto: UpdateDoctorDto, operator: string = 'system'): Doctor | null {
  const existing = findById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (dto.name !== undefined) {
    fields.push('name = ?');
    values.push(dto.name);
  }
  if (dto.licenseNo !== undefined) {
    fields.push('license_no = ?');
    values.push(dto.licenseNo);
  }
  if (dto.specialty !== undefined) {
    fields.push('specialty = ?');
    values.push(dto.specialty);
  }
  if (dto.title !== undefined) {
    fields.push('title = ?');
    values.push(dto.title);
  }
  if (dto.practiceScope !== undefined) {
    fields.push('practice_scope = ?');
    values.push(dto.practiceScope);
  }
  if (dto.status !== undefined) {
    fields.push('status = ?');
    values.push(dto.status);
  }
  if (dto.availableInstitutions !== undefined) {
    fields.push('available_institutions = ?');
    values.push(JSON.stringify(dto.availableInstitutions));
  }
  if (dto.visitPrice !== undefined) {
    fields.push('visit_price = ?');
    values.push(dto.visitPrice);
  }
  if (dto.practiceCertExpiry !== undefined) {
    fields.push('practice_cert_expiry = ?');
    values.push(dto.practiceCertExpiry);
  }

  if (fields.length === 0) return existing;

  values.push(id);
  const stmt = db.prepare(`UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const updated = findById(id)!;
  createAuditLog('doctor', id, 'update', existing, updated, operator);
  return updated;
}

export function remove(id: number, operator: string = 'system'): boolean {
  const existing = findById(id);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM doctors WHERE id = ?');
  const result = stmt.run(id);
  createAuditLog('doctor', id, 'delete', existing, null, operator);
  return result.changes > 0;
}

export function findByInstitution(institutionId: number): Doctor[] {
  const doctors = findAll();
  return doctors.filter(d => d.availableInstitutions.includes(institutionId));
}
