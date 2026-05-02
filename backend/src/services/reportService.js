const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const StateSyncService = require('./stateSyncService');

const ReportService = {
  getDailyStatistics(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const startOfDay = Math.floor(new Date(targetDate + 'T00:00:00').getTime() / 1000);
    const endOfDay = Math.floor(new Date(targetDate + 'T23:59:59').getTime() / 1000);

    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count FROM order_main 
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay).count;

    const completedOrders = db.prepare(`
      SELECT COUNT(*) as count FROM order_main 
      WHERE status IN ('completed', 'payment_completed')
      AND created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay).count;

    const cancelledOrders = db.prepare(`
      SELECT COUNT(*) as count FROM order_main 
      WHERE status = 'cancelled'
      AND created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay).count;

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(actual_price), 0) as total FROM order_main 
      WHERE status IN ('completed', 'payment_completed')
      AND created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay).total;

    const avgOrderPrice = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    const avgProcessTime = db.prepare(`
      SELECT AVG(updated_at - created_at) as avg_time
      FROM order_main 
      WHERE status IN ('completed', 'payment_completed')
      AND created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay).avg_time || 0;

    const pendingExceptions = db.prepare(`
      SELECT COUNT(*) as count FROM exceptions 
      WHERE status = 'pending'
    `).get().count;

    const todayExceptions = db.prepare(`
      SELECT COUNT(*) as count FROM exceptions 
      WHERE created_at >= ? AND created_at <= ?
    `).get(startOfDay, endOfDay).count;

    const conversionRate = totalOrders > 0 ? completedOrders / totalOrders : 0;
    const exceptionRate = totalOrders > 0 ? todayExceptions / totalOrders : 0;

    return {
      date: targetDate,
      summary: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders: totalOrders - completedOrders - cancelledOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderPrice: Math.round(avgOrderPrice * 100) / 100,
        avgProcessTimeMinutes: Math.round(avgProcessTime / 60)
      },
      rates: {
        conversionRate: Math.round(conversionRate * 10000) / 100,
        exceptionRate: Math.round(exceptionRate * 10000) / 100,
        cancellationRate: totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 10000) / 100 : 0
      },
      exceptions: {
        today: todayExceptions,
        pending: pendingExceptions
      }
    };
  },

  getDriverPerformanceStats(driverId, startDate, endDate) {
    const start = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : 0;
    const end = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : Math.floor(Date.now() / 1000);

    const orders = db.prepare(`
      SELECT * FROM order_main 
      WHERE driver_id = ? 
      AND created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `).all(driverId, start, end);

    const completedCount = orders.filter(o => ['completed', 'payment_completed'].includes(o.status)).length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    const totalRevenue = orders
      .filter(o => ['completed', 'payment_completed'].includes(o.status))
      .reduce((sum, o) => sum + (o.actual_price || 0), 0);

    const ratings = db.prepare(`
      SELECT rating FROM comments_approvals 
      WHERE order_id IN (
        SELECT id FROM order_main WHERE driver_id = ?)
      AND rating IS NOT NULL
    `).all(driverId);

    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return {
      driverId,
      period: { startDate, endDate },
      totalOrders: orders.length,
      completedOrders: completedCount,
      cancelledOrders: cancelledCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRating: Math.round(avgRating * 100) / 100,
      ratingCount: ratings.length
    };
  },

  getPassengerStats(passengerId, startDate, endDate) {
    const start = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : 0;
    const end = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : Math.floor(Date.now() / 1000);

    const orders = db.prepare(`
      SELECT * FROM order_main 
      WHERE passenger_id = ? 
      AND created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
    `).all(passengerId, start, end);

    const completedCount = orders.filter(o => ['completed', 'payment_completed'].includes(o.status)).length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    const totalSpent = orders
      .filter(o => ['completed', 'payment_completed'].includes(o.status))
      .reduce((sum, o) => sum + (o.actual_price || 0), 0);

    return {
      passengerId,
      period: { startDate, endDate },
      totalOrders: orders.length,
      completedOrders: completedCount,
      cancelledOrders: cancelledCount,
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgOrderValue: completedCount > 0 ? Math.round((totalSpent / completedCount) * 100) / 100 : 0
    };
  },

  getRealTimeDashboard() {
    const pendingOrders = db.prepare(`
      SELECT om.*, 
             p_user.name as passenger_name,
             p_user.phone as passenger_phone
      FROM order_main om
      JOIN passengers p ON om.passenger_id = p.id
      JOIN users p_user ON p.user_id = p_user.id
      WHERE om.status = 'pending'
      ORDER BY om.created_at ASC
    `).all();

    const activeOrders = db.prepare(`
      SELECT om.*,
             p_user.name as passenger_name,
             d_user.name as driver_name,
             d.car_plate,
             d.car_model
      FROM order_main om
      JOIN passengers p ON om.passenger_id = p.id
      JOIN users p_user ON p.user_id = p_user.id
      JOIN drivers d ON om.driver_id = d.id
      JOIN users d_user ON d.user_id = d_user.id
      WHERE om.status IN ('driver_assigned', 'driver_accepted', 'in_progress')
      ORDER BY om.created_at ASC
    `).all();

    const activeDrivers = db.prepare(`
      SELECT d.*, u.name as driver_name, u.phone
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      WHERE d.status IN ('idle', 'assigned', 'in_ride')
    `).all();

    const pendingExceptions = db.prepare(`
      SELECT e.*,
             om.order_no,
             om.start_address,
             om.end_address
      FROM exceptions e
      JOIN order_main om ON e.order_id = om.id
      WHERE e.status = 'pending'
      ORDER BY e.created_at DESC
    `).all();

    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('completed', 'payment_completed') THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COALESCE(SUM(CASE WHEN status IN ('completed', 'payment_completed') THEN actual_price ELSE 0 END), 0) as revenue
      FROM order_main
      WHERE created_at >= ?
    `).get(todayStart);

    return {
      realTime: {
        pendingOrders: pendingOrders.length,
        activeOrders: activeOrders.length,
        activeDrivers: activeDrivers.length,
        idleDrivers: activeDrivers.filter(d => d.status === 'idle').length,
        pendingExceptions: pendingExceptions.length
      },
      today: {
        totalOrders: todayStats.total || 0,
        completedOrders: todayStats.completed || 0,
        cancelledOrders: todayStats.cancelled || 0,
        revenue: Math.round((todayStats.revenue || 0) * 100) / 100
      },
      pendingOrders,
      activeOrders,
      activeDrivers,
      pendingExceptions
    };
  },

  getOrderDetailWithRelations(orderId) {
    const order = db.prepare(`
      SELECT om.*,
             p_user.id as passenger_user_id,
             p_user.name as passenger_name,
             p_user.phone as passenger_phone,
             d_user.id as driver_user_id,
             d_user.name as driver_name,
             d_user.phone as driver_phone,
             d.car_model,
             d.car_plate,
             d.rating as driver_rating
      FROM order_main om
      JOIN passengers p ON om.passenger_id = p.id
      JOIN users p_user ON p.user_id = p_user.id
      LEFT JOIN drivers d ON om.driver_id = d.id
      LEFT JOIN users d_user ON d.user_id = d_user.id
      WHERE om.id = ?
    `).get(orderId);

    if (!order) return null;

    const statusFlow = db.prepare(`
      SELECT sf.*, u.name as operator_name
      FROM status_flow sf
      LEFT JOIN users u ON sf.operator_id = u.id
      WHERE sf.order_id = ?
      ORDER BY sf.created_at ASC
    `).all(orderId);

    const details = db.prepare(`
      SELECT * FROM order_detail 
      WHERE order_id = ?
      ORDER BY created_at ASC
    `).all(orderId);

    const comments = db.prepare(`
      SELECT ca.*, u.name as user_name
      FROM comments_approvals ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.order_id = ?
      ORDER BY ca.created_at DESC
    `).all(orderId);

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE order_id = ?
      ORDER BY created_at DESC
    `).all(orderId);

    const tracks = db.prepare(`
      SELECT * FROM order_tracks 
      WHERE order_id = ?
      ORDER BY created_at ASC
    `).all(orderId);

    const exceptions = db.prepare(`
      SELECT * FROM exceptions 
      WHERE order_id = ?
      ORDER BY created_at DESC
    `).all(orderId);

    return {
      order,
      statusFlow,
      details,
      comments,
      notifications,
      tracks,
      exceptions,
      timeline: this.buildTimeline(order, statusFlow, comments, exceptions)
    };
  },

  buildTimeline(order, statusFlow, comments, exceptions) {
    const timeline = [];

    timeline.push({
      type: 'order_created',
      title: '订单创建',
      description: `订单 ${order.order_no} 已创建`,
      time: order.created_at * 1000
    });

    statusFlow.forEach(sf => {
      timeline.push({
        type: 'status_change',
        title: '状态变更',
        description: `从 ${StateSyncService.getStatusName(sf.from_status)} 变更为 ${StateSyncService.getStatusName(sf.to_status)}`,
        operator: sf.operator_name,
        reason: sf.reason,
        time: sf.created_at * 1000
      });
    });

    comments.forEach(c => {
      timeline.push({
        type: 'comment',
        title: c.action === 'rate' ? '评价' : '审批意见',
        description: c.content,
        rating: c.rating,
        user: c.user_name,
        time: c.created_at * 1000
      });
    });

    exceptions.forEach(e => {
      const ExceptionService = require('./exceptionService');
      timeline.push({
        type: 'exception',
        title: '异常',
        description: e.description,
        exceptionType: ExceptionService.getExceptionTypeName(e.exception_type),
        status: e.status,
        time: e.created_at * 1000
      });
    });

    return timeline.sort((a, b) => a.time - b.time);
  },

  createStatisticsSnapshot(snapshotType) {
    const snapshotDate = new Date().toISOString().split('T')[0];
    
    const existing = db.prepare(`
      SELECT id FROM statistics_snapshots 
      WHERE snapshot_date = ? AND snapshot_type = ?
    `).get(snapshotDate, snapshotType);

    if (existing) {
      return { success: false, error: '今日快照已存在' };
    }

    const snapshotId = uuidv4();
    let snapshotData;

    switch (snapshotType) {
      case 'daily':
        snapshotData = this.getDailyStatistics();
        break;
      default:
        snapshotData = this.getRealTimeDashboard();
    }

    db.prepare(`
      INSERT INTO statistics_snapshots (id, snapshot_date, snapshot_type, data)
      VALUES (?, ?, ?, ?)
    `).run(snapshotId, snapshotDate, snapshotType, JSON.stringify(snapshotData));

    return {
      success: true,
      snapshotId,
      snapshotDate,
      snapshotType
    };
  },

  getStatisticsSnapshots(startDate, endDate, snapshotType = 'daily') {
    let query = `
      SELECT * FROM statistics_snapshots 
      WHERE snapshot_type = ?
    `;
    const params = [snapshotType];

    if (startDate) {
      query += ' AND snapshot_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND snapshot_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY snapshot_date DESC';

    return db.prepare(query).all(...params).map(s => ({
      ...s,
      data: JSON.parse(s.data)
    }));
  }
};

module.exports = ReportService;
