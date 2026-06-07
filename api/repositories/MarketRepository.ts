import { BaseRepository } from './BaseRepository.js';
import type { MarketItem } from '../types/index.js';

export class MarketRepository extends BaseRepository<MarketItem> {
  protected tableName = 'market_items';
  protected columns = [
    'id',
    'merchant_id',
    'title',
    'description',
    'category',
    'price',
    'original_price',
    'images',
    'stock',
    'status',
    'created_at',
    'updated_at',
  ];

  public findByMerchant(merchantId: number): MarketItem[] {
    return this.findAllByField('merchant_id', merchantId);
  }

  public findByCategory(category: string): MarketItem[] {
    return this.findAllByField('category', category);
  }

  public findByStatus(status: string): MarketItem[] {
    return this.findAllByField('status', status);
  }

  public getOnSaleItems(page: number = 1, pageSize: number = 20, filters?: Record<string, unknown>) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = ['status = ?'];
    const params: unknown[] = ['on_sale'];

    if (filters) {
      if (filters.category) {
        conditions.push('category = ?');
        params.push(filters.category);
      }
      if (filters.merchant_id) {
        conditions.push('merchant_id = ?');
        params.push(filters.merchant_id);
      }
      if (filters.min_price !== undefined) {
        conditions.push('price >= ?');
        params.push(filters.min_price);
      }
      if (filters.max_price !== undefined) {
        conditions.push('price <= ?');
        params.push(filters.max_price);
      }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
    const dataSql = `
      SELECT 
        mi.*,
        m.name as merchant_name,
        m.phone as merchant_phone,
        m.address as merchant_address
      FROM ${this.tableName} mi
      LEFT JOIN merchants m ON mi.merchant_id = m.id
      ${whereClause}
      ORDER BY mi.created_at DESC
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

  public getItemsWithDetails(page: number = 1, pageSize: number = 10, filters?: Record<string, unknown>) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters) {
      if (filters.category) {
        conditions.push('mi.category = ?');
        params.push(filters.category);
      }
      if (filters.merchant_id) {
        conditions.push('mi.merchant_id = ?');
        params.push(filters.merchant_id);
      }
      if (filters.status) {
        conditions.push('mi.status = ?');
        params.push(filters.status);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} mi ${whereClause}`;
    const dataSql = `
      SELECT 
        mi.*,
        m.name as merchant_name,
        m.phone as merchant_phone
      FROM ${this.tableName} mi
      LEFT JOIN merchants m ON mi.merchant_id = m.id
      ${whereClause}
      ORDER BY mi.created_at DESC
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

  public searchItems(keyword: string, page: number = 1, pageSize: number = 20) {
    const searchPattern = `%${keyword}%`;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE status = 'on_sale' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)
    `;
    
    const dataSql = `
      SELECT 
        mi.*,
        m.name as merchant_name,
        m.phone as merchant_phone
      FROM ${this.tableName} mi
      LEFT JOIN merchants m ON mi.merchant_id = m.id
      WHERE mi.status = 'on_sale' AND (mi.title LIKE ? OR mi.description LIKE ? OR mi.category LIKE ?)
      ORDER BY mi.created_at DESC
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

  public updateStock(itemId: number, quantity: number): boolean {
    const sql = `
      UPDATE ${this.tableName} 
      SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND stock + ? >= 0
    `;
    const result = this.executeRun(sql, [quantity, itemId, quantity]);
    return result.changes > 0;
  }

  public getItemWithMerchant(itemId: number) {
    const sql = `
      SELECT 
        mi.*,
        m.name as merchant_name,
        m.phone as merchant_phone,
        m.address as merchant_address,
        m.business_hours,
        m.rating as merchant_rating
      FROM ${this.tableName} mi
      LEFT JOIN merchants m ON mi.merchant_id = m.id
      WHERE mi.id = ?
    `;
    return this.executeGet(sql, [itemId]);
  }

  public getMarketStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'on_sale' THEN 1 ELSE 0 END) as on_sale,
        SUM(CASE WHEN status = 'off_sale' THEN 1 ELSE 0 END) as off_sale,
        SUM(CASE WHEN status = 'sold_out' THEN 1 ELSE 0 END) as sold_out,
        SUM(stock) as total_stock,
        AVG(price) as avg_price
      FROM ${this.tableName}
    `;
    return this.executeGet(sql);
  }

  public getCategories() {
    const sql = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM ${this.tableName}
      WHERE status = 'on_sale'
      GROUP BY category
      ORDER BY count DESC
    `;
    return this.executeQuery<{ category: string; count: number }>(sql);
  }
}

export default MarketRepository;
