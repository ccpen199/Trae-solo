import db from '../utils/db.js';
import type { User, UserWithPassword, UserRole } from '../types/index.js';

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    username: row.username as string,
    name: row.name as string,
    role: row.role as UserRole,
    email: row.email as string | undefined,
    studentId: row.student_id as string | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToUserWithPassword(row: Record<string, unknown>): UserWithPassword {
  return {
    ...rowToUser(row),
    passwordHash: row.password_hash as string,
  };
}

export function findByUsername(username: string): UserWithPassword | null {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as Record<string, unknown> | undefined;
  return row ? rowToUserWithPassword(row) : null;
}

export function findById(id: number): User | null {
  const row = db.prepare('SELECT id, username, name, role, email, student_id, created_at FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function findAll(role?: UserRole): User[] {
  let sql = 'SELECT id, username, name, role, email, student_id, created_at FROM users';
  const params: unknown[] = [];
  
  if (role) {
    sql += ' WHERE role = ?';
    params.push(role);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToUser);
}

export function create(userData: {
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  email?: string;
  studentId?: string;
}): User {
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, name, role, email, student_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    userData.username,
    userData.passwordHash,
    userData.name,
    userData.role,
    userData.email || null,
    userData.studentId || null
  );
  return findById(result.lastInsertRowid as number)!;
}

export function update(id: number, userData: Partial<{
  name: string;
  email: string;
  studentId: string;
  role: UserRole;
}>): User | null {
  const fields: string[] = [];
  const params: unknown[] = [];
  
  if (userData.name !== undefined) {
    fields.push('name = ?');
    params.push(userData.name);
  }
  if (userData.email !== undefined) {
    fields.push('email = ?');
    params.push(userData.email);
  }
  if (userData.studentId !== undefined) {
    fields.push('student_id = ?');
    params.push(userData.studentId);
  }
  if (userData.role !== undefined) {
    fields.push('role = ?');
    params.push(userData.role);
  }
  
  if (fields.length === 0) return findById(id);
  
  params.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return findById(id);
}
