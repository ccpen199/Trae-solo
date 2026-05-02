import { APIKey } from '../domains/core/types.js';
import { BaseRepository } from './base.repository.js';
import { generateId, now } from '../utils/index.js';

export class APIKeyRepository extends BaseRepository<APIKey> {
  constructor() {
    super('api_keys');
  }

  create(data: {
    service_id: string;
    key_hash: string;
    key_prefix: string;
    created_by: string;
    rate_limit?: number;
    rate_window?: number;
    expires_at?: number | null;
  }): APIKey {
    const id = generateId();
    const timestamp = now();
    const rate_limit = data.rate_limit || 1000;
    const rate_window = data.rate_window || 60;

    const stmt = this.prepareInsert([
      'id', 'service_id', 'key_hash', 'key_prefix', 'status',
      'rate_limit', 'rate_window', 'created_by', 'created_at', 'expires_at'
    ]);
    
    stmt.run(
      id, data.service_id, data.key_hash, data.key_prefix, 'ACTIVE',
      rate_limit, rate_window, data.created_by, timestamp, data.expires_at || null
    );

    return {
      id,
      service_id: data.service_id,
      key_hash: data.key_hash,
      key_prefix: data.key_prefix,
      status: 'ACTIVE',
      rate_limit,
      rate_window,
      created_by: data.created_by,
      created_at: timestamp,
      expires_at: data.expires_at || null,
    };
  }

  findByKeyHash(keyHash: string): APIKey | null {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE key_hash = ?`);
    const result = stmt.get(keyHash) as APIKey | undefined;
    return result || null;
  }

  findByServiceId(serviceId: string): APIKey[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE service_id = ?`);
    return stmt.all(serviceId) as APIKey[];
  }

  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'REVOKED'): APIKey | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const timestamp = now();
    const stmt = this.db.prepare(
      `UPDATE ${this.tableName} SET status = ?, updated_at = ? WHERE id = ?`
    );
    stmt.run(status, timestamp, id);

    return { ...existing, status, updated_at: timestamp };
  }
}
