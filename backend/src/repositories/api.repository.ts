import { API } from '../domains/core/types.js';
import { BaseRepository } from './base.repository.js';
import { generateId, now } from '../utils/index.js';

export class APIRepository extends BaseRepository<API> {
  constructor() {
    super('apis');
  }

  create(data: {
    service_id: string;
    name: string;
    path: string;
    method: string;
    description: string | null;
    timeout?: number;
    is_public?: boolean;
  }): API {
    const id = generateId();
    const timestamp = now();
    const timeout = data.timeout || 30000;
    const is_public = data.is_public || false;

    const stmt = this.prepareInsert([
      'id', 'service_id', 'name', 'path', 'method',
      'description', 'timeout', 'is_public', 'created_at', 'updated_at'
    ]);
    
    stmt.run(
      id, data.service_id, data.name, data.path, data.method,
      data.description, timeout, is_public ? 1 : 0, timestamp, timestamp
    );

    return {
      id,
      service_id: data.service_id,
      name: data.name,
      path: data.path,
      method: data.method,
      description: data.description,
      timeout,
      is_public,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  update(id: string, data: {
    name?: string;
    path?: string;
    method?: string;
    description?: string | null;
    timeout?: number;
    is_public?: boolean;
  }): API | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: Partial<API> = {};
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (data.name !== undefined) {
      fields.push('name');
      values.push(data.name);
      updates.name = data.name;
    }
    if (data.path !== undefined) {
      fields.push('path');
      values.push(data.path);
      updates.path = data.path;
    }
    if (data.method !== undefined) {
      fields.push('method');
      values.push(data.method);
      updates.method = data.method;
    }
    if (data.description !== undefined) {
      fields.push('description');
      values.push(data.description);
      updates.description = data.description;
    }
    if (data.timeout !== undefined) {
      fields.push('timeout');
      values.push(data.timeout);
      updates.timeout = data.timeout;
    }
    if (data.is_public !== undefined) {
      fields.push('is_public');
      values.push(data.is_public ? 1 : 0);
      updates.is_public = data.is_public;
    }

    if (fields.length === 0) return existing;

    const timestamp = now();
    values.push(timestamp, id);

    const stmt = this.prepareUpdate(fields);
    stmt.run(...values);

    return { ...existing, ...updates, updated_at: timestamp };
  }

  findByServiceId(serviceId: string): API[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE service_id = ?`);
    return stmt.all(serviceId) as API[];
  }

  findByPathAndMethod(serviceId: string, path: string, method: string): API | null {
    const stmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE service_id = ? AND path = ? AND method = ?`
    );
    const result = stmt.get(serviceId, path, method) as API | undefined;
    return result || null;
  }
}
