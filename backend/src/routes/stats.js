const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('manager', 'customer_service'));

router.get('/overview', (req, res) => {
  const { start_date, end_date, area } = req.query;

  let dateCondition = '';
  const params = [];
  if (start_date) {
    dateCondition += ' AND DATE(pr.scan_time) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    dateCondition += ' AND DATE(pr.scan_time) <= DATE(?)';
    params.push(end_date);
  }

  let areaJoin = '';
  let areaCondition = '';
  if (area) {
    areaJoin = ' LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id LEFT JOIN buildings b ON c.building_id = b.id ';
    areaCondition = ' WHERE b.area = ? ';
    params.unshift(area);
  }

  const totalPatrols = db.prepare(`
    SELECT COUNT(*) as count FROM patrol_records pr
    ${areaJoin}
    ${areaCondition || (dateCondition ? ' WHERE 1=1 ' : '')}
    ${dateCondition}
  `).get(...params).count;

  const missedPatrols = db.prepare(`
    SELECT COUNT(*) as count FROM patrol_records pr
    ${areaJoin}
    ${areaCondition || ' WHERE 1=1 '}
    AND pr.status = 'missed'
    ${dateCondition}
  `).get(...params).count;

  const latePatrols = db.prepare(`
    SELECT COUNT(*) as count FROM patrol_records pr
    ${areaJoin}
    ${areaCondition || ' WHERE 1=1 '}
    AND pr.status = 'late'
    ${dateCondition}
  `).get(...params).count;

  const abnormalResults = db.prepare(`
    SELECT COUNT(*) as count FROM check_results cr
    LEFT JOIN patrol_records pr ON cr.patrol_record_id = pr.id
    ${area ? ' LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id LEFT JOIN buildings b ON c.building_id = b.id ' : ''}
    WHERE cr.is_abnormal = 1
    ${area ? ' AND b.area = ? ' : ''}
    ${dateCondition}
  `).get(...params).count;

  const totalWorkOrders = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders wo
    LEFT JOIN patrol_records pr ON wo.patrol_record_id = pr.id
    ${area ? ' LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id LEFT JOIN buildings b ON c.building_id = b.id ' : ''}
    WHERE 1=1
    ${area ? ' AND b.area = ? ' : ''}
  `).get(...(area ? [area] : [])).count;

  const pendingWorkOrders = db.prepare(`
    SELECT COUNT(*) as count FROM work_orders wo
    LEFT JOIN patrol_records pr ON wo.patrol_record_id = pr.id
    ${area ? ' LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id LEFT JOIN buildings b ON c.building_id = b.id ' : ''}
    WHERE wo.status IN ('pending', 'assigned', 'processing')
    ${area ? ' AND b.area = ? ' : ''}
  `).get(...(area ? [area] : [])).count;

  const avgHandleTime = db.prepare(`
    SELECT AVG(JULIANDAY(completed_time) - JULIANDAY(created_at)) * 24 as hours
    FROM work_orders wo
    LEFT JOIN patrol_records pr ON wo.patrol_record_id = pr.id
    ${area ? ' LEFT JOIN checkpoints c ON pr.checkpoint_id = c.id LEFT JOIN buildings b ON c.building_id = b.id ' : ''}
    WHERE wo.completed_time IS NOT NULL
    ${area ? ' AND b.area = ? ' : ''}
  `).get(...(area ? [area] : [])).hours;

  res.json({
    total_patrols: totalPatrols,
    missed_patrols: missedPatrols,
    late_patrols: latePatrols,
    abnormal_results: abnormalResults,
    miss_rate: totalPatrols > 0 ? ((missedPatrols + latePatrols) / totalPatrols * 100).toFixed(2) : 0,
    total_work_orders: totalWorkOrders,
    pending_work_orders: pendingWorkOrders,
    avg_handle_hours: avgHandleTime ? avgHandleTime.toFixed(2) : 0
  });
});

router.get('/by-area', (req, res) => {
  const { start_date, end_date } = req.query;

  let dateCondition = '';
  const params = [];
  if (start_date) {
    dateCondition += ' AND DATE(pr.scan_time) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    dateCondition += ' AND DATE(pr.scan_time) <= DATE(?)';
    params.push(end_date);
  }

  const stats = db.prepare(`
    SELECT 
      b.area,
      COUNT(DISTINCT pr.id) as total_patrols,
      SUM(CASE WHEN pr.status = 'missed' THEN 1 ELSE 0 END) as missed_patrols,
      SUM(CASE WHEN pr.status = 'late' THEN 1 ELSE 0 END) as late_patrols,
      SUM(CASE WHEN cr.is_abnormal = 1 THEN 1 ELSE 0 END) as abnormal_count
    FROM buildings b
    LEFT JOIN checkpoints c ON b.id = c.building_id
    LEFT JOIN patrol_records pr ON c.id = pr.checkpoint_id
    LEFT JOIN check_results cr ON pr.id = cr.patrol_record_id
    WHERE b.area IS NOT NULL
    ${dateCondition}
    GROUP BY b.area
  `).all(...params);

  res.json(stats.map(s => ({
    ...s,
    miss_rate: s.total_patrols > 0 ? ((s.missed_patrols + s.late_patrols) / s.total_patrols * 100).toFixed(2) : 0
  })));
});

router.get('/by-user', (req, res) => {
  const { start_date, end_date, role } = req.query;

  let dateCondition = '';
  const params = [];
  if (start_date) {
    dateCondition += ' AND DATE(pr.scan_time) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    dateCondition += ' AND DATE(pr.scan_time) <= DATE(?)';
    params.push(end_date);
  }

  let roleCondition = '';
  if (role) {
    roleCondition = ' AND u.role = ?';
    params.push(role);
  }

  const stats = db.prepare(`
    SELECT 
      u.id,
      u.name,
      u.role,
      COUNT(DISTINCT pr.id) as total_patrols,
      SUM(CASE WHEN pr.status = 'missed' THEN 1 ELSE 0 END) as missed_patrols,
      SUM(CASE WHEN pr.status = 'late' THEN 1 ELSE 0 END) as late_patrols
    FROM users u
    LEFT JOIN patrol_records pr ON u.id = pr.user_id
    WHERE 1=1
    ${roleCondition}
    ${dateCondition}
    GROUP BY u.id
    ORDER BY total_patrols DESC
  `).all(...params);

  res.json(stats.map(s => ({
    ...s,
    miss_rate: s.total_patrols > 0 ? ((s.missed_patrols + s.late_patrols) / s.total_patrols * 100).toFixed(2) : 0
  })));
});

router.get('/by-abnormal-type', (req, res) => {
  const { start_date, end_date } = req.query;

  let dateCondition = '';
  const params = [];
  if (start_date) {
    dateCondition += ' AND DATE(cr.created_at) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    dateCondition += ' AND DATE(cr.created_at) <= DATE(?)';
    params.push(end_date);
  }

  const stats = db.prepare(`
    SELECT 
      ci.name as check_item,
      COUNT(*) as count
    FROM check_results cr
    LEFT JOIN check_items ci ON cr.check_item_id = ci.id
    WHERE cr.is_abnormal = 1
    ${dateCondition}
    GROUP BY ci.id, ci.name
    ORDER BY count DESC
    LIMIT 10
  `).all(...params);

  res.json(stats);
});

router.get('/by-workorder-type', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      type,
      COUNT(*) as count,
      SUM(CASE WHEN status IN ('pending', 'assigned', 'processing') THEN 1 ELSE 0 END) as pending
    FROM work_orders
    GROUP BY type
  `).all();

  res.json(stats);
});

router.get('/daily-patrols', (req, res) => {
  const { days = 30 } = req.query;

  const stats = db.prepare(`
    SELECT 
      DATE(scan_time) as date,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
    FROM patrol_records
    WHERE scan_time >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(scan_time)
    ORDER BY date DESC
  `).all(days);

  res.json(stats);
});

module.exports = router;
