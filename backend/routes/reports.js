const express = require('express');
const XLSX = require('xlsx');
const db = require('../database');
const router = express.Router();

router.get('/summary', (req, res) => {
  const { start_time, end_time } = req.query;
  
  let timeCondition = '1=1';
  const params = [];
  
  if (start_time) {
    timeCondition += ' AND collected_at >= ?';
    params.push(start_time);
  }
  if (end_time) {
    timeCondition += ' AND collected_at <= ?';
    params.push(end_time);
  }
  
  const pointStats = db.prepare(`
    SELECT 
      mp.id,
      mp.name as point_name,
      mp.device_code,
      mp.responsible_unit,
      mp.construction_stage,
      COUNT(md.id) as total_records,
      SUM(CASE WHEN md.is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_count,
      ROUND(AVG(md.pm25), 2) as avg_pm25,
      ROUND(AVG(md.pm10), 2) as avg_pm10,
      ROUND(AVG(md.noise), 2) as avg_noise
    FROM monitoring_points mp
    LEFT JOIN monitoring_data md ON mp.id = md.point_id AND ${timeCondition}
    GROUP BY mp.id
    ORDER BY anomaly_count DESC
  `).all(...params);
  
  const alertStats = db.prepare(`
    SELECT 
      alert_type,
      COUNT(*) as count,
      ROUND(AVG(value), 2) as avg_value
    FROM alerts
    WHERE created_at >= COALESCE(?, created_at) 
      AND created_at <= COALESCE(?, created_at)
    GROUP BY alert_type
  `).all(start_time || null, end_time || null);
  
  const taskStats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM rectification_tasks
    WHERE created_at >= COALESCE(?, created_at) 
      AND created_at <= COALESCE(?, created_at)
    GROUP BY status
  `).all(start_time || null, end_time || null);
  
  res.json({
    point_stats: pointStats,
    alert_stats: alertStats,
    task_stats: taskStats
  });
});

router.get('/by-point', (req, res) => {
  const { point_id, start_time, end_time, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT 
      mp.id,
      mp.name as point_name,
      mp.device_code,
      mp.responsible_unit,
      COUNT(md.id) as total_records,
      SUM(CASE WHEN md.is_anomaly = 1 THEN 1 ELSE 0 END) as anomaly_count,
      ROUND(AVG(md.pm25), 2) as avg_pm25,
      ROUND(AVG(md.pm10), 2) as avg_pm10,
      ROUND(AVG(md.noise), 2) as avg_noise,
      MIN(md.collected_at) as first_record,
      MAX(md.collected_at) as last_record
    FROM monitoring_points mp
    LEFT JOIN monitoring_data md ON mp.id = md.point_id
    WHERE 1=1
  `;
  let countQuery = 'SELECT COUNT(DISTINCT mp.id) as total FROM monitoring_points mp WHERE 1=1';
  const params = [];
  const countParams = [];
  
  if (point_id) {
    query += ' AND mp.id = ?';
    countQuery += ' AND mp.id = ?';
    params.push(point_id);
    countParams.push(point_id);
  }
  
  if (start_time) {
    query += ' AND md.collected_at >= ?';
    params.push(start_time);
  }
  
  if (end_time) {
    query += ' AND md.collected_at <= ?';
    params.push(end_time);
  }
  
  query += ' GROUP BY mp.id ORDER BY anomaly_count DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const data = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data, total });
});

router.get('/by-alert', (req, res) => {
  const { alert_type, status, start_time, end_time, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT 
      a.*,
      mp.name as point_name,
      mp.device_code,
      mp.responsible_unit,
      rt.task_no,
      rt.status as task_status
    FROM alerts a
    LEFT JOIN monitoring_points mp ON a.point_id = mp.id
    LEFT JOIN rectification_tasks rt ON a.id = rt.alert_id
    WHERE 1=1
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1';
  const params = [];
  const countParams = [];
  
  if (alert_type) {
    query += ' AND a.alert_type = ?';
    countQuery += ' AND alert_type = ?';
    params.push(alert_type);
    countParams.push(alert_type);
  }
  
  if (status) {
    query += ' AND a.status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  
  if (start_time) {
    query += ' AND a.created_at >= ?';
    countQuery += ' AND created_at >= ?';
    params.push(start_time);
    countParams.push(start_time);
  }
  
  if (end_time) {
    query += ' AND a.created_at <= ?';
    countQuery += ' AND created_at <= ?';
    params.push(end_time);
    countParams.push(end_time);
  }
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const data = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data, total });
});

router.get('/export', (req, res) => {
  const { type, start_time, end_time } = req.query;
  
  let data = [];
  
  if (type === 'alerts') {
    data = db.prepare(`
      SELECT 
        a.id,
        mp.name as 点位名称,
        mp.device_code as 设备编号,
        mp.responsible_unit as 责任单位,
        a.alert_type as 预警类型,
        a.parameter as 参数,
        a.value as 监测值,
        a.threshold as 阈值,
        a.status as 状态,
        a.created_at as 创建时间
      FROM alerts a
      LEFT JOIN monitoring_points mp ON a.point_id = mp.id
      WHERE a.created_at >= COALESCE(?, a.created_at) 
        AND a.created_at <= COALESCE(?, a.created_at)
      ORDER BY a.created_at DESC
    `).all(start_time || null, end_time || null);
  } else if (type === 'tasks') {
    data = db.prepare(`
      SELECT 
        rt.id,
        rt.task_no as 任务编号,
        mp.name as 点位名称,
        mp.device_code as 设备编号,
        mp.responsible_unit as 责任单位,
        a.alert_type as 预警类型,
        CASE WHEN rt.sprinkler_activated = 1 THEN '是' ELSE '否' END as 喷淋开启,
        CASE WHEN rt.work_stopped = 1 THEN '是' ELSE '否' END as 停工措施,
        rt.measures as 整改措施,
        rt.review_result as 复核结果,
        rt.status as 状态,
        rt.created_at as 创建时间,
        rt.reviewed_at as 复核时间
      FROM rectification_tasks rt
      LEFT JOIN monitoring_points mp ON rt.point_id = mp.id
      LEFT JOIN alerts a ON rt.alert_id = a.id
      WHERE rt.created_at >= COALESCE(?, rt.created_at) 
        AND rt.created_at <= COALESCE(?, rt.created_at)
      ORDER BY rt.created_at DESC
    `).all(start_time || null, end_time || null);
  } else {
    data = db.prepare(`
      SELECT 
        mp.name as 点位名称,
        mp.device_code as 设备编号,
        mp.responsible_unit as 责任单位,
        mp.construction_stage as 施工阶段,
        md.collected_at as 采集时间,
        md.pm25 as PM2.5,
        md.pm10 as PM10,
        md.noise as 噪声,
        md.wind_speed as 风速,
        md.temperature as 温度,
        md.humidity as 湿度,
        CASE WHEN md.is_anomaly = 1 THEN '是' ELSE '否' END as 是否异常
      FROM monitoring_data md
      LEFT JOIN monitoring_points mp ON md.point_id = mp.id
      WHERE md.collected_at >= COALESCE(?, md.collected_at) 
        AND md.collected_at <= COALESCE(?, md.collected_at)
      ORDER BY md.collected_at DESC
      LIMIT 1000
    `).all(start_time || null, end_time || null);
  }
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type || 'data'}_export.xlsx"`);
  res.send(buffer);
});

router.get('/acceptance-check', (req, res) => {
  const offlinePoints = db.prepare(`
    SELECT id, name, device_code, location, last_heartbeat
    FROM monitoring_points 
    WHERE status = 'offline' OR last_heartbeat IS NULL OR last_heartbeat < datetime('now', '-30 minutes')
  `).all();
  
  const continuousAnomalies = db.prepare(`
    SELECT 
      mp.id,
      mp.name,
      mp.device_code,
      COUNT(*) as consecutive_anomalies,
      MIN(md.collected_at) as first_anomaly_time
    FROM monitoring_data md
    JOIN monitoring_points mp ON md.point_id = mp.id
    WHERE md.is_anomaly = 1 
      AND md.collected_at >= datetime('now', '-2 hours')
    GROUP BY mp.id
    HAVING consecutive_anomalies >= 5
  `).all();
  
  const failedSprinklers = db.prepare(`
    SELECT 
      rt.id,
      rt.task_no,
      mp.name as point_name,
      rt.created_at
    FROM rectification_tasks rt
    JOIN monitoring_points mp ON rt.point_id = mp.id
    WHERE rt.sprinkler_activated = 0 
      AND rt.status IN ('pending', 'processing')
      AND rt.created_at >= datetime('now', '-24 hours')
  `).all();
  
  const overdueTasks = db.prepare(`
    SELECT 
      rt.id,
      rt.task_no,
      mp.name as point_name,
      mp.responsible_unit,
      rt.created_at,
      ROUND((JULIANDAY('now') - JULIANDAY(rt.created_at)) * 24, 1) as overdue_hours
    FROM rectification_tasks rt
    JOIN monitoring_points mp ON rt.point_id = mp.id
    WHERE rt.status IN ('pending', 'processing')
      AND rt.created_at < datetime('now', '-24 hours')
  `).all();
  
  res.json({
    offline_points: offlinePoints,
    continuous_anomalies: continuousAnomalies,
    failed_sprinklers: failedSprinklers,
    overdue_tasks: overdueTasks,
    total_issues: offlinePoints.length + continuousAnomalies.length + failedSprinklers.length + overdueTasks.length
  });
});

module.exports = router;
