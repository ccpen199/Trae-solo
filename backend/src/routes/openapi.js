import { Router } from 'express';
import { getDb } from '../db/init.js';

const router = Router();
const API_KEY = 'etc_open_api_key_2026';

function apiKeyMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: '无效的API密钥' });
  }
  next();
}

router.use(apiKeyMiddleware);

router.get('/toll-stats', (req, res) => {
  try {
    const db = getDb();
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND exit_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND exit_time <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const stats = db.prepare(`
      SELECT
        DATE(exit_time) AS date,
        COUNT(*) AS toll_count,
        SUM(fee) AS total_fee,
        AVG(fee) AS avg_fee,
        COUNT(DISTINCT vehicle_plate) AS vehicle_count
      FROM toll_records
      ${where}
      GROUP BY DATE(exit_time)
      ORDER BY date DESC
    `).all(...params);

    const summary = db.prepare(`
      SELECT
        COUNT(*) AS total_records,
        SUM(fee) AS total_amount,
        COUNT(DISTINCT vehicle_plate) AS total_vehicles
      FROM toll_records
      ${where}
    `).get(...params);

    res.json({ summary, daily_stats: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/traffic-flow', (req, res) => {
  try {
    const db = getDb();
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND exit_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND exit_time <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const byGantry = db.prepare(`
      SELECT
        gantry_id,
        gantry_name,
        COUNT(*) AS vehicle_count,
        SUM(fee) AS total_fee
      FROM toll_records
      ${where}
      GROUP BY gantry_id
      ORDER BY vehicle_count DESC
    `).all(...params);

    const byStation = db.prepare(`
      SELECT
        toll_station_id,
        toll_station_name,
        COUNT(*) AS vehicle_count,
        SUM(fee) AS total_fee
      FROM toll_records
      ${where}
      GROUP BY toll_station_id
      ORDER BY vehicle_count DESC
    `).all(...params);

    const byRoadSegment = db.prepare(`
      SELECT
        road_segment,
        COUNT(*) AS vehicle_count,
        SUM(fee) AS total_fee
      FROM toll_records
      ${where}
      GROUP BY road_segment
      ORDER BY vehicle_count DESC
    `).all(...params);

    res.json({ by_gantry: byGantry, by_station: byStation, by_road_segment: byRoadSegment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/anomaly-summary', (req, res) => {
  try {
    const db = getDb();
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      where += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const byType = db.prepare(`
      SELECT type, COUNT(*) AS count, status
      FROM exception_events
      ${where}
      GROUP BY type, status
    `).all(...params);

    const total = db.prepare(`SELECT COUNT(*) AS count FROM exception_events ${where}`).get(...params).count;
    const resolved = db.prepare(`SELECT COUNT(*) AS count FROM exception_events ${where} AND status = 'resolved'`).get(...params).count;
    const pending = db.prepare(`SELECT COUNT(*) AS count FROM exception_events ${where} AND status = 'pending'`).get(...params).count;
    const processing = db.prepare(`SELECT COUNT(*) AS count FROM exception_events ${where} AND status = 'processing'`).get(...params).count;

    const disputesTotal = db.prepare(`
      SELECT COUNT(*) AS count FROM disputes
      ${startDate ? 'WHERE created_at >= ?' : 'WHERE 1=1'}
      ${endDate ? ' AND created_at <= ?' : ''}
    `).all(...(startDate ? [startDate] : []), ...(endDate ? [endDate + ' 23:59:59'] : []))[0]?.count || 0;

    res.json({
      total,
      resolved,
      pending,
      processing,
      resolution_rate: total > 0 ? (resolved / total * 100).toFixed(2) + '%' : '0%',
      disputes_total: disputesTotal,
      by_type: byType
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
