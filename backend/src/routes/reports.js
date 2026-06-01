import express from 'express';
import db from '../database.js';

const router = express.Router();

router.get('/summary', (req, res) => {
  const { start_date, end_date, store_id } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (start_date) { whereClause += ' AND appointment_date >= ?'; params.push(start_date); }
  if (end_date) { whereClause += ' AND appointment_date <= ?'; params.push(end_date); }
  if (store_id) { whereClause += ' AND store_id = ?'; params.push(store_id); }
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM appointments ${whereClause}`).get(...params).count;
  const confirmed = db.prepare(`SELECT COUNT(*) as count FROM appointments ${whereClause} AND status IN ('confirmed', 'checked_in', 'in_service', 'completed', 'rescheduled')`).get(...params).count;
  const completed = db.prepare(`SELECT COUNT(*) as count FROM appointments ${whereClause} AND status = 'completed'`).get(...params).count;
  const cancelled = db.prepare(`SELECT COUNT(*) as count FROM appointments ${whereClause} AND status = 'cancelled'`).get(...params).count;
  const noShow = db.prepare(`SELECT COUNT(*) as count FROM appointments ${whereClause} AND status = 'no_show'`).get(...params).count;
  const checkedIn = db.prepare(`SELECT COUNT(*) as count FROM appointments ${whereClause} AND status IN ('checked_in', 'in_service', 'completed', 'late')`).get(...params).count;
  
  const revenue = db.prepare(`SELECT COALESCE(SUM(total_price), 0) as total FROM appointments ${whereClause} AND status = 'completed'`).get(...params).total;
  
  const conversionRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0';
  const showUpRate = total > 0 ? ((checkedIn / total) * 100).toFixed(1) : '0';
  
  res.json({
    total_appointments: total,
    confirmed_appointments: confirmed,
    completed_appointments: completed,
    cancelled_appointments: cancelled,
    no_show_appointments: noShow,
    checked_in_appointments: checkedIn,
    total_revenue: revenue,
    conversion_rate: conversionRate,
    show_up_rate: showUpRate
  });
});

router.get('/staff-load', (req, res) => {
  const { start_date, end_date, store_id } = req.query;
  
  let apptWhere = "WHERE a.status NOT IN ('cancelled', 'no_show')";
  const params = [];
  
  if (start_date) { apptWhere += ' AND a.appointment_date >= ?'; params.push(start_date); }
  if (end_date) { apptWhere += ' AND a.appointment_date <= ?'; params.push(end_date); }
  if (store_id) { apptWhere += ' AND a.store_id = ?'; params.push(store_id); }
  
  const staffLoad = db.prepare(`
    SELECT 
      st.id,
      st.name,
      st.role,
      COUNT(a.id) as appointment_count,
      COALESCE(SUM(CASE WHEN a.id IS NOT NULL THEN s.duration ELSE 0 END), 0) as total_minutes,
      ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating
    FROM staff st
    LEFT JOIN appointments a ON st.id = a.staff_id ${apptWhere.replace('WHERE', 'AND')}
    LEFT JOIN services s ON a.service_id = s.id
    LEFT JOIN reviews r ON a.id = r.appointment_id
    WHERE st.role = 'technician'
    GROUP BY st.id
    ORDER BY appointment_count DESC
  `).all(...params);
  
  res.json(staffLoad);
});

router.get('/no-show-reasons', (req, res) => {
  const { start_date, end_date, store_id } = req.query;
  
  let whereClause = "WHERE status = 'cancelled' AND cancel_reason IS NOT NULL AND cancel_reason != ''";
  const params = [];
  
  if (start_date) { whereClause += ' AND appointment_date >= ?'; params.push(start_date); }
  if (end_date) { whereClause += ' AND appointment_date <= ?'; params.push(end_date); }
  if (store_id) { whereClause += ' AND store_id = ?'; params.push(store_id); }
  
  const reasons = db.prepare(`
    SELECT 
      cancel_reason as reason,
      COUNT(*) as count
    FROM appointments
    ${whereClause}
    GROUP BY cancel_reason
    ORDER BY count DESC
  `).all(...params);
  
  res.json(reasons);
});

router.get('/service-popularity', (req, res) => {
  const { start_date, end_date, store_id } = req.query;
  
  let apptWhere = "WHERE a.status NOT IN ('cancelled', 'no_show')";
  const params = [];
  
  if (start_date) { apptWhere += ' AND a.appointment_date >= ?'; params.push(start_date); }
  if (end_date) { apptWhere += ' AND a.appointment_date <= ?'; params.push(end_date); }
  if (store_id) { apptWhere += ' AND a.store_id = ?'; params.push(store_id); }
  
  const services = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.price,
      COUNT(a.id) as booking_count,
      COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.total_price ELSE 0 END), 0) as revenue
    FROM services s
    LEFT JOIN appointments a ON s.id = a.service_id ${apptWhere.replace('WHERE', 'AND')}
    GROUP BY s.id
    ORDER BY booking_count DESC
  `).all(...params);
  
  res.json(services);
});

router.get('/daily-trend', (req, res) => {
  const { start_date, end_date, store_id } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (start_date) { whereClause += ' AND appointment_date >= ?'; params.push(start_date); }
  if (end_date) { whereClause += ' AND appointment_date <= ?'; params.push(end_date); }
  if (store_id) { whereClause += ' AND store_id = ?'; params.push(store_id); }
  
  const trend = db.prepare(`
    SELECT 
      appointment_date as date,
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('checked_in', 'in_service', 'completed', 'late') THEN 1 ELSE 0 END) as checked_in,
      SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as revenue
    FROM appointments
    ${whereClause}
    GROUP BY appointment_date
    ORDER BY date DESC
    LIMIT 30
  `).all(...params);
  
  res.json(trend.reverse());
});

export default router;
