import express from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { parseJSON } from '../utils';

const router = express.Router();

router.use(authMiddleware(['admin', 'advisor']));

router.get('/dashboard', (req: AuthRequest, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get() as { count: number };
  const activeUsers = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count 
    FROM workout_records 
    WHERE start_time >= DATE('now', '-7 days')
  `).get() as { count: number };
  const totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices WHERE status = "active"').get() as { count: number };
  const totalWorkouts = db.prepare('SELECT COUNT(*) as count FROM workout_records WHERE status = "completed"').get() as { count: number };
  const totalPlans = db.prepare('SELECT COUNT(*) as count FROM training_plans WHERE status = "active"').get() as { count: number };
  const pendingAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE status = "pending"').get() as { count: number };
  const criticalAlerts = db.prepare(`
    SELECT COUNT(*) as count FROM alerts 
    WHERE status = 'pending' AND severity IN ('high', 'critical')
  `).get() as { count: number };
  const totalCoaches = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "coach"').get() as { count: number };
  
  const completionRateSql = `
    SELECT 
      COUNT(DISTINCT tp.id) as total_plans,
      COUNT(DISTINCT wr.id) as completed_workouts
    FROM training_plans tp
    LEFT JOIN workout_records wr ON tp.id = wr.plan_id 
      AND wr.status = 'completed' 
      AND wr.start_time >= DATE('now', '-30 days')
    WHERE tp.status = 'active'
  `;
  const completionData = db.prepare(completionRateSql).get() as any;
  
  const planCompletionRate = completionData.total_plans > 0 
    ? Math.round((completionData.completed_workouts / (completionData.total_plans * 7)) * 100) 
    : 0;

  const retentionSql = `
    WITH weekly_active AS (
      SELECT DISTINCT user_id, DATE(start_time, 'weekday 0', '-7 days') as week
      FROM workout_records
      WHERE start_time >= DATE('now', '-60 days')
    )
    SELECT 
      week,
      COUNT(*) as active_users
    FROM weekly_active
    GROUP BY week
    ORDER BY week DESC
    LIMIT 4
  `;
  const retentionData = db.prepare(retentionSql).all();

  const syncRateSql = `
    SELECT 
      COUNT(DISTINCT d.id) as total_devices,
      COUNT(DISTINCT CASE WHEN d.last_sync_at >= DATETIME('now', '-24 hours') THEN d.id END) as synced_today,
      COUNT(DISTINCT CASE WHEN d.status = 'disconnected' THEN d.id END) as disconnected
    FROM devices d
  `;
  const syncData = db.prepare(syncRateSql).get() as any;
  
  const syncSuccessRate = syncData.total_devices > 0 
    ? Math.round((syncData.synced_today / syncData.total_devices) * 100) 
    : 0;

  const anomalyTypesSql = `
    SELECT alert_type, severity, COUNT(*) as count
    FROM alerts
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY alert_type, severity
    ORDER BY count DESC
  `;
  const anomalyTypes = db.prepare(anomalyTypesSql).all();

  const courseConversionSql = `
    SELECT 
      COUNT(DISTINCT tp.user_id) as total_users,
      COUNT(DISTINCT CASE WHEN tp.generated_by = 'coach' THEN tp.user_id END) as coach_adjusted_users
    FROM training_plans tp
    WHERE tp.created_at >= DATE('now', '-30 days')
  `;
  const conversionData = db.prepare(courseConversionSql).get() as any;
  
  const coachConversionRate = conversionData.total_users > 0
    ? Math.round((conversionData.coach_adjusted_users / conversionData.total_users) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      overview: {
        total_users: totalUsers.count,
        active_users_7d: activeUsers.count,
        total_devices: totalDevices.count,
        total_workouts: totalWorkouts.count,
        active_plans: totalPlans.count,
        pending_alerts: pendingAlerts.count,
        critical_alerts: criticalAlerts.count,
        total_coaches: totalCoaches.count
      },
      rates: {
        plan_completion_rate: planCompletionRate,
        sync_success_rate: syncSuccessRate,
        coach_conversion_rate: coachConversionRate
      },
      weekly_retention: retentionData,
      device_sync_stats: syncData,
      anomaly_types: anomalyTypes
    }
  });
});

router.get('/users', (req: AuthRequest, res) => {
  const { role, status, page = 1, page_size = 20 } = req.query;
  
  let sql = `
    SELECT u.*, 
           COUNT(DISTINCT d.id) as device_count,
           COUNT(DISTINCT wr.id) as workout_count,
           COUNT(DISTINCT tp.id) as plan_count,
           COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as alert_count
    FROM users u
    LEFT JOIN devices d ON u.id = d.user_id AND d.status = 'active'
    LEFT JOIN workout_records wr ON u.id = wr.user_id AND wr.start_time >= DATE('now', '-30 days')
    LEFT JOIN training_plans tp ON u.id = tp.user_id AND tp.status = 'active'
    LEFT JOIN alerts a ON u.id = a.user_id AND a.status = 'pending'
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (role) {
    sql += ' AND u.role = ?';
    params.push(role);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...params) as { total: number };
  
  sql += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));
  
  const stmt = db.prepare(sql);
  const users = stmt.all(...params);
  
  res.json({
    success: true,
    data: {
      list: users,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

router.get('/operation-logs', (req: AuthRequest, res) => {
  const { entity_type, operation_type, user_id, page = 1, page_size = 20 } = req.query;
  
  let sql = `
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (entity_type) {
    sql += ' AND ol.entity_type = ?';
    params.push(entity_type);
  }
  
  if (operation_type) {
    sql += ' AND ol.operation_type = ?';
    params.push(operation_type);
  }
  
  if (user_id) {
    sql += ' AND ol.user_id = ?';
    params.push(user_id);
  }
  
  const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
  const countStmt = db.prepare(countSql);
  const { total } = countStmt.get(...params) as { total: number };
  
  sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size as string), (parseInt(page as string) - 1) * parseInt(page_size as string));
  
  const stmt = db.prepare(sql);
  const logs = stmt.all(...params);
  
  res.json({
    success: true,
    data: {
      list: logs,
      total,
      page: parseInt(page as string),
      page_size: parseInt(page_size as string)
    }
  });
});

router.get('/entity-history/:entity_type/:entity_id', (req: AuthRequest, res) => {
  const { entity_type, entity_id } = req.params;
  
  const sql = `
    SELECT ol.*, u.name as user_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE ol.entity_type = ? AND ol.entity_id = ?
    ORDER BY ol.created_at DESC
  `;
  
  const stmt = db.prepare(sql);
  const history = stmt.all(entity_type, entity_id);
  
  res.json({ success: true, data: history });
});

router.get('/anomaly-report', (req: AuthRequest, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = "DATE('now', '-30 days')";
  if (start_date) dateFilter = `'${start_date}'`;
  let endFilter = "DATE('now')";
  if (end_date) endFilter = `'${end_date}'`;
  
  const anomalyByTypeSql = `
    SELECT 
      alert_type,
      severity,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
    FROM alerts
    WHERE DATE(created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY alert_type, severity
    ORDER BY total DESC
  `;
  const anomalyByType = db.prepare(anomalyByTypeSql).all();
  
  const anomalyByDaySql = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
      COUNT(CASE WHEN severity = 'high' THEN 1 END) as high
    FROM alerts
    WHERE DATE(created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  const anomalyByDay = db.prepare(anomalyByDaySql).all();
  
  const deviceAnomaliesSql = `
    SELECT 
      d.device_name,
      u.name as user_name,
      COUNT(*) as anomaly_count
    FROM device_data dd
    JOIN devices d ON dd.device_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE dd.status = 'anomalous' AND DATE(dd.created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY d.id
    ORDER BY anomaly_count DESC
    LIMIT 10
  `;
  const deviceAnomalies = db.prepare(deviceAnomaliesSql).all();
  
  res.json({
    success: true,
    data: {
      by_type: anomalyByType,
      by_day: anomalyByDay,
      top_devices: deviceAnomalies
    }
  });
});

router.get('/sync-report', (req: AuthRequest, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = "DATE('now', '-30 days')";
  if (start_date) dateFilter = `'${start_date}'`;
  let endFilter = "DATE('now')";
  if (end_date) endFilter = `'${end_date}'`;
  
  const syncStatsSql = `
    SELECT 
      sb.status,
      COUNT(*) as count,
      SUM(sb.total_records) as total_records,
      SUM(sb.success_count) as success_records,
      SUM(sb.duplicate_count) as duplicate_records,
      SUM(sb.error_count) as error_records,
      AVG(sb.retry_count) as avg_retries
    FROM sync_batches sb
    WHERE DATE(sb.created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY sb.status
  `;
  const syncStats = db.prepare(syncStatsSql).all();
  
  const syncByDeviceSql = `
    SELECT 
      d.device_name,
      u.name as user_name,
      COUNT(*) as sync_count,
      SUM(sb.total_records) as total_records,
      SUM(sb.duplicate_count) as duplicates
    FROM sync_batches sb
    JOIN devices d ON sb.device_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE DATE(sb.created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY d.id
    ORDER BY sync_count DESC
    LIMIT 10
  `;
  const syncByDevice = db.prepare(syncByDeviceSql).all();
  
  const syncByHourSql = `
    SELECT 
      strftime('%H', created_at) as hour,
      COUNT(*) as count
    FROM sync_batches
    WHERE DATE(created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY strftime('%H', created_at)
    ORDER BY hour
  `;
  const syncByHour = db.prepare(syncByHourSql).all();
  
  res.json({
    success: true,
    data: {
      status_breakdown: syncStats,
      top_devices: syncByDevice,
      hourly_distribution: syncByHour
    }
  });
});

router.get('/plan-completion-report', (req: AuthRequest, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = "DATE('now', '-30 days')";
  if (start_date) dateFilter = `'${start_date}'`;
  let endFilter = "DATE('now')";
  if (end_date) endFilter = `'${end_date}'`;
  
  const byPlanTypeSql = `
    SELECT 
      tp.plan_type,
      COUNT(*) as total_plans,
      COUNT(CASE WHEN tp.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN tp.status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN tp.status = 'cancelled' THEN 1 END) as cancelled,
      COUNT(CASE WHEN tp.status = 'rejected' THEN 1 END) as rejected
    FROM training_plans tp
    WHERE DATE(tp.created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY tp.plan_type
  `;
  const byPlanType = db.prepare(byPlanTypeSql).all();
  
  const byCoachSql = `
    SELECT 
      u.name as coach_name,
      COUNT(DISTINCT tp.user_id) as user_count,
      COUNT(*) as plan_count,
      COUNT(CASE WHEN tp.generated_by = 'coach' THEN 1 END) as coach_generated
    FROM training_plans tp
    LEFT JOIN users u ON tp.created_by = u.id AND u.role = 'coach'
    WHERE DATE(tp.created_at) BETWEEN ${dateFilter} AND ${endFilter}
    GROUP BY tp.created_by
    ORDER BY plan_count DESC
  `;
  const byCoach = db.prepare(byCoachSql).all();
  
  res.json({
    success: true,
    data: {
      by_plan_type: byPlanType,
      by_coach: byCoach
    }
  });
});

export default router;
