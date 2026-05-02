const { ReportService } = require('../services/reportService');
const { all } = require('../config/database');

const reportService = new ReportService();

class ReportController {
  async getDashboard(req, res) {
    try {
      const { start_date, end_date, user_uuid } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;
      if (user_uuid) filters.user_uuid = user_uuid;

      const [taskStats, progressStats, rewardStats, conversionFunnel] = await Promise.all([
        reportService.getTaskStatistics(filters),
        reportService.getProgressStatistics(filters),
        reportService.getRewardStatistics(filters),
        reportService.getConversionFunnel(filters)
      ]);

      res.json({
        success: true,
        data: {
          taskStats,
          progressStats,
          rewardStats,
          conversionFunnel
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getTaskStatistics(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const stats = await reportService.getTaskStatistics(filters);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProgressStatistics(req, res) {
    try {
      const { start_date, end_date, user_uuid } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;
      if (user_uuid) filters.user_uuid = user_uuid;

      const stats = await reportService.getProgressStatistics(filters);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRewardStatistics(req, res) {
    try {
      const { start_date, end_date, user_uuid } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;
      if (user_uuid) filters.user_uuid = user_uuid;

      const stats = await reportService.getRewardStatistics(filters);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getConversionFunnel(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const funnel = await reportService.getConversionFunnel(filters);
      
      res.json({
        success: true,
        data: funnel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getProcessingTimeAnalysis(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const analysis = await reportService.getProcessingTimeAnalysis(filters);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getExceptionAnalysis(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const analysis = await reportService.getExceptionAnalysis(filters);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getRevenueAnalysis(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const filters = {};
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const analysis = await reportService.getRevenueAnalysis(filters);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAuditTrail(req, res) {
    try {
      const { target_type, target_uuid } = req.params;
      
      const auditTrail = await reportService.getDetailedAuditTrail(target_type, target_uuid);
      
      res.json({
        success: true,
        data: auditTrail
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getCrossReference(req, res) {
    try {
      const { source_type, source_uuid } = req.params;
      
      const data = await reportService.getCrossReferenceData(source_type, source_uuid);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAllAuditLogs(req, res) {
    try {
      const { page = 1, page_size = 20, operator_role, action_type, target_type } = req.query;
      
      let sql = `SELECT 
                    al.*,
                    u.nickname as operator_name,
                    r.role_name as operator_role_name
                  FROM audit_logs al
                  LEFT JOIN users u ON al.operator_uuid = u.user_uuid
                  LEFT JOIN roles r ON al.operator_role = r.role_code
                  WHERE 1=1`;
      const params = [];

      if (operator_role) {
        sql += ' AND al.operator_role = ?';
        params.push(operator_role);
      }

      if (action_type) {
        sql += ' AND al.action_type = ?';
        params.push(action_type);
      }

      if (target_type) {
        sql += ' AND al.target_type = ?';
        params.push(target_type);
      }

      sql += ' ORDER BY al.created_at DESC';
      
      const offset = (page - 1) * page_size;
      sql += ` LIMIT ? OFFSET ?`;
      params.push(parseInt(page_size), offset);

      const logs = await all(sql, params);
      
      let countSql = `SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1`;
      const countParams = [];

      if (operator_role) {
        countSql += ' AND al.operator_role = ?';
        countParams.push(operator_role);
      }

      if (action_type) {
        countSql += ' AND al.action_type = ?';
        countParams.push(action_type);
      }

      if (target_type) {
        countSql += ' AND al.target_type = ?';
        countParams.push(target_type);
      }

      const countResult = await all(countSql, countParams);
      const total = countResult[0]?.total || 0;

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            page_size: parseInt(page_size),
            total,
            total_pages: Math.ceil(total / page_size)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = { ReportController };
