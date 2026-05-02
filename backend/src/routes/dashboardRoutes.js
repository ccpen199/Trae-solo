const express = require('express');
const router = express.Router();
const ReportService = require('../services/reportService');
const ExceptionService = require('../services/exceptionService');
const db = require('../database/init');

router.get('/overview', async (req, res) => {
  try {
    const dashboard = ReportService.getRealTimeDashboard();
    
    res.json({
      success: true,
      ...dashboard
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: '获取仪表盘数据失败'
    });
  }
});

router.get('/daily-stats', async (req, res) => {
  try {
    const { date } = req.query;
    const stats = ReportService.getDailyStatistics(date);
    
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      error: '获取每日统计失败'
    });
  }
});

router.get('/exceptions', async (req, res) => {
  try {
    const { status, order_id } = req.query;
    
    let exceptions;
    if (order_id) {
      exceptions = ExceptionService.getExceptionsByOrder(order_id);
    } else {
      exceptions = ExceptionService.getPendingExceptions();
    }
    
    res.json({
      success: true,
      exceptions
    });
  } catch (error) {
    console.error('Get exceptions error:', error);
    res.status(500).json({
      success: false,
      error: '获取异常列表失败'
    });
  }
});

router.post('/exceptions/:id/handle', async (req, res) => {
  try {
    const { id } = req.params;
    const { handler_id, handler_role, action, comment } = req.body;

    const result = ExceptionService.handleException(
      id, handler_id, handler_role, action, comment
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Handle exception error:', error);
    res.status(500).json({
      success: false,
      error: '处理异常失败'
    });
  }
});

router.get('/driver/:driverId/stats', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { start_date, end_date } = req.query;

    const stats = ReportService.getDriverPerformanceStats(
      driverId, start_date, end_date
    );

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({
      success: false,
      error: '获取司机统计失败'
    });
  }
});

router.get('/passenger/:passengerId/stats', async (req, res) => {
  try {
    const { passengerId } = req.params;
    const { start_date, end_date } = req.query;

    const stats = ReportService.getPassengerStats(
      passengerId, start_date, end_date
    );

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Get passenger stats error:', error);
    res.status(500).json({
      success: false,
      error: '获取乘客统计失败'
    });
  }
});

router.get('/order/:orderId/tracks', async (req, res) => {
  try {
    const { orderId } = req.params;

    const tracks = ExceptionService.getOrderTracks(orderId);

    res.json({
      success: true,
      tracks
    });
  } catch (error) {
    console.error('Get order tracks error:', error);
    res.status(500).json({
      success: false,
      error: '获取轨迹失败'
    });
  }
});

router.post('/snapshot', async (req, res) => {
  try {
    const { snapshot_type = 'daily' } = req.body;

    const result = ReportService.createStatisticsSnapshot(snapshot_type);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Create snapshot error:', error);
    res.status(500).json({
      success: false,
      error: '创建快照失败'
    });
  }
});

router.get('/snapshots', async (req, res) => {
  try {
    const { start_date, end_date, snapshot_type = 'daily' } = req.query;

    const snapshots = ReportService.getStatisticsSnapshots(
      start_date, end_date, snapshot_type
    );

    res.json({
      success: true,
      snapshots
    });
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({
      success: false,
      error: '获取快照失败'
    });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const { target_type, target_id, user_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (target_type) {
      conditions.push('al.target_type = ?');
      params.push(target_type);
    }
    if (target_id) {
      conditions.push('al.target_id = ?');
      params.push(target_id);
    }
    if (user_id) {
      conditions.push('al.user_id = ?');
      params.push(user_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = db.prepare(query).all(...params);

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      error: '获取审计日志失败'
    });
  }
});

module.exports = router;
