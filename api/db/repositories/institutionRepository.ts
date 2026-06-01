import { db, createAuditLog } from '../index.js';
import type { Institution, Department, CreateInstitutionDto, UpdateInstitutionDto } from '../../types/index.js';

function mapRowToDepartment(row: Record<string, unknown>): Department {
  return {
    id: row.id as number,
    institutionId: row.institution_id as number,
    name: row.name as string,
    roomCount: row.room_count as number,
    createdAt: row.created_at as string,
  };
}

function mapRowToInstitution(row: Record<string, unknown>, departments: Department[]): Institution {
  return {
    id: row.id as number,
    name: row.name as string,
    departments,
    address: row.address as string,
    contact: row.contact as string,
    minQualification: row.min_qualification as string,
    status: row.status as Institution['status'],
    createdAt: row.created_at as string,
  };
}

export function findAllDepartmentsByInstitutionId(institutionId: number): Department[] {
  const stmt = db.prepare('SELECT * FROM departments WHERE institution_id = ? ORDER BY id');
  const rows = stmt.all(institutionId) as Record<string, unknown>[];
  return rows.map(mapRowToDepartment);
}

export function findAllInstitutions(): Institution[] {
  const stmt = db.prepare('SELECT * FROM institutions ORDER BY created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(row => {
    const departments = findAllDepartmentsByInstitutionId(row.id as number);
    return mapRowToInstitution(row, departments);
  });
}

export function findInstitutionById(id: number): Institution | null {
  const stmt = db.prepare('SELECT * FROM institutions WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  const departments = findAllDepartmentsByInstitutionId(id);
  return mapRowToInstitution(row, departments);
}

export function findDepartmentById(id: number): Department | null {
  const stmt = db.prepare('SELECT * FROM departments WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  return row ? mapRowToDepartment(row) : null;
}

function addDepartment(institutionId: number, name: string, roomCount: number = 1): Department {
  const stmt = db.prepare(`
    INSERT INTO departments (institution_id, name, room_count)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(institutionId, name, roomCount);
  return findDepartmentById(result.lastInsertRowid as number)!;
}

function removeDepartmentsByInstitutionId(institutionId: number): void {
  const stmt = db.prepare('DELETE FROM departments WHERE institution_id = ?');
  stmt.run(institutionId);
}

export function createInstitution(dto: CreateInstitutionDto, operator: string = 'system'): Institution {
  const stmt = db.prepare(`
    INSERT INTO institutions (name, address, contact, min_qualification, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    dto.name,
    dto.address || null,
    dto.contact || null,
    dto.minQualification || '主治医师',
    dto.status || 'active'
  );
  const id = result.lastInsertRowid as number;

  if (dto.departments && dto.departments.length > 0) {
    for (const dept of dto.departments) {
      addDepartment(id, dept.name, dept.roomCount || 1);
    }
  }

  const institution = findInstitutionById(id)!;
  createAuditLog('institution', id, 'create', null, institution, operator);
  return institution;
}

export function updateInstitution(id: number, dto: UpdateInstitutionDto, operator: string = 'system'): Institution | null {
  const existing = findInstitutionById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (dto.name !== undefined) {
    fields.push('name = ?');
    values.push(dto.name);
  }
  if (dto.address !== undefined) {
    fields.push('address = ?');
    values.push(dto.address);
  }
  if (dto.contact !== undefined) {
    fields.push('contact = ?');
    values.push(dto.contact);
  }
  if (dto.minQualification !== undefined) {
    fields.push('min_qualification = ?');
    values.push(dto.minQualification);
  }
  if (dto.status !== undefined) {
    fields.push('status = ?');
    values.push(dto.status);
  }

  if (fields.length > 0) {
    values.push(id);
    const stmt = db.prepare(`UPDATE institutions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  if (dto.departments !== undefined) {
    removeDepartmentsByInstitutionId(id);
    for (const dept of dto.departments) {
      addDepartment(id, dept.name, dept.roomCount || 1);
    }
  }

  const updated = findInstitutionById(id)!;
  createAuditLog('institution', id, 'update', existing, updated, operator);
  return updated;
}

export function deleteInstitution(id: number, operator: string = 'system'): boolean {
  const existing = findInstitutionById(id);
  if (!existing) return false;

  removeDepartmentsByInstitutionId(id);
  const stmt = db.prepare('DELETE FROM institutions WHERE id = ?');
  const result = stmt.run(id);
  createAuditLog('institution', id, 'delete', existing, null, operator);
  return result.changes > 0;
}
