const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const FaultDiagnosisEngine = require('../engines/fault-diagnosis.engine');

router.get('/overview', authenticateToken, (req, res) => {
  try {
    const stationStats = db.prepare(`
      SELECT 
        COUNT(*) as total_stations,
        SUM(CASE WHEN status = 'operating' THEN 1 ELSE 0 END) as operating_stations,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_stations,
        SUM(CASE WHEN status = 'abnormal' THEN 1 ELSE 0 END) as abnormal_stations,
        SUM(capacity_kw) as total_capacity_kw
      FROM stations
    `).get();

    const inverterStats = db.prepare(`
      SELECT 
        COUNT(*) as total_inverters,
        SUM(CASE WHEN status = 'operating' THEN 1 ELSE 0 END) as operating_inverters,
        SUM(CASE WHEN status = 'fault' THEN 1 ELSE 0 END) as fault_inverters,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline_inverters
      FROM inverters
    `).get();

    const maintenanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('pending', 'dispatched', 'accepted') THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status IN ('on_site', 'repairing', 'testing') THEN 1 ELSE 0 END) as in_progress_orders,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as completed_orders
      FROM maintenance_orders
      WHERE date(created_at) >= date('now', '-30 days')
    `).get();

    const cleaningStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('pending', 'dispatched', 'accepted') THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_orders,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as completed_orders
      FROM cleaning_orders
      WHERE date(created_at) >= date('now', '-30 days')
    `).get();

    const activeFaults = db.prepare(`
      SELECT 
        f.*, s.name as station_name, i.serial_number as inverter_sn
      FROM faults f
      JOIN stations s ON f.station_id = s.id
      LEFT JOIN inverters i ON f.inverter_id = i.id
      WHERE f.status NOT IN ('resolved', 'false_alarm')
      ORDER BY 
        CASE f.severity 
          WHEN 'critical' THEN 1 
          WHEN 'major' THEN 2 
          WHEN 'minor' THEN 3 
          ELSE 4 
        END,
        f.detected_time DESC
      LIMIT 10
    `).all();

    const recentGeneration = db.prepare(`
      SELECT 
        record_date,
        SUM(actual_generation_kwh) as total_kwh,
        AVG(pr_value) as avg_pr
      FROM generation_records
      WHERE record_date >= date('now', '-7 days')
      GROUP BY record_date
      ORDER BY record_date
    `).all();

    const revenue30d = db.prepare(`
      SELECT 
        SUM(total_revenue) as total_revenue,
        SUM(grid_generation_kwh) as total_generation_kwh
      FROM daily_settlements
      WHERE settlement_date >= date('now', '-30 days')
    `).get();

    res.json({
      stations: {
        total: stationStats.total_stations,
        operating: stationStats.operating_stations,
        maintenance: stationStats.maintenance_stations,
        abnormal: stationStats.abnormal_stations,
        total_capacity_kw: stationStats.total_capacity_kw
      },
      inverters: {
        total: inverterStats.total_inverters,
        operating: inverterStats.operating_inverters,
        fault: inverterStats.fault_inverters,
        offline: inverterStats.offline_inverters
      },
      maintenance: {
        total_last_30d: maintenanceStats.total_orders,
        pending: maintenanceStats.pending_orders,
        in_progress: maintenanceStats.in_progress_orders,
        completed: maintenanceStats.completed_orders
      },
      cleaning: {
        total_last_30d: cleaningStats.total_orders,
        pending: cleaningStats.pending_orders,
        in_progress: cleaningStats.in_progress_orders,
        completed: cleaningStats.completed_orders
      },
      active_faults: activeFaults,
      generation_last_7d: recentGeneration,
      revenue_last_30d: {
        total_revenue: revenue30d?.total_revenue || 0,
        total_generation_kwh: revenue30d?.total_generation_kwh || 0
      }
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ error: '获取看板数据失败' });
  }
});

router.get('/mttr', authenticateToken, (req, res) => {
  try {
    const { station_id, days = 30 } = req.query;

    if (station_id) {
      const mttr = FaultDiagnosisEngine.calculateMTTR(station_id, parseInt(days));
      return res.json(mttr);
    }

    const stations = db.prepare('SELECT id, name FROM stations').all();
    const results = [];

    for (const station of stations) {
      try {
        const mttr = FaultDiagnosisEngine.calculateMTTR(station.id, parseInt(days));
        results.push({
          station_id: station.id,
          station_name: station.name,
          ...mttr
        });
      } catch (e) {
        console.error(`MTTR error for station ${station.id}:`, e);
      }
    }

    res.json({
      period_days: parseInt(days),
      stations_mttr: results
    });
  } catch (err) {
    console.error('MTTR stats error:', err);
    res.status(500).json({ error: '获取MTTR统计失败' });
  }
});

router.get('/health-distribution', authenticateToken, (req, res) => {
  try {
    const distribution = db.prepare(`
      SELECT 
        health_level,
        COUNT(*) as count,
        SUM(capacity_kw) as total_capacity_kw
      FROM stations
      GROUP BY health_level
    `).all();

    const statusDistribution = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM stations
      GROUP BY status
    `).all();

    res.json({
      health_distribution: distribution,
      status_distribution: statusDistribution
    });
  } catch (err) {
    console.error('Health distribution error:', err);
    res.status(500).json({ error: '获取健康分布数据失败' });
  }
});

module.exports = router;
