import { BaseRepository } from './BaseRepository.js';
import type { Merchant } from '../types/index.js';

export class MerchantRepository extends BaseRepository<Merchant> {
  protected tableName = 'merchants';
  protected columns = [
    'id',
    'user_id',
    'name',
    'category',
    'phone',
    'address',
    'description',
    'business_hours',
    'rating',
    'status',
    'created_at',
    'updated_at',
  ];

  public findByCategory(category: string): Merchant[] {
    return this.findAllByField('category', category);
  }

  public findByStatus(status: string): Merchant[] {
    return this.findAllByField('status', status);
  }

  public getApprovedMerchants(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE status = 'approved'`;
    const dataSql = `
      SELECT 
        m.*,
        u.username,
        u.name as contact_name
      FROM ${this.tableName} m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'approved'
      ORDER BY m.rating DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const { total } = this.executeGet<{ total: number }>(countSql) || { total: 0 };
    const items = this.executeQuery(dataSql, [pageSize, offset]);
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getMerchantsWithDetails(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters) {
      if (filters.category) {
        conditions.push('m.category = ?');
        params.push(filters.category);
      }
      if (filters.status) {
        conditions.push('m.status = ?');
        params.push(filters.status);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} m ${whereClause}`;
    const dataSql = `
      SELECT 
        m.*,
        u.username,
        u.name as contact_name,
        (SELECT COUNT(*) FROM market_items mi WHERE mi.merchant_id = m.id) as item_count
      FROM ${this.tableName} m
      LEFT JOIN users u ON m.user_id = u.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countParams = [...params];
    const dataParams = [...params, pageSize, offset];

    const { total } = this.executeGet<{ total: number }>(countSql, countParams) || { total: 0 };
    const items = this.executeQuery(dataSql, dataParams);

    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public searchMerchants(keyword: string, page: number = 1, pageSize: number = 10) {
    const searchPattern = `%${keyword}%`;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE status = 'approved' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)
    `;
    
    const dataSql = `
      SELECT 
        m.*,
        u.username,
        u.name as contact_name
      FROM ${this.tableName} m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'approved' AND (m.name LIKE ? OR m.category LIKE ? OR m.description LIKE ?)
      ORDER BY m.rating DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const { total } = this.executeGet<{ total: number }>(countSql, [searchPattern, searchPattern, searchPattern]) || { total: 0 };
    const items = this.executeQuery(dataSql, [searchPattern, searchPattern, searchPattern, pageSize, offset]);
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public updateRating(merchantId: number, rating: number): boolean {
    const sql = `
      UPDATE ${this.tableName} 
      SET rating = (rating + ?) / 2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const result = this.executeRun(sql, [rating, merchantId]);
    return result.changes > 0;
  }

  public getMerchantStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
      FROM ${this.tableName}
    `;
    return this.executeGet(sql);
  }

  public getCategories() {
    const sql = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM ${this.tableName}
      WHERE status = 'approved'
      GROUP BY category
      ORDER BY count DESC
    `;
    return this.executeQuery<{ category: string; count: number }>(sql);
  }
}

export default MerchantRepository;
