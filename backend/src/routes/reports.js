import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function getDateRange(query) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let start = query.start_date || thirtyDaysAgo.toISOString().slice(0, 10);
  let end = query.end_date || now.toISOString().slice(0, 10);
  if (end.length === 10) end += ' 23:59:59';
  return { start, end };
}

function getGroupFormat(groupBy) {
  if (groupBy === 'week') return '%Y-W%W';
  if (groupBy === 'month') return '%Y-%m';
  return '%Y-%m-%d';
}

router.get('/swap-frequency', (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const fmt = getGroupFormat(req.query.group_by);
    const stationFilter = req.query.station_id ? ' AND station_id = ?' : '';
    const params = req.query.station_id ? [fmt, start, end, req.query.station_id] : [fmt, start, end];

    const rows = db.prepare(`
      SELECT strftime(?, created_at) as period,
             COUNT(*) as count,
             ROUND(AVG(actual_fee), 2) as avg_fee
      FROM swap_orders
      WHERE created_at >= ? AND created_at <= ?${stationFilter}
      GROUP BY period
      ORDER BY period
    `).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/battery-turnover', (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const stationFilter = req.query.station_id ? ' AND o.station_id = ?' : '';
    const params = req.query.station_id ? [start, end, req.query.station_id] : [start, end];

    const totalSwaps = db.prepare(
      `SELECT COUNT(*) as cnt FROM swap_orders WHERE created_at >= ? AND created_at <= ?`
    ).get(start, end).cnt;

    const rows = db.prepare(`
      SELECT b.id as battery_id,
             b.battery_code,
             COUNT(o.id) as swap_count,
             ROUND(COUNT(o.id) * 100.0 / NULLIF(?, 0), 2) as utilization_rate
      FROM batteries b
      JOIN swap_orders o ON (o.battery_out_id = b.id OR o.battery_in_id = b.id)
      WHERE o.created_at >= ? AND o.created_at <= ?${stationFilter}
      GROUP BY b.id, b.battery_code
      ORDER BY swap_count DESC
    `).all(totalSwaps, ...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/station-load', (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const stationId = req.query.station_id;

    let stationSql = `SELECT id as station_id, name as station_name, total_slots, available_count, charging_count, abnormal_count, current_wait_minutes FROM stations`;
    const stationParams = [];
    if (stationId) {
      stationSql += ` WHERE id = ?`;
      stationParams.push(stationId);
    }
    const stations = db.prepare(stationSql).all(...stationParams);

    const result = stations.map(s => {
      const swapStats = db.prepare(`
        SELECT COUNT(*) as total_swaps FROM swap_orders WHERE station_id = ? AND created_at >= ? AND created_at <= ?
      `).get(s.station_id, start, end);

      const peakHour = db.prepare(`
        SELECT strftime('%H', created_at) as hour
        FROM swap_orders
        WHERE station_id = ? AND created_at >= ? AND created_at <= ?
        GROUP BY hour
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `).get(s.station_id, start, end);

      return {
        station_id: s.station_id,
        station_name: s.station_name,
        total_swaps: swapStats.total_swaps,
        peak_hour: peakHour ? peakHour.hour : null,
        avg_wait_minutes: s.current_wait_minutes,
        load_rate: Math.round((s.total_slots - s.available_count) * 10000 / s.total_slots) / 100
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/fault-rate', (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const stationFilter = req.query.station_id ? ' AND station_id = ?' : '';
    const alertStationFilter = req.query.station_id ? ' AND station_id = ?' : '';
    const orderParams = req.query.station_id ? [start, end, req.query.station_id] : [start, end];
    const alertParams = req.query.station_id ? [start, end, req.query.station_id] : [start, end];

    const orderStats = db.prepare(`
      SELECT COUNT(*) as total_swaps,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_swaps,
             ROUND(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as failure_rate
      FROM swap_orders
      WHERE created_at >= ? AND created_at <= ?${stationFilter}
    `).get(...orderParams);

    const alertsByType = db.prepare(`
      SELECT alert_type, COUNT(*) as count
      FROM safety_alerts
      WHERE created_at >= ? AND created_at <= ?${alertStationFilter}
      GROUP BY alert_type
    `).all(...alertParams);

    const alertsBySeverity = db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM safety_alerts
      WHERE created_at >= ? AND created_at <= ?${alertStationFilter}
      GROUP BY severity
    `).all(...alertParams);

    res.json({
      total_swaps: orderStats.total_swaps,
      failed_swaps: orderStats.failed_swaps,
      failure_rate: orderStats.failure_rate,
      alerts_by_type: alertsByType,
      alerts_by_severity: alertsBySeverity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/revenue', (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const fmt = getGroupFormat(req.query.group_by);
    const stationFilter = req.query.station_id ? ' AND o.station_id = ?' : '';
    const params = req.query.station_id ? [fmt, start, end, req.query.station_id] : [fmt, start, end];

    const rows = db.prepare(`
      SELECT strftime(?, o.created_at) as period,
             ROUND(SUM(o.fee), 2) as total_fee,
             ROUND(SUM(o.actual_fee), 2) as actual_fee,
             ROUND(SUM(o.discount_amount), 2) as discount_amount,
             ROUND(SUM(CASE WHEN v.member_type != 'none' THEN o.discount_amount ELSE 0 END), 2) as member_savings
      FROM swap_orders o
      LEFT JOIN vehicles v ON o.vehicle_id = v.id
      WHERE o.created_at >= ? AND o.created_at <= ?${stationFilter}
      GROUP BY period
      ORDER BY period
    `).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
