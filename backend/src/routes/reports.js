const express = require('express');
const router = express.Router();

module.exports = (db, statusEngine, releaseEngine) => {
  // 获取报表统计
  router.get('/summary', (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // 默认最近30天
      const now = new Date();
      const defaultEnd = now.toISOString();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const stats = releaseEngine.getReportStats(
        startDate || defaultStart,
        endDate || defaultEnd
      );
      
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('获取报表统计错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取按天统计数据
  router.get('/daily', (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const now = new Date();
      const defaultEnd = now.toISOString();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const dailyStats = db.prepare(`
        SELECT 
          date(created_at) as day,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'rolled_back' THEN 1 ELSE 0 END) as rolled_back,
          AVG(total_duration) as avg_duration_seconds
        FROM main_orders 
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY date(created_at)
        ORDER BY day
      `).all(startDate || defaultStart, endDate || defaultEnd);
      
      res.json({ success: true, data: dailyStats });
    } catch (error) {
      console.error('获取按天统计错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取按阶段耗时统计
  router.get('/stage-duration', (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const now = new Date();
      const defaultEnd = now.toISOString();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // 关联主单时间过滤
      const stageStats = db.prepare(`
        SELECT 
          oi.stage_name,
          COUNT(*) as count,
          AVG(oi.duration) as avg_duration_seconds,
          MIN(oi.duration) as min_duration_seconds,
          MAX(oi.duration) as max_duration_seconds,
          SUM(CASE WHEN oi.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN oi.status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM order_items oi
        INNER JOIN main_orders mo ON oi.main_order_id = mo.id
        WHERE mo.created_at >= ? AND mo.created_at <= ?
          AND oi.duration IS NOT NULL
        GROUP BY oi.stage_name
        ORDER BY MIN(oi.stage_order)
      `).all(startDate || defaultStart, endDate || defaultEnd);
      
      const enrichedStats = stageStats.map(s => ({
        ...s,
        stage_name_text: statusEngine.getStageText(s.stage_name)
      }));
      
      res.json({ success: true, data: enrichedStats });
    } catch (error) {
      console.error('获取阶段耗时统计错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取失败原因统计
  router.get('/failure-reasons', (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const now = new Date();
      const defaultEnd = now.toISOString();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // 获取失败的明细项
      const failedItems = db.prepare(`
        SELECT 
          oi.stage_name,
          oi.error_message,
          COUNT(*) as count
        FROM order_items oi
        INNER JOIN main_orders mo ON oi.main_order_id = mo.id
        WHERE mo.created_at >= ? AND mo.created_at <= ?
          AND oi.status = 'failed'
          AND oi.error_message IS NOT NULL
        GROUP BY oi.stage_name, oi.error_message
        ORDER BY count DESC
        LIMIT 20
      `).all(startDate || defaultStart, endDate || defaultEnd);
      
      // 按阶段聚合
      const byStage = db.prepare(`
        SELECT 
          oi.stage_name,
          COUNT(*) as count
        FROM order_items oi
        INNER JOIN main_orders mo ON oi.main_order_id = mo.id
        WHERE mo.created_at >= ? AND mo.created_at <= ?
          AND oi.status = 'failed'
        GROUP BY oi.stage_name
        ORDER BY count DESC
      `).all(startDate || defaultStart, endDate || defaultEnd);
      
      res.json({ 
        success: true, 
        data: {
          byStage: byStage.map(s => ({
            ...s,
            stage_name_text: statusEngine.getStageText(s.stage_name)
          })),
          topReasons: failedItems.map(f => ({
            ...f,
            stage_name_text: statusEngine.getStageText(f.stage_name)
          }))
        }
      });
    } catch (error) {
      console.error('获取失败原因统计错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 获取用户绩效统计
  router.get('/user-performance', (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const now = new Date();
      const defaultEnd = now.toISOString();
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const userStats = db.prepare(`
        SELECT 
          u.id,
          u.name,
          u.username,
          u.role,
          COUNT(DISTINCT mo.id) as total_orders,
          SUM(CASE WHEN mo.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          AVG(oi.duration) as avg_stage_duration_seconds
        FROM users u
        LEFT JOIN order_items oi ON u.id = oi.assignee_id
        LEFT JOIN main_orders mo ON oi.main_order_id = mo.id
        WHERE (mo.created_at >= ? AND mo.created_at <= ?) OR mo.id IS NULL
        GROUP BY u.id, u.name, u.username, u.role
        ORDER BY completed_orders DESC
      `).all(startDate || defaultStart, endDate || defaultEnd);
      
      res.json({ success: true, data: userStats });
    } catch (error) {
      console.error('获取用户绩效统计错误:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
