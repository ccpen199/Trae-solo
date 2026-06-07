import { Router, Response } from 'express';
import db from '../db/database.ts';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = Router();

function serializeSettlement(row: any) {
  if (!row) return row;
  return {
    ...row,
    merchant: row.merchant_id
      ? {
          id: row.merchant_id,
          name: row.merchant_name,
          company_name: row.merchant_name,
        }
      : null,
    knight: row.knight_id
      ? {
          id: row.knight_id,
          name: row.knight_name,
        }
      : null,
    waybill: row.waybill_id
      ? {
          id: row.waybill_id,
          order_no: row.order_no,
        }
      : null,
  };
}

router.get('/merchant/:merchantId', authMiddleware, roleMiddleware('admin', 'merchant'), (req: AuthRequest, res: Response) => {
  const merchantId = parseInt(req.params.merchantId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as count FROM waybills WHERE merchant_id = ? AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { count: number };

  const completedOrders = db.prepare(`
    SELECT COUNT(*) as count FROM waybills
    WHERE merchant_id = ? AND status = 'completed' AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { count: number };

  const cancelledOrders = db.prepare(`
    SELECT COUNT(*) as count FROM waybills
    WHERE merchant_id = ? AND status = 'cancelled' AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { count: number };

  const onTimeOrders = db.prepare(`
    SELECT COUNT(*) as count FROM waybills
    WHERE merchant_id = ? AND status = 'completed'
    AND actual_deliver_time <= deliver_deadline
    AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { count: number };

  const complaints = db.prepare(`
    SELECT COUNT(*) as count FROM complaints c
    JOIN waybills w ON c.waybill_id = w.id
    WHERE w.merchant_id = ? AND c.created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { count: number };

  const totalFee = db.prepare(`
    SELECT COALESCE(SUM(fee), 0) as total FROM waybills
    WHERE merchant_id = ? AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { total: number };

  const totalSettlements = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM settlements
    WHERE merchant_id = ? AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { total: number };

  const paidSettlements = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM settlements
    WHERE merchant_id = ? AND status = 'paid' AND created_at >= ?
  `).get(merchantId, thirtyDaysAgo) as { total: number };

  const deliveryRate = totalOrders.count > 0
    ? (completedOrders.count / totalOrders.count) * 100
    : 0;

  const complaintRate = totalOrders.count > 0
    ? (complaints.count / totalOrders.count) * 100
    : 0;

  const onTimeRate = completedOrders.count > 0
    ? (onTimeOrders.count / completedOrders.count) * 100
    : 0;

  res.json({
    code: 0,
    data: {
      period: 'last_30_days',
      total_orders: totalOrders.count,
      completed_orders: completedOrders.count,
      cancelled_orders: cancelledOrders.count,
      delivery_rate: parseFloat(deliveryRate.toFixed(2)),
      on_time_rate: parseFloat(onTimeRate.toFixed(2)),
      complaint_count: complaints.count,
      complaint_rate: parseFloat(complaintRate.toFixed(2)),
      total_fee: totalFee.total,
      settlement_summary: {
        total: totalSettlements.total,
        paid: paidSettlements.total,
        pending: totalSettlements.total - paidSettlements.total,
      },
    },
    message: 'Success',
  });
});

router.get('/admin', authMiddleware, roleMiddleware('admin'), (req: AuthRequest, res: Response) => {
  const totalKnights = db.prepare('SELECT COUNT(*) as count FROM knights').get() as { count: number };
  const onlineKnights = db.prepare("SELECT COUNT(*) as count FROM knights WHERE status IN ('online', 'busy')").get() as { count: number };
  const totalMerchants = db.prepare('SELECT COUNT(*) as count FROM merchants').get() as { count: number };
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM waybills').get() as { count: number };

  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'pending'").get() as { count: number };
  const deliveringOrders = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'delivering'").get() as { count: number };
  const completedOrders = db.prepare("SELECT COUNT(*) as count FROM waybills WHERE status = 'completed'").get() as { count: number };

  const pendingExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status = 'pending'").get() as { count: number };

  const totalRevenue = db.prepare('SELECT COALESCE(SUM(fee), 0) as total FROM waybills').get() as { total: number };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const todayOrders = db.prepare('SELECT COUNT(*) as count FROM waybills WHERE created_at >= ?').get(todayIso) as { count: number };
  const todayRevenue = db.prepare('SELECT COALESCE(SUM(fee), 0) as total FROM waybills WHERE created_at >= ?').get(todayIso) as { total: number };

  const avgRating = db.prepare('SELECT AVG(avg_rating) as avg FROM knights').get() as { avg: number };
  const avgCredit = db.prepare('SELECT AVG(credit_score) as avg FROM knights').get() as { avg: number };

  const slaStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN accepted_at IS NOT NULL AND julianday(accepted_at) - julianday(created_at) <= 1.0/1440 THEN 1 ELSE 0 END) as response_1min,
      SUM(CASE WHEN actual_pickup_time IS NOT NULL AND julianday(actual_pickup_time) - julianday(created_at) <= 8.0/1440 THEN 1 ELSE 0 END) as pickup_8min,
      SUM(CASE WHEN actual_deliver_time IS NOT NULL AND julianday(actual_deliver_time) - julianday(created_at) <= 60.0/1440 THEN 1 ELSE 0 END) as deliver_60min,
      SUM(CASE WHEN status = 'completed' AND actual_deliver_time <= deliver_deadline THEN 1 ELSE 0 END) as on_time_completed,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed
    FROM waybills
    WHERE created_at >= ?
  `).get(todayIso) as any;

  const sla = {
    response_1min_rate: slaStats.total > 0 ? parseFloat(((slaStats.response_1min / slaStats.total) * 100).toFixed(2)) : 0,
    pickup_8min_rate: slaStats.total > 0 ? parseFloat(((slaStats.pickup_8min / slaStats.total) * 100).toFixed(2)) : 0,
    deliver_60min_rate: slaStats.total > 0 ? parseFloat(((slaStats.deliver_60min / slaStats.total) * 100).toFixed(2)) : 0,
    on_time_rate: slaStats.total_completed > 0 ? parseFloat(((slaStats.on_time_completed / slaStats.total_completed) * 100).toFixed(2)) : 0,
    total: slaStats.total,
    response_1min_count: slaStats.response_1min,
    pickup_8min_count: slaStats.pickup_8min,
    deliver_60min_count: slaStats.deliver_60min,
    breach_count: slaStats.total - slaStats.deliver_60min,
  };

  const knightDetails = db.prepare(`
    SELECT k.*,
      (SELECT COUNT(*) FROM waybills w WHERE w.knight_id = k.id AND w.status IN ('accepted', 'picked_up', 'delivering')) as active_order_count
    FROM knights k
    ORDER BY k.current_load DESC, k.credit_score DESC
    LIMIT 10
  `).all() as any[];

  const capacityGaps = db.prepare(`
    SELECT
      CAST(ROUND(sender_lat, 2) AS TEXT) || ',' || CAST(ROUND(sender_lng, 2) AS TEXT) as region,
      COUNT(*) as pending_orders,
      (
        SELECT COUNT(*) FROM knights k2
        WHERE (julianday('now') - julianday(k2.last_active_at)) < 0.5
        AND k2.status IN ('online', 'busy')
        AND k2.current_load < k2.capacity
        AND ABS(k2.lat - w.sender_lat) < 0.05
        AND ABS(k2.lng - w.sender_lng) < 0.05
      ) as available_knights
    FROM waybills w
    WHERE w.status = 'pending'
    GROUP BY region
    ORDER BY pending_orders DESC
    LIMIT 5
  `).all() as any[];

  const regionCapacity = capacityGaps.map((g: any) => ({
    region: g.region,
    pending_orders: g.pending_orders,
    available_knights: g.available_knights || 0,
    gap: Math.max(0, g.pending_orders - (g.available_knights || 0)),
    urgency: g.pending_orders > (g.available_knights || 0) * 2 ? 'high' : g.pending_orders > (g.available_knights || 0) ? 'medium' : 'low',
  }));

  res.json({
    code: 0,
    data: {
      knights: {
        total: totalKnights.count,
        online: onlineKnights.count,
        offline: totalKnights.count - onlineKnights.count,
        avg_rating: parseFloat((avgRating.avg || 0).toFixed(2)),
        avg_credit: parseFloat((avgCredit.avg || 0).toFixed(2)),
        details: knightDetails.map((k: any) => ({
          id: k.id,
          name: k.name,
          status: k.status,
          type: k.type,
          credit_score: k.credit_score,
          current_load: k.current_load,
          capacity: k.capacity,
          load_rate: parseFloat(((k.current_load / k.capacity) * 100).toFixed(1)),
          lat: k.lat,
          lng: k.lng,
          last_active_at: k.last_active_at,
          active_order_count: k.active_order_count,
          avg_rating: k.avg_rating,
        })),
      },
      merchants: {
        total: totalMerchants.count,
      },
      orders: {
        total: totalOrders.count,
        today: todayOrders.count,
        pending: pendingOrders.count,
        delivering: deliveringOrders.count,
        completed: completedOrders.count,
      },
      sla,
      capacity_gaps: regionCapacity,
      exceptions: {
        pending: pendingExceptions.count,
      },
      revenue: {
        total: totalRevenue.total,
        today: todayRevenue.total,
      },
    },
    message: 'Success',
  });
});

router.get('/settlements', authMiddleware, roleMiddleware('admin', 'merchant'), (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  const status = req.query.status as string;
  const merchantId = req.query.merchantId as string;
  const knightId = req.query.knightId as string;

  let sql = `
    SELECT s.*, w.order_no, m.company_name as merchant_name, k.name as knight_name
    FROM settlements s
    LEFT JOIN waybills w ON s.waybill_id = w.id
    LEFT JOIN merchants m ON s.merchant_id = m.id
    LEFT JOIN knights k ON s.knight_id = k.id
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }
  if (merchantId) {
    conditions.push('s.merchant_id = ?');
    params.push(parseInt(merchantId));
  }
  if (knightId) {
    conditions.push('s.knight_id = ?');
    params.push(parseInt(knightId));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);

  const settlements = db.prepare(sql).all(...params).map(serializeSettlement);

  let countSql = 'SELECT COUNT(*) as count FROM settlements s';
  if (conditions.length > 0) {
    countSql += ' WHERE ' + conditions.join(' AND ');
  }
  const total = db.prepare(countSql).get(...params.slice(0, -2)) as { count: number };

  res.json({
    code: 0,
    data: {
      list: settlements,
      total: total.count,
      page,
      pageSize,
    },
    message: 'Success',
  });
});

export default router;
