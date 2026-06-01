import db from '../database';

export interface QueryOptions {
  where?: Record<string, any>;
  whereLike?: Record<string, string>;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export function buildWhereClause(options: QueryOptions): { sql: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.where) {
    Object.entries(options.where).forEach(([key, value]) => {
      conditions.push(`${key} = ?`);
      params.push(value);
    });
  }

  if (options.whereLike) {
    Object.entries(options.whereLike).forEach(([key, value]) => {
      conditions.push(`${key} LIKE ?`);
      params.push(`%${value}%`);
    });
  }

  const sql = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  return { sql, params };
}

export function findAll(table: string, options: QueryOptions = {}): any[] {
  const { sql, params } = buildWhereClause(options);
  let query = `SELECT * FROM ${table}${sql}`;

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy} ${options.orderDir || 'DESC'}`;
  }

  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
  }

  return db.prepare(query).all(...params);
}

export function findOne(table: string, options: QueryOptions = {}): any | null {
  const results = findAll(table, { ...options, limit: 1 });
  return results.length > 0 ? results[0] : null;
}

export function findById(table: string, id: number): any | null {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

export function create(table: string, data: Record<string, any>): number {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
  const result = stmt.run(...values);
  return Number(result.lastInsertRowid);
}

export function update(table: string, id: number, data: Record<string, any>): boolean {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
  const result = stmt.run(...values, id);
  return result.changes > 0;
}

export function remove(table: string, id: number): boolean {
  const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function count(table: string, options: QueryOptions = {}): number {
  const { sql, params } = buildWhereClause(options);
  const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}${sql}`).get(...params);
  return result?.count || 0;
}
