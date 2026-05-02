import { Service, ServiceStatus } from '../domains/core/types.js';
import { BaseRepository } from './base.repository.js';
import { generateId, now } from '../utils/index.js';

export class ServiceRepository extends BaseRepository<Service> {
  constructor() {
    super('services');
  }

  create(data: {
    name: string;
    description: string | null;
    base_url: string;
    created_by: string;
    status?: ServiceStatus;
  }): Service {
    const id = generateId();
    const timestamp = now();
    const status = data.status || 'OFFLINE';

    const stmt = this.prepareInsert([
      'id', 'name', 'description', 'base_url', 'status', 
      'created_by', 'created_at', 'updated_at'
    ]);
    
    stmt.run(
      id, data.name, data.description, data.base_url,
      status, data.created_by, timestamp, timestamp
    );

    return {
      id,
      name: data.name,
      description: data.description,
      base_url: data.base_url,
      status,
      created_by: data.created_by,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  update(id: string, data: {
    name?: string;
    description?: string | null;
    base_url?: string;
    status?: ServiceStatus;
  }): Service | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: Partial<Service> = {};
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      fields.push('name');
      values.push(data.name);
      updates.name = data.name;
    }
    if (data.description !== undefined) {
      fields.push('description');
      values.push(data.description);
      updates.description = data.description;
    }
    if (data.base_url !== undefined) {
      fields.push('base_url');
      values.push(data.base_url);
      updates.base_url = data.base_url;
    }
    if (data.status !== undefined) {
      fields.push('status');
      values.push(data.status);
      updates.status = data.status;
    }

    if (fields.length === 0) return existing;

    const timestamp = now();
    values.push(timestamp, id);

    const stmt = this.prepareUpdate(fields);
    stmt.run(...values);

    return { ...existing, ...updates, updated_at: timestamp };
  }

  findByStatus(status: ServiceStatus): Service[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE status = ?`);
    return stmt.all(status) as Service[];
  }

  findByCreator(createdBy: string): Service[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE created_by = ?`);
    return stmt.all(createdBy) as Service[];
  }
}
