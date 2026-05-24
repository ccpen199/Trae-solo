const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticateToken, (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  
  const isOwner = req.user.role === 'owner';
  const isStore = req.user.role === 'store';
  const isAdmin = req.user.role === 'admin' || req.user.role === 'customer_service';
  
  const aptParams = [];
  let aptFilter = 'WHERE 1=1';
  
  if (isOwner) {
    aptFilter += ' AND a.owner_id = ?';
    aptParams.push(req.user.id);
  } else if (isStore) {
    aptFilter += ' AND a.store_id = ?';
    aptParams.push(req.user.id);
  } else if (store_id) {
    aptFilter += ' AND a.store_id = ?';
    aptParams.push(store_id);
  }
  
  if (start_date) {
    aptFilter += ' AND a.appointment_date >= ?';
    aptParams.push(start_date);
  }
  if (end_date) {
    aptFilter += ' AND a.appointment_date <= ?';
    aptParams.push(end_date);
  }
  
  const totalAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments a ${aptFilter}
  `).get(...aptParams).count;
  
  const completedAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments a ${aptFilter.replace('WHERE 1=1', 'WHERE a.status = \'completed\'')}
  `).get(...aptParams).count;
  
  const cancelledAppointments = db.prepare(`
    SELECT COUNT(*) as count FROM appointments a ${aptFilter.replace('WHERE 1=1', 'WHERE a.status = \'cancelled\'')}
  `).get(...aptParams).count;
  
  const feeParams = [];
  let feeFilter = 'WHERE fo.status = \'paid\'';
  if (isStore) {
    feeFilter += ' AND fo.store_id = ?';
    feeParams.push(req.user.id);
  } else if (store_id) {
    feeFilter += ' AND fo.store_id = ?';
    feeParams.push(store_id);
  } else if (isOwner) {
    feeFilter += ' AND fo.owner_id = ?';
    feeParams.push(req.user.id);
  }
  
  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(fo.total_amount), 0) as total FROM fee_orders fo ${feeFilter}
  `).get(...feeParams).total;
  
  const reviewParams = [];
  let reviewFilter = 'WHERE r.is_repurchase = 1';
  if (isStore) {
    reviewFilter += ' AND r.store_id = ?';
    reviewParams.push(req.user.id);
  } else if (store_id) {
    reviewFilter += ' AND r.store_id = ?';
    reviewParams.push(store_id);
  }
  
  const repurchaseCount = db.prepare(`
    SELECT COUNT(*) as count FROM reviews r ${reviewFilter}
  `).get(...reviewParams).count;
  
  const complaintParams = [];
  let complaintFilter = 'WHERE 1=1';
  if (isStore) {
    complaintFilter += ' AND c.store_id = ?';
    complaintParams.push(req.user.id);
  } else if (store_id) {
    complaintFilter += ' AND c.store_id = ?';
    complaintParams.push(store_id);
  }
  
  const complaintCount = db.prepare(`
    SELECT COUNT(*) as count FROM complaints c ${complaintFilter}
  `).get(...complaintParams).count;
  
  const complaintResolved = db.prepare(`
    SELECT COUNT(*) as count FROM complaints c ${complaintFilter.replace('WHERE 1=1', 'WHERE c.status = \'resolved\'')}
  `).get(...complaintParams).count;
  
  const srParams = [];
  let srFilter = 'WHERE sr.status = \'completed\'';
  if (isStore) {
    srFilter += ' AND a.store_id = ?';
    srParams.push(req.user.id);
  } else if (store_id) {
    srFilter += ' AND a.store_id = ?';
    srParams.push(store_id);
  }
  
  const totalDuration = db.prepare(`
    SELECT COALESCE(SUM(sr.actual_duration), 0) as total FROM service_records sr
    LEFT JOIN appointments a ON sr.appointment_id = a.id
    ${srFilter}
  `).get(...srParams).total;
  
  const consumableCost = db.prepare(`
    SELECT COALESCE(SUM(sc.total_cost), 0) as total FROM service_consumables sc
    LEFT JOIN service_records sr ON sc.record_id = sr.id
    LEFT JOIN appointments a ON sr.appointment_id = a.id
    ${srFilter.replace('WHERE sr.status = \'completed\'', 'WHERE 1=1')}
  `).get(...srParams).total;
  
  const newCustomers = isOwner ? 0 : db.prepare(`
    SELECT COUNT(DISTINCT a.owner_id) as count FROM appointments a
    ${aptFilter.replace('WHERE 1=1', 'WHERE a.owner_id NOT IN (SELECT DISTINCT owner_id FROM appointments WHERE appointment_date < (SELECT MIN(appointment_date) FROM appointments a ' + aptFilter + '))')}
  `).get(...aptParams, ...aptParams).count;
  
  res.json({
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0,
    totalRevenue,
    averageOrderValue: completedAppointments > 0 ? (totalRevenue / completedAppointments).toFixed(2) : 0,
    repurchaseCount,
    repurchaseRate: completedAppointments > 0 ? ((repurchaseCount / completedAppointments) * 100).toFixed(1) : 0,
    complaintCount,
    complaintResolved,
    complaintResolutionRate: complaintCount > 0 ? ((complaintResolved / complaintCount) * 100).toFixed(1) : 0,
    totalServiceDuration: totalDuration,
    averageServiceDuration: completedAppointments > 0 ? Math.round(totalDuration / completedAppointments) : 0,
    consumableCost,
    newCustomers
  });
});

router.get('/daily', authenticateToken, requireRole('admin', 'store', 'customer_service'), (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  
  let storeFilter = '';
  const params = [];
  
  if (req.user.role === 'store') {
    storeFilter = ' AND a.store_id = ?';
    params.push(req.user.id);
  } else if (store_id) {
    storeFilter = ' AND a.store_id = ?';
    params.push(store_id);
  }
  
  let dateFilter = '';
  if (start_date) {
    dateFilter += ' AND a.appointment_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ' AND a.appointment_date <= ?';
    params.push(end_date);
  }
  
  const dailyStats = db.prepare(`
    SELECT 
      a.appointment_date as stat_date,
      COUNT(*) as total_appointments,
      SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
      SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_appointments,
      COALESCE(SUM(fo.total_amount), 0) as total_revenue,
      COALESCE(SUM(sr.actual_duration), 0) as total_service_duration
    FROM appointments a
    LEFT JOIN fee_orders fo ON a.id = fo.appointment_id AND fo.status = 'paid'
    LEFT JOIN service_records sr ON a.id = sr.appointment_id
    WHERE 1=1 ${storeFilter} ${dateFilter}
    GROUP BY a.appointment_date
    ORDER BY a.appointment_date DESC
    LIMIT 30
  `).all(...params);
  
  res.json(dailyStats);
});

router.get('/staff', authenticateToken, requireRole('admin', 'store'), (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  
  let storeFilter = '';
  const params = [];
  
  if (req.user.role === 'store') {
    storeFilter = ' AND a.store_id = ?';
    params.push(req.user.id);
  } else if (store_id) {
    storeFilter = ' AND a.store_id = ?';
    params.push(store_id);
  }
  
  let dateFilter = '';
  if (start_date) {
    dateFilter += ' AND a.appointment_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ' AND a.appointment_date <= ?';
    params.push(end_date);
  }
  
  const staffStats = db.prepare(`
    SELECT 
      u.id as staff_id,
      u.name as staff_name,
      COUNT(*) as total_services,
      SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_services,
      COALESCE(SUM(sr.actual_duration), 0) as total_duration,
      COALESCE(AVG(r.rating), 0) as average_rating
    FROM users u
    LEFT JOIN appointments a ON u.id = a.staff_id ${dateFilter}
    LEFT JOIN service_records sr ON a.id = sr.appointment_id
    LEFT JOIN reviews r ON a.id = r.appointment_id
    WHERE u.role = 'staff' ${storeFilter}
    GROUP BY u.id
    ORDER BY completed_services DESC
  `).all(...params);
  
  res.json(staffStats);
});

router.get('/services', authenticateToken, requireRole('admin', 'store'), (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  
  let storeFilter = '';
  const params = [];
  
  if (req.user.role === 'store') {
    storeFilter = ' AND a.store_id = ?';
    params.push(req.user.id);
  } else if (store_id) {
    storeFilter = ' AND a.store_id = ?';
    params.push(store_id);
  }
  
  let dateFilter = '';
  if (start_date) {
    dateFilter += ' AND a.appointment_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ' AND a.appointment_date <= ?';
    params.push(end_date);
  }
  
  const serviceStats = db.prepare(`
    SELECT 
      s.id as service_id,
      s.name as service_name,
      s.category,
      COUNT(*) as booking_count,
      SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      COALESCE(SUM(fo.total_amount), 0) as total_revenue
    FROM services s
    LEFT JOIN appointments a ON s.id = a.service_id ${dateFilter}
    LEFT JOIN fee_orders fo ON a.id = fo.appointment_id AND fo.status = 'paid'
    WHERE 1=1 ${storeFilter.replace('a.store_id', 's.store_id')}
    GROUP BY s.id
    ORDER BY booking_count DESC
  `).all(...params);
  
  res.json(serviceStats);
});

router.get('/complaints', authenticateToken, requireRole('admin', 'customer_service'), (req, res) => {
  const complaintTypes = db.prepare(`
    SELECT complaint_type, COUNT(*) as count 
    FROM complaints 
    GROUP BY complaint_type
  `).all();
  
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM complaints 
    GROUP BY status
  `).all();
  
  res.json({
    by_type: complaintTypes,
    by_status: statusStats
  });
});

module.exports = router;
