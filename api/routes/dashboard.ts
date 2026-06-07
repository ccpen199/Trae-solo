import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, scopeToOwn, type AuthRequest } from '../middleware.js';

const router = Router();

router.get('/stats', authenticate, scopeToOwn(), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fleetId = req.query.fleet_id as string | undefined;
    const ownerId = req.query.owner_id as string | undefined;

    const fleetFilter = fleetId ? 'AND v.fleet_id = ?' : '';
    const ownerFilter = ownerId ? 'AND v.owner_id = ?' : '';
    const params: number[] = [];
    if (fleetId) params.push(parseInt(fleetId));
    if (ownerId) params.push(parseInt(ownerId));

    const vehicleCount = db.prepare(`
      SELECT COUNT(*) as count FROM vehicles v WHERE 1=1 ${fleetFilter} ${ownerFilter}
    `).get(...params) as { count: number };

    const obuActivatedCount = db.prepare(`
      SELECT COUNT(*) as count FROM obu_devices o
      INNER JOIN vehicles v ON o.vehicle_id = v.id
      WHERE o.status = 'activated' ${fleetFilter.replace('AND v', 'AND v')} ${ownerFilter.replace('AND v', 'AND v')}
    `).get(...params) as { count: number };

    const tollCount = db.prepare(`
      SELECT COUNT(*) as count FROM toll_records t
      INNER JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.created_at >= datetime('now', '-30 days') ${fleetFilter.replace('AND v', 'AND v')} ${ownerFilter.replace('AND v', 'AND v')}
    `).get(...params) as { count: number };

    const totalAmount = db.prepare(`
      SELECT COALESCE(SUM(paid_amount), 0) as total FROM toll_records t
      INNER JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.created_at >= datetime('now', '-30 days') ${fleetFilter.replace('AND v', 'AND v')} ${ownerFilter.replace('AND v', 'AND v')}
    `).get(...params) as { total: number };

    const unpaidBills = db.prepare(`
      SELECT COUNT(*) as count FROM monthly_bills b
      INNER JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.status = 'unpaid' ${fleetFilter.replace('AND v', 'AND v')} ${ownerFilter.replace('AND v', 'AND v')}
    `).get(...params) as { count: number };

    const pendingAppeals = db.prepare(`
      SELECT COUNT(*) as count FROM appeals a
      INNER JOIN toll_records t ON a.toll_record_id = t.id
      INNER JOIN vehicles v ON t.vehicle_id = v.id
      WHERE a.status IN ('pending', 'reviewing') ${fleetFilter.replace('AND v', 'AND v')} ${ownerFilter.replace('AND v', 'AND v')}
    `).get(...params) as { count: number };

    res.json({
      success: true,
      data: {
        vehicle_count: vehicleCount.count,
        obu_activated_count: obuActivatedCount.count,
        toll_30d_count: tollCount.count,
        toll_30d_amount: totalAmount.total,
        unpaid_bills: unpaidBills.count,
        pending_appeals: pendingAppeals.count,
      },
    });
  } catch (e) {
    console.error('[Dashboard Error]', e);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

router.get('/toll-trend', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), scopeToOwn(), (req: AuthRequest, res: Response): void => {
  try {
    const fleetId = req.query.fleet_id as string | undefined;
    const ownerId = req.query.owner_id as string | undefined;

    const fleetFilter = fleetId ? 'AND v.fleet_id = ?' : '';
    const ownerFilter = ownerId ? 'AND v.owner_id = ?' : '';
    const params: number[] = [];
    if (fleetId) params.push(parseInt(fleetId));
    if (ownerId) params.push(parseInt(ownerId));

    const dailyData = db.prepare(`
      SELECT
        DATE(t.created_at) as date,
        COUNT(*) as count,
        SUM(t.paid_amount) as amount
      FROM toll_records t
      INNER JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.created_at >= datetime('now', '-30 days') ${fleetFilter.replace('AND v', 'AND v')} ${ownerFilter.replace('AND v', 'AND v')}
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `).all(...params);

    res.json({ success: true, data: dailyData });
  } catch (e) {
    console.error('[Dashboard Error]', e);
    res.status(500).json({ success: false, error: '获取趋势数据失败' });
  }
});

router.get('/vehicle-ranking', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), scopeToOwn(), (req: AuthRequest, res: Response): void => {
  try {
    const fleetId = req.query.fleet_id as string | undefined;
    const ownerId = req.query.owner_id as string | undefined;

    const fleetFilter = fleetId ? 'AND v.fleet_id = ?' : '';
    const ownerFilter = ownerId ? 'AND v.owner_id = ?' : '';
    const params: number[] = [];
    if (fleetId) params.push(parseInt(fleetId));
    if (ownerId) params.push(parseInt(ownerId));

    const ranking = db.prepare(`
      SELECT
        v.plate_number,
        COUNT(t.id) as trip_count,
        SUM(t.mileage) as total_mileage,
        SUM(t.paid_amount) as total_amount
      FROM vehicles v
      LEFT JOIN toll_records t ON v.id = t.vehicle_id AND t.created_at >= datetime('now', '-30 days')
      WHERE 1=1 ${fleetFilter} ${ownerFilter}
      GROUP BY v.id
      ORDER BY total_amount DESC
      LIMIT 10
    `).all(...params);

    res.json({ success: true, data: ranking });
  } catch (e) {
    console.error('[Dashboard Error]', e);
    res.status(500).json({ success: false, error: '获取排行数据失败' });
  }
});

export default router;
