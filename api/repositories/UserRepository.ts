import { BaseRepository } from './BaseRepository.js';
import type { User } from '../types/index.js';

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';
  protected columns = [
    'id',
    'username',
    'password',
    'role',
    'name',
    'phone',
    'avatar',
    'skills',
    'status',
    'created_at',
    'updated_at',
  ];

  public findByUsername(username: string): User | null {
    return this.findByField('username', username);
  }

  public findByRole(role: string): User[] {
    return this.findAllByField('role', role);
  }

  public findActivePropertyStaff(): User[] {
    const sql = `
      SELECT ${this.columns.join(', ')} 
      FROM ${this.tableName} 
      WHERE role = 'property' AND status = 'active'
      ORDER BY id ASC
    `;
    return this.executeQuery<User>(sql);
  }

  public searchUsers(keyword: string, page: number = 1, pageSize: number = 10) {
    const searchPattern = `%${keyword}%`;
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE username LIKE ? OR name LIKE ? OR phone LIKE ?
    `;
    
    const dataSql = `
      SELECT ${this.columns.join(', ')} 
      FROM ${this.tableName} 
      WHERE username LIKE ? OR name LIKE ? OR phone LIKE ?
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;
    
    const countStmt = this.db.prepare(countSql);
    const dataStmt = this.db.prepare(dataSql);
    
    const { total } = countStmt.get(searchPattern, searchPattern, searchPattern) as { total: number };
    const items = dataStmt.all(searchPattern, searchPattern, searchPattern, pageSize, offset) as User[];
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public getStaffPerformance(staffId: number) {
    const sql = `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tickets,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tickets,
        AVG(CASE WHEN status = 'completed' AND rating IS NOT NULL THEN rating ELSE NULL END) as avg_rating
      FROM work_tickets 
      WHERE assignee_id = ?
    `;
    return this.executeGet(sql, [staffId]);
  }

  public getStaffFulfillmentRate(staffId: number): number {
    const sql = `
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0.85
          ELSE CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS REAL) / COUNT(*)
        END as fulfillment_rate
      FROM work_tickets 
      WHERE assignee_id = ? AND status IN ('completed', 'cancelled')
    `;
    const result = this.executeGet<{ fulfillment_rate: number }>(sql, [staffId]);
    return result?.fulfillment_rate || 0.85;
  }

  public getStaffResponseTime(staffId: number): number {
    const sql = `
      SELECT 
        AVG(
          CASE 
            WHEN scheduled_at IS NOT NULL AND created_at IS NOT NULL 
            THEN julianday(scheduled_at) - julianday(created_at)
            ELSE 0.5
          END
        ) as avg_response_days
      FROM work_tickets 
      WHERE assignee_id = ? AND scheduled_at IS NOT NULL
    `;
    const result = this.executeGet<{ avg_response_days: number }>(sql, [staffId]);
    return result?.avg_response_days || 0.5;
  }
}

export default UserRepository;
