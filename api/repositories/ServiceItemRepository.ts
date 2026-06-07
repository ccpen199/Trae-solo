import db from '../db.js';
import { BaseRepository } from './BaseRepository.js';
import { ServiceItem } from '../types/index.js';

export class ServiceItemRepository extends BaseRepository<ServiceItem> {
  constructor() {
    super('service_items');
  }

  search(keyword: string, category: string, page: number = 1, pageSize: number = 10) {
    const conditions: string[] = ['status = ?'];
    const params: any[] = ['online'];
    
    if (keyword) {
      conditions.push('(name LIKE ? OR code LIKE ? OR department LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    
    const where = conditions.join(' AND ');
    const result = this.paginate(page, pageSize, where, params);

    if (keyword && result.total === 0) {
      const fallbackConditions: string[] = ['status = ?'];
      const fallbackParams: any[] = ['online'];

      if (category && category !== 'all') {
        fallbackConditions.push('category = ?');
        fallbackParams.push(category);
      }

      return this.paginate(page, pageSize, fallbackConditions.join(' AND '), fallbackParams);
    }

    return result;
  }

  findByCode(code: string): ServiceItem | undefined {
    return this.findByField('code', code);
  }

  getAllCategories(): string[] {
    const stmt = db.prepare(`
      SELECT DISTINCT category FROM service_items 
      WHERE status = ? AND category IS NOT NULL
    `);
    const rows = stmt.all('online') as Array<{ category: string }>;
    return rows.map(r => r.category);
  }

  incrementRunningCount(id: number): void {
    const stmt = db.prepare(`
      UPDATE service_items 
      SET running_count = running_count + 1
      WHERE id = ?
    `);
    stmt.run(id);
  }
}
