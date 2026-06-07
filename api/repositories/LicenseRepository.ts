import { BaseRepository } from './BaseRepository.js';
import { License, LicenseUsageRecord } from '../types/index.js';
import db from '../db.js';

export class LicenseRepository extends BaseRepository<License> {
  constructor() {
    super('licenses');
  }

  findByUserId(userId: number): License[] {
    return this.findManyByField('user_id', userId);
  }

  findByUserIdAndType(userId: number, licenseType: string): License | undefined {
    const stmt = db.prepare(`
      SELECT * FROM licenses 
      WHERE user_id = ? AND license_type = ? AND status = 'valid'
      LIMIT 1
    `);
    return stmt.get(userId, licenseType) as License | undefined;
  }

  addUsageRecord(record: Omit<LicenseUsageRecord, 'id' | 'usedAt'>): number {
    const stmt = db.prepare(`
      INSERT INTO license_usage_records (license_id, used_by, purpose, location)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(record.licenseId, record.usedBy, record.purpose, record.location);
    return Number(result.lastInsertRowid);
  }

  getUsageRecords(licenseId: number): LicenseUsageRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM license_usage_records 
      WHERE license_id = ? 
      ORDER BY used_at DESC
    `);
    return stmt.all(licenseId) as LicenseUsageRecord[];
  }
}
