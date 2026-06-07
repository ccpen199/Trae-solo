import { BaseRepository } from './BaseRepository.js';
import { ApiResource } from '../types/index.js';
import db from '../db.js';

export class ApiResourceRepository extends BaseRepository<ApiResource> {
  constructor() {
    super('api_resources');
  }

  search(keyword: string, page: number = 1, pageSize: number = 10) {
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (keyword) {
      conditions.push('(name LIKE ? OR code LIKE ? OR provider LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    const where = conditions.length > 0 ? conditions.join(' AND ') : undefined;
    return this.paginate(page, pageSize, where, params);
  }

  getCallLogs(apiResourceId: number, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM api_call_logs 
      WHERE api_resource_id = ?
    `);
    const { count } = countStmt.get(apiResourceId) as { count: number };
    
    const dataStmt = db.prepare(`
      SELECT * FROM api_call_logs 
      WHERE api_resource_id = ?
      ORDER BY request_time DESC
      LIMIT ? OFFSET ?
    `);
    const data = dataStmt.all(apiResourceId, pageSize, offset);
    
    return { data, total: count, page, pageSize };
  }

  recordCall(apiResourceId: number, responseTime: number, statusCode: number, errorMessage?: string): number {
    const stmt = db.prepare(`
      INSERT INTO api_call_logs (api_resource_id, response_time, status_code, error_message)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(apiResourceId, responseTime, statusCode, errorMessage);
    
    const updateStmt = db.prepare(`
      UPDATE api_resources 
      SET 
        call_count = call_count + 1,
        avg_response_time = (avg_response_time * call_count + ?) / (call_count + 1),
        error_rate = CASE WHEN ? >= 400 THEN (error_rate * call_count + 1) / (call_count + 1) ELSE error_rate END,
        last_called_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(responseTime, statusCode, apiResourceId);
    
    return Number(result.lastInsertRowid);
  }
}
