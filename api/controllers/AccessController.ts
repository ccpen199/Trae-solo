import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository.js';
import type { AccessLog } from '../types/index.js';

class AccessLogRepository extends BaseRepository<AccessLog> {
  protected tableName = 'access_logs';
  protected columns = ['id', 'user_id', 'resident_name', 'phone', 'access_type', 'location', 'device', 'remark', 'created_at'];

  getRecentLogs(limit: number = 50) {
    const sql = `
      SELECT al.*, u.name as user_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    return this.executeQuery(sql, [limit]);
  }

  getLogsByDateRange(startDate: string, endDate: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM access_logs 
      WHERE DATE(created_at) BETWEEN ? AND ?
    `;
    
    const dataSql = `
      SELECT al.*, u.name as user_name
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE DATE(al.created_at) BETWEEN ? AND ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countResult = this.executeGet<{ total: number }>(countSql, [startDate, endDate]);
    const items = this.executeQuery(dataSql, [startDate, endDate, pageSize, offset]);
    
    return {
      items,
      total: countResult?.total || 0,
      page,
      page_size: pageSize,
    };
  }

  getAccessStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN access_type LIKE 'enter%' THEN 1 ELSE 0 END) as entries,
        SUM(CASE WHEN access_type LIKE 'exit%' THEN 1 ELSE 0 END) as exits,
        SUM(CASE WHEN access_type LIKE 'visitor%' THEN 1 ELSE 0 END) as visitors,
        DATE(created_at) as date
      FROM access_logs
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    return this.executeQuery(sql, [weekAgo, today]);
  }
}

const accessLogRepo = new AccessLogRepository();

export const AccessController = {
  async getAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      let result;
      if (startDate && endDate) {
        result = accessLogRepo.getLogsByDateRange(startDate, endDate, page, pageSize);
      } else {
        const items = accessLogRepo.getRecentLogs(pageSize * page);
        result = {
          items: items.slice((page - 1) * pageSize, page * pageSize),
          total: items.length,
          page,
          page_size: pageSize,
        };
      }

      res.json({
        success: true,
        data: result.items,
        total: result.total,
        page: result.page,
        page_size: result.page_size,
      });
    } catch (error) {
      console.error('Get access logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get access logs',
      });
    }
  },

  async createAccessLog(req: Request, res: Response): Promise<void> {
    try {
      const { user_id, resident_name, phone, access_type, location, device, remark } = req.body;

      if (!access_type || !location) {
        res.status(400).json({
          success: false,
          error: 'Access type and location are required',
        });
        return;
      }

      const log = await accessLogRepo.create({
        user_id: user_id || null,
        resident_name: resident_name || '',
        phone: phone || '',
        access_type,
        location,
        device: device || '',
        remark: remark || '',
      });

      res.json({
        success: true,
        data: log,
        message: 'Access log created successfully',
      });
    } catch (error) {
      console.error('Create access log error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create access log',
      });
    }
  },

  async getAccessStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = accessLogRepo.getAccessStats();
      const recent = accessLogRepo.getRecentLogs(10);

      res.json({
        success: true,
        data: {
          daily_stats: stats,
          recent_logs: recent,
        },
      });
    } catch (error) {
      console.error('Get access stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get access stats',
      });
    }
  },
};

export default AccessController;
