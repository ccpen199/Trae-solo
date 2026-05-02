const db = require('../database');
const { generateId } = require('../utils/orderGenerator');
const { logAuditEvent, AUDIT_EVENT_TYPES } = require('./auditService');

const getDashboardStats = () => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE is_reverse = 0').get().count;
  const pendingOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE is_reverse = 0 AND status IN ('camera_opened', 'pending_recognition', 'recognition_in_progress', 'recognition_completed', 'pending_tryon', 'tryon_in_progress', 'tryon_completed', 'shared', 'pending_approval')
  `).get().count;
  const completedOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE is_reverse = 0 AND status IN ('order_placed', 'paid', 'shipped', 'completed')
  `).get().count;
  const cancelledOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE is_reverse = 0 AND status IN ('cancelled', 'rejected')
  `).get().count;
  
  const totalAmountResult = db.prepare(`
    SELECT SUM(total_amount) as total FROM orders 
    WHERE is_reverse = 0 AND status IN ('order_placed', 'paid', 'shipped', 'completed')
  `).get();
  const totalAmount = totalAmountResult.total || 0;

  const recognitionTotal = db.prepare('SELECT COUNT(*) as count FROM recognition_results').get().count;
  const recognitionSuccess = db.prepare("SELECT COUNT(*) as count FROM recognition_results WHERE status = 'completed'").get().count;
  const recognitionSuccessRate = recognitionTotal > 0 ? (recognitionSuccess / recognitionTotal * 100).toFixed(2) : 0;

  const tryonTotal = db.prepare("SELECT COUNT(*) as count FROM order_details WHERE status NOT IN ('pending', 'reverse')").get().count;
  const tryonSuccess = db.prepare("SELECT COUNT(*) as count FROM order_details WHERE status IN ('shared', 'approved', 'ordered')").get().count;
  const tryonSuccessRate = tryonTotal > 0 ? (tryonSuccess / tryonTotal * 100).toFixed(2) : 0;

  const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0;

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalAmount: Number(totalAmount),
    recognitionSuccessRate: Number(recognitionSuccessRate),
    tryonSuccessRate: Number(tryonSuccessRate),
    conversionRate: Number(conversionRate)
  };
};

const createSnapshot = () => {
  const stats = getDashboardStats();
  const today = new Date().toISOString().split('T')[0];
  
  const existing = db.prepare('SELECT id FROM statistics_snapshots WHERE snapshot_date = ?').get(today);
  if (existing) {
    return { success: true, message: '今日快照已存在' };
  }

  const snapshotId = generateId('snap');
  
  const stmt = db.prepare(`
    INSERT INTO statistics_snapshots (
      id, snapshot_date, total_orders, pending_orders,
      completed_orders, cancelled_orders, total_amount,
      recognition_success_rate, tryon_success_rate, conversion_rate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    snapshotId,
    today,
    stats.totalOrders,
    stats.pendingOrders,
    stats.completedOrders,
    stats.cancelledOrders,
    stats.totalAmount,
    stats.recognitionSuccessRate,
    stats.tryonSuccessRate,
    stats.conversionRate
  );

  logAuditEvent(AUDIT_EVENT_TYPES.STATISTICS_UPDATED, {
    detail: { snapshotId, date: today, ...stats }
  });

  return { success: true, snapshot: { id: snapshotId, snapshot_date: today, ...stats } };
};

const getSnapshots = (limit = 30) => {
  return db.prepare(`
    SELECT * FROM statistics_snapshots 
    ORDER BY snapshot_date DESC 
    LIMIT ?
  `).all(limit);
};

const getOrdersByStatus = () => {
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM orders 
    WHERE is_reverse = 0
    GROUP BY status
  `).all();
  
  const result = {};
  for (const row of rows) {
    result[row.status] = row.count;
  }
  return result;
};

const getTopProducts = (limit = 10) => {
  return db.prepare(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      p.price,
      COUNT(od.id) as tryon_count,
      SUM(CASE WHEN od.status IN ('approved', 'ordered') THEN 1 ELSE 0 END) as order_count
    FROM products p
    LEFT JOIN order_details od ON p.id = od.product_id
    WHERE p.status = 'active'
    GROUP BY p.id
    ORDER BY tryon_count DESC
    LIMIT ?
  `).all(limit);
};

const getConsumerStats = (consumerId) => {
  const totalOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE consumer_id = ? AND is_reverse = 0
  `).get(consumerId).count;

  const totalSpentResult = db.prepare(`
    SELECT SUM(total_amount) as total FROM orders 
    WHERE consumer_id = ? AND is_reverse = 0 AND status IN ('order_placed', 'paid', 'shipped', 'completed')
  `).get(consumerId);
  const totalSpent = totalSpentResult.total || 0;

  const recentOrders = db.prepare(`
    SELECT * FROM orders 
    WHERE consumer_id = ? AND is_reverse = 0
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(consumerId);

  return {
    totalOrders,
    totalSpent: Number(totalSpent),
    recentOrders
  };
};

module.exports = {
  getDashboardStats,
  createSnapshot,
  getSnapshots,
  getOrdersByStatus,
  getTopProducts,
  getConsumerStats
};
