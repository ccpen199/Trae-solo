import { Router } from 'express';
import { getDb } from '../db/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").get().count;
    const deviceCount = db.prepare('SELECT COUNT(*) AS count FROM obu_devices').get().count;
    const activeDeviceCount = db.prepare("SELECT COUNT(*) AS count FROM obu_devices WHERE activation_status = 'active'").get().count;

    const balanceResult = db.prepare('SELECT COALESCE(SUM(balance), 0) AS total_balance FROM etc_accounts WHERE status = ?').get('normal');
    const accountCount = db.prepare('SELECT COUNT(*) AS count FROM etc_accounts WHERE status = ?').get('normal').count;

    const today = new Date().toISOString().split('T')[0];
    const todayTollCount = db.prepare('SELECT COUNT(*) AS count FROM toll_records WHERE DATE(exit_time) = ?').get(today)?.count || 0;
    const todayTollAmount = db.prepare('SELECT COALESCE(SUM(fee), 0) AS total FROM toll_records WHERE DATE(exit_time) = ?').get(today)?.total || 0;

    const exceptionCount = db.prepare("SELECT COUNT(*) AS count FROM exception_events WHERE status IN ('pending','processing')").get().count;

    const blacklistCount = db.prepare('SELECT COUNT(*) AS count FROM blacklist_vehicles').get().count;

    res.json({
      user_count: userCount,
      device_count: deviceCount,
      active_device_count: activeDeviceCount,
      account_count: accountCount,
      total_balance: balanceResult.total_balance,
      today_toll_count: todayTollCount,
      today_toll_amount: todayTollAmount,
      pending_exception_count: exceptionCount,
      blacklist_count: blacklistCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trend', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 30;

    const list = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT DATE('now', ? || ' days') AS date
        UNION ALL
        SELECT DATE(date, '+1 day') FROM dates WHERE date < DATE('now')
      )
      SELECT
        d.date,
        COALESCE(t.count, 0) AS toll_count,
        COALESCE(t.total_fee, 0) AS total_fee
      FROM dates d
      LEFT JOIN (
        SELECT DATE(exit_time) AS date, COUNT(*) AS count, SUM(fee) AS total_fee
        FROM toll_records
        GROUP BY DATE(exit_time)
      ) t ON d.date = t.date
      ORDER BY d.date ASC
    `).all(-days + 1);

    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/exception-distribution', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    const byType = db.prepare(`
      SELECT type, COUNT(*) AS count
      FROM exception_events
      GROUP BY type
    `).all();

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM exception_events
      GROUP BY status
    `).all();

    res.json({ by_type: byType, by_status: byStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/device-status', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    const list = db.prepare(`
      SELECT activation_status, COUNT(*) AS count
      FROM obu_devices
      GROUP BY activation_status
    `).all();

    res.json({ list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/data-quality', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const days = parseInt(req.query.days) || 7;

    const recentMetrics = db.prepare(`
      SELECT * FROM data_quality_metrics
      WHERE metric_date >= DATE('now', ? || ' days')
      ORDER BY metric_date DESC
    `).all(-days + 1);

    const avgMissingRate = recentMetrics.length > 0
      ? (recentMetrics.reduce((s, m) => s + (m.missing_rate || 0), 0) / recentMetrics.length).toFixed(2)
      : 0;
    const avgLatencyRate = recentMetrics.length > 0
      ? (recentMetrics.reduce((s, m) => s + (m.latency_rate || 0), 0) / recentMetrics.length).toFixed(2)
      : 0;
    const totalAlerts = recentMetrics.reduce((s, m) => s + (m.alert_count || 0), 0);
    const currentMissing = recentMetrics[0]?.missing_rate || 0;
    const currentLatency = recentMetrics[0]?.latency_rate || 0;

    const missingAlert = currentMissing > 5 ? 'critical' : currentMissing > 2 ? 'warning' : 'normal';
    const latencyAlert = currentLatency > 5 ? 'critical' : currentLatency > 2 ? 'warning' : 'normal';

    res.json({
      current_missing_rate: currentMissing,
      current_latency_rate: currentLatency,
      avg_missing_rate: parseFloat(avgMissingRate),
      avg_latency_rate: parseFloat(avgLatencyRate),
      total_alerts: totalAlerts,
      missing_alert_level: missingAlert,
      latency_alert_level: latencyAlert,
      trend: recentMetrics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/detailed-stats', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    const accountStatus = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM etc_accounts
      GROUP BY status
    `).all();

    const frozenAccounts = accountStatus.find(a => a.status === 'frozen')?.count || 0;
    const normalAccounts = accountStatus.find(a => a.status === 'normal')?.count || 0;
    const pendingAccounts = accountStatus.find(a => a.status === 'pending')?.count || 0;

    const bindCardStatus = db.prepare(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN card_no IS NOT NULL AND card_no != '' THEN 1 ELSE 0 END) AS bound,
        SUM(CASE WHEN card_no IS NULL OR card_no = '' THEN 1 ELSE 0 END) AS unbound
      FROM etc_accounts
    `).get();

    const firmwareVersions = db.prepare(`
      SELECT firmware_version, COUNT(*) AS count
      FROM obu_devices
      WHERE firmware_version IS NOT NULL
      GROUP BY firmware_version
      ORDER BY count DESC
      LIMIT 5
    `).all();

    const exceptionProgress = db.prepare(`
      SELECT type, status, COUNT(*) AS count
      FROM exception_events
      GROUP BY type, status
    `).all();

    const pendingReviewObu = db.prepare(`
      SELECT COUNT(*) AS count
      FROM obu_devices
      WHERE apply_review_status = 'pending'
    `).get().count;

    const pendingUpgradeObu = db.prepare(`
      SELECT COUNT(*) AS count
      FROM obu_devices
      WHERE activation_status = 'active' AND last_upgrade_status != 'success'
    `).get().count;

    const settlementStatus = db.prepare(`
      SELECT status, COUNT(*) AS count, COALESCE(SUM(highway_group_amount + bank_amount), 0) AS total_amount
      FROM settlements
      GROUP BY status
    `).all();

    const valueAddedServices = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM value_added_services
      GROUP BY status
    `).all();

    const apiUsage = db.prepare(`
      SELECT COUNT(*) AS total_calls,
        SUM(CASE WHEN created_at >= DATE('now', '-7 days') THEN 1 ELSE 0 END) AS last_7_days_calls
      FROM audit_logs
      WHERE action LIKE '%api%'
    `).get();

    const recentAuditLogs = db.prepare(`
      SELECT al.action, al.resource_type, al.details, al.created_at, u.real_name AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      accounts: {
        total: normalAccounts + frozenAccounts + pendingAccounts,
        normal: normalAccounts,
        frozen: frozenAccounts,
        pending: pendingAccounts,
        bound_cards: bindCardStatus.bound,
        unbound_cards: bindCardStatus.unbound
      },
      devices: {
        pending_review: pendingReviewObu,
        pending_upgrade: pendingUpgradeObu,
        firmware_versions: firmwareVersions
      },
      exceptions: {
        by_type_status: exceptionProgress
      },
      settlements: {
        by_status: settlementStatus
      },
      value_added_services: {
        by_status: valueAddedServices
      },
      open_api: {
        total_calls: apiUsage.total_calls,
        last_7_days_calls: apiUsage.last_7_days_calls
      },
      recent_audit_logs: recentAuditLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-tolls', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const pageSize = parseInt(req.query.pageSize) || 5;
    const vehiclePlate = req.query.vehiclePlate || '';
    const gantryId = req.query.gantryId || '';
    const stationId = req.query.stationId || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    let where = 'WHERE 1=1';
    const params = [];

    if (vehiclePlate) {
      where += ' AND t.vehicle_plate LIKE ?';
      params.push(`%${vehiclePlate}%`);
    }
    if (gantryId) {
      where += ' AND t.gantry_id LIKE ?';
      params.push(`%${gantryId}%`);
    }
    if (stationId) {
      where += ' AND t.toll_station_id LIKE ?';
      params.push(`%${stationId}%`);
    }
    if (startDate) {
      where += ' AND t.exit_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND t.exit_time <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const total = db.prepare(`SELECT COUNT(*) AS count FROM toll_records t ${where}`).get(...params).count;

    const list = db.prepare(`
      SELECT t.*,
        a.account_no, u.real_name AS user_name,
        e.id AS exception_id, e.type AS exception_type, e.status AS exception_status,
        d.id AS dispute_id, d.status AS dispute_status,
        s.id AS settlement_id, s.status AS settlement_status
      FROM toll_records t
      LEFT JOIN etc_accounts a ON t.account_id = a.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN exception_events e ON t.id = e.toll_record_id
      LEFT JOIN disputes d ON e.id = d.exception_event_id
      LEFT JOIN settlements s ON DATE(t.exit_time) BETWEEN s.period_start AND s.period_end
      ${where}
      ORDER BY t.id DESC
      LIMIT ?
    `).all(...params, pageSize);

    res.json({ list, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
