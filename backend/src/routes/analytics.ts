import { Router } from 'express';
import db from '../database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/common.js';

const router = Router();

router.get('/summary', authMiddleware, adminMiddleware, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const totalServices = db.prepare('SELECT COUNT(*) as count FROM services WHERE status = 1').get() as any;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM service_applications').get() as any;
  const pendingApplications = db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE status = "pending"').get() as any;
  const completedApplications = db.prepare('SELECT COUNT(*) as count FROM service_applications WHERE status = "completed"').get() as any;
  const totalCertificates = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE status = 1').get() as any;
  const totalFeedbacks = db.prepare('SELECT COUNT(*) as count FROM feedbacks').get() as any;
  const pendingFeedbacks = db.prepare('SELECT COUNT(*) as count FROM feedbacks WHERE status = "pending"').get() as any;
  const totalScenes = db.prepare('SELECT COUNT(*) as count FROM scene_templates WHERE status = 1').get() as any;
  const totalSceneInstances = db.prepare('SELECT COUNT(*) as count FROM scene_instances').get() as any;
  const totalVenues = db.prepare('SELECT COUNT(*) as count FROM venues WHERE status = 1').get() as any;
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM venue_bookings').get() as any;
  const totalBusRoutes = db.prepare('SELECT COUNT(*) as count FROM bus_routes WHERE status = 1').get() as any;
  const totalRepairs = db.prepare('SELECT COUNT(*) as count FROM community_repairs').get() as any;
  const totalHelps = db.prepare('SELECT COUNT(*) as count FROM community_help').get() as any;

  const today = new Date().toISOString().split('T')[0];
  const todayApplications = db.prepare(
    'SELECT COUNT(*) as count FROM service_applications WHERE DATE(submit_time) = ?'
  ).get(today) as any;
  const todayUsers = db.prepare(
    'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?'
  ).get(today) as any;

  const avgRating = db.prepare(
    'SELECT AVG(rating) as avg FROM service_applications WHERE rating IS NOT NULL'
  ).get() as any;

  const serviceStats = db.prepare(
    `SELECT s.id, s.name, COUNT(sa.id) as application_count 
     FROM services s 
     LEFT JOIN service_applications sa ON s.id = sa.service_id 
     WHERE s.status = 1
     GROUP BY s.id 
     ORDER BY application_count DESC 
     LIMIT 10`
  ).all();

  const categoryStats = db.prepare(
    `SELECT c.id, c.name, c.code, COUNT(s.id) as service_count, COUNT(sa.id) as application_count
     FROM service_categories c
     LEFT JOIN services s ON c.id = s.category_id
     LEFT JOIN service_applications sa ON s.id = sa.service_id
     WHERE c.status = 1
     GROUP BY c.id
     ORDER BY application_count DESC`
  ).all();

  const monthlyApplications = db.prepare(
    `SELECT 
       strftime('%Y-%m', submit_time) as month,
       COUNT(*) as count
     FROM service_applications
     WHERE submit_time >= date('now', '-6 months')
     GROUP BY strftime('%Y-%m', submit_time)
     ORDER BY month ASC`
  ).all();

  return successResponse(res, {
    overview: {
      total_users: totalUsers.count,
      total_services: totalServices.count,
      total_applications: totalApplications.count,
      pending_applications: pendingApplications.count,
      completed_applications: completedApplications.count,
      total_certificates: totalCertificates.count,
      total_feedbacks: totalFeedbacks.count,
      pending_feedbacks: pendingFeedbacks.count,
      total_scenes: totalScenes.count,
      total_scene_instances: totalSceneInstances.count,
      total_venues: totalVenues.count,
      total_bookings: totalBookings.count,
      total_bus_routes: totalBusRoutes.count,
      total_repairs: totalRepairs.count,
      total_helps: totalHelps.count,
      today_new_users: todayUsers.count,
      today_new_applications: todayApplications.count,
      average_rating: avgRating.avg ? parseFloat(avgRating.avg).toFixed(1) : '0.0'
    },
    top_services: serviceStats,
    category_stats: categoryStats,
    monthly_trend: monthlyApplications
  });
});

router.get('/heatmap', (req, res) => {
  const { date, region_code } = req.query as any;

  let sql = `SELECT sh.*, s.name as service_name 
             FROM service_heatmap sh 
             LEFT JOIN services s ON sh.service_id = s.id`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (date) {
    conditions.push('sh.stat_date = ?');
    params.push(date);
  } else {
    conditions.push('sh.stat_date = date(\"now\")');
  }

  if (region_code) {
    conditions.push('sh.region_code = ?');
    params.push(region_code);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY sh.request_count DESC';

  const heatmapData = db.prepare(sql).all(...params);

  const regionStats = db.prepare(
    `SELECT region_code, region_name, 
            SUM(request_count) as total_requests,
            AVG(latitude) as center_lat,
            AVG(longitude) as center_lng
     FROM service_heatmap
     ${date ? 'WHERE stat_date = ?' : 'WHERE stat_date = date(\"now\")'}
     GROUP BY region_code, region_name
     ORDER BY total_requests DESC`
  ).all(date ? [date] : []);

  return successResponse(res, {
    stat_date: date || new Date().toISOString().split('T')[0],
    regions: regionStats,
    details: heatmapData
  });
});

router.get('/heatmap/by-region', (req, res) => {
  const { date } = req.query as any;
  const statDate = date || new Date().toISOString().split('T')[0];

  const regionData = db.prepare(
    `SELECT region_code, region_name, 
            SUM(request_count) as request_count,
            AVG(latitude) as latitude,
            AVG(longitude) as longitude
     FROM service_heatmap
     WHERE stat_date = ?
     GROUP BY region_code, region_name
     ORDER BY request_count DESC`
  ).all(statDate);

  return successResponse(res, {
    stat_date: statDate,
    regions: regionData
  });
});

router.get('/data-fusion', authMiddleware, adminMiddleware, (req, res) => {
  const { period = 'day', date } = req.query as any;

  let dateCondition = '';
  let params: any[] = [];

  if (date) {
    dateCondition = 'WHERE stat_date = ?';
    params = [date];
  } else {
    dateCondition = 'WHERE stat_date = date(\"now\")';
  }

  const fusionData = db.prepare(
    `SELECT * FROM data_fusion ${dateCondition} ORDER BY stat_date DESC LIMIT 1`
  ).get(...params);

  const today = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const trendData = db.prepare(
    `SELECT stat_date, government_count, people_count, community_count, total_count
     FROM data_fusion
     WHERE stat_date IN (${last7Days.map(() => '?').join(',')})
     ORDER BY stat_date ASC`
  ).all(...last7Days);

  const governmentTrend = last7Days.map(date => {
    const day = trendData.find((d: any) => d.stat_date === date);
    return { date, count: day?.government_count || 0 };
  });

  const peopleTrend = last7Days.map(date => {
    const day = trendData.find((d: any) => d.stat_date === date);
    return { date, count: day?.people_count || 0 };
  });

  const communityTrend = last7Days.map(date => {
    const day = trendData.find((d: any) => d.stat_date === date);
    return { date, count: day?.community_count || 0 };
  });

  const totalTrend = last7Days.map(date => {
    const day = trendData.find((d: any) => d.stat_date === date);
    return { date, count: day?.total_count || 0 };
  });

  const latestData = fusionData as any || {
    government_count: 0,
    people_count: 0,
    community_count: 0,
    total_count: 0
  };

  const categoryBreakdown = [
    { type: 'government', name: '政务服务', count: latestData.government_count, percentage: latestData.total_count ? Math.round(latestData.government_count / latestData.total_count * 100) : 0 },
    { type: 'people', name: '民生服务', count: latestData.people_count, percentage: latestData.total_count ? Math.round(latestData.people_count / latestData.total_count * 100) : 0 },
    { type: 'community', name: '社区服务', count: latestData.community_count, percentage: latestData.total_count ? Math.round(latestData.community_count / latestData.total_count * 100) : 0 }
  ];

  return successResponse(res, {
    stat_date: latestData.stat_date || new Date().toISOString().split('T')[0],
    period,
    summary: {
      government: latestData.government_count,
      people: latestData.people_count,
      community: latestData.community_count,
      total: latestData.total_count
    },
    category_breakdown: categoryBreakdown,
    trends: {
      government: governmentTrend,
      people: peopleTrend,
      community: communityTrend,
      total: totalTrend
    }
  });
});

router.get('/availability', authMiddleware, adminMiddleware, (req, res) => {
  const { service_id, period = '24h' } = req.query as any;

  let timeCondition = '';
  if (period === '24h') {
    timeCondition = 'monitor_time >= datetime(\"now\", \"-24 hours\")';
  } else if (period === '7d') {
    timeCondition = 'monitor_time >= datetime(\"now\", \"-7 days\")';
  } else if (period === '30d') {
    timeCondition = 'monitor_time >= datetime(\"now\", \"-30 days\")';
  } else {
    timeCondition = 'monitor_time >= datetime(\"now\", \"-24 hours\")';
  }

  let sql = `SELECT sa.*, s.name as service_name, s.code as service_code 
             FROM service_availability sa 
             LEFT JOIN services s ON sa.service_id = s.id 
             WHERE ${timeCondition}`;
  const params: any[] = [];

  if (service_id) {
    sql += ' AND sa.service_id = ?';
    params.push(service_id);
  }

  sql += ' ORDER BY sa.monitor_time DESC';

  const availabilityData = db.prepare(sql).all(...params);

  const latestStatus = db.prepare(
    `SELECT s.id, s.name, s.code, 
            sa.status as current_status, 
            sa.response_time,
            sa.monitor_time as last_check_time,
            sa.error_message
     FROM services s
     LEFT JOIN service_availability sa ON s.id = sa.service_id
     WHERE s.status = 1
     GROUP BY s.id
     ORDER BY s.id ASC`
  ).all();

  const serviceAvailability = latestStatus.map((service: any) => {
    const serviceLogs = availabilityData.filter((log: any) => log.service_id === service.id);
    const totalChecks = serviceLogs.length;
    const onlineChecks = serviceLogs.filter((log: any) => log.status === 'online').length;
    const avgResponseTime = serviceLogs.length > 0 
      ? Math.round(serviceLogs.reduce((sum: number, log: any) => sum + (log.response_time || 0), 0) / serviceLogs.length)
      : 0;

    return {
      service_id: service.id,
      service_name: service.name,
      service_code: service.code,
      current_status: service.current_status || 'unknown',
      last_check_time: service.last_check_time,
      last_response_time: service.response_time,
      last_error: service.error_message,
      availability_rate: totalChecks > 0 ? Math.round(onlineChecks / totalChecks * 100) : 0,
      avg_response_time: avgResponseTime,
      total_checks: totalChecks,
      online_count: onlineChecks,
      offline_count: totalChecks - onlineChecks
    };
  });

  const overallStats = {
    total_services: serviceAvailability.length,
    online_services: serviceAvailability.filter((s: any) => s.current_status === 'online').length,
    offline_services: serviceAvailability.filter((s: any) => s.current_status === 'offline').length,
    avg_availability_rate: serviceAvailability.length > 0 
      ? Math.round(serviceAvailability.reduce((sum: number, s: any) => sum + s.availability_rate, 0) / serviceAvailability.length)
      : 0,
    avg_response_time: serviceAvailability.length > 0
      ? Math.round(serviceAvailability.reduce((sum: number, s: any) => sum + s.avg_response_time, 0) / serviceAvailability.length)
      : 0
  };

  return successResponse(res, {
    period,
    overall: overallStats,
    services: serviceAvailability,
    logs: availabilityData
  });
});

router.get('/availability/report', authMiddleware, adminMiddleware, (req, res) => {
  const { start_date, end_date } = req.query as any;

  const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = end_date || new Date().toISOString().split('T')[0];

  const dailyData = db.prepare(
    `SELECT DATE(monitor_time) as date,
            COUNT(*) as total_checks,
            SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online_count,
            AVG(response_time) as avg_response_time
     FROM service_availability
     WHERE DATE(monitor_time) BETWEEN ? AND ?
     GROUP BY DATE(monitor_time)
     ORDER BY date ASC`
  ).all(start, end);

  const report = dailyData.map((day: any) => ({
    date: day.date,
    total_checks: day.total_checks,
    online_count: day.online_count,
    offline_count: day.total_checks - day.online_count,
    availability_rate: day.total_checks > 0 ? Math.round(day.online_count / day.total_checks * 100) : 0,
    avg_response_time: Math.round(day.avg_response_time || 0)
  }));

  const summary = {
    start_date: start,
    end_date: end,
    total_days: report.length,
    avg_availability_rate: report.length > 0 
      ? Math.round(report.reduce((sum: number, day: any) => sum + day.availability_rate, 0) / report.length)
      : 0,
    avg_response_time: report.length > 0
      ? Math.round(report.reduce((sum: number, day: any) => sum + day.avg_response_time, 0) / report.length)
      : 0,
    total_checks: report.reduce((sum: number, day: any) => sum + day.total_checks, 0)
  };

  return successResponse(res, {
    summary,
    daily_report: report
  });
});

export default router;
