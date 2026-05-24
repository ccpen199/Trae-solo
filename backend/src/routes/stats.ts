import { Router, Response } from 'express';
import { allQuery, getQuery } from '../db';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth';

const router = Router();

router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const totalVehicles = await getQuery('SELECT COUNT(*) as count FROM vehicles');
    const availableVehicles = await getQuery('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['available']);
    const rentedVehicles = await getQuery('SELECT COUNT(*) as count FROM vehicles WHERE status IN (?, ?)', ['rented', 'reserved']);
    const maintenanceVehicles = await getQuery('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['maintenance']);
    
    const totalOrders = await getQuery('SELECT COUNT(*) as count FROM orders');
    const activeOrders = await getQuery('SELECT COUNT(*) as count FROM orders WHERE status IN (?, ?, ?)', ['paid', 'in_use', 'returned']);
    const completedOrders = await getQuery('SELECT COUNT(*) as count FROM orders WHERE status = ?', ['completed']);
    
    const totalRevenue = await getQuery('SELECT COALESCE(SUM(total_amount), 0) as sum FROM orders WHERE status = ?', ['completed']);
    const totalDeposits = await getQuery('SELECT COALESCE(SUM(amount), 0) as sum FROM deposits WHERE status = ?', ['frozen']);
    
    const pendingLicenses = await getQuery('SELECT COUNT(*) as count FROM license_verifications WHERE status = ?', ['pending']);
    const pendingViolations = await getQuery('SELECT COUNT(*) as count FROM violations WHERE status = ?', ['pending']);
    const pendingSettlements = await getQuery('SELECT COUNT(*) as count FROM orders WHERE status = ?', ['returned']);

    res.json({
      code: 200,
      message: 'success',
      data: {
        vehicles: {
          total: totalVehicles?.count || 0,
          available: availableVehicles?.count || 0,
          rented: rentedVehicles?.count || 0,
          maintenance: maintenanceVehicles?.count || 0,
          utilizationRate: totalVehicles?.count ? Math.round((rentedVehicles?.count || 0) / totalVehicles.count * 100) : 0
        },
        orders: {
          total: totalOrders?.count || 0,
          active: activeOrders?.count || 0,
          completed: completedOrders?.count || 0
        },
        finance: {
          totalRevenue: totalRevenue?.sum || 0,
          frozenDeposits: totalDeposits?.sum || 0
        },
        pending: {
          licenses: pendingLicenses?.count || 0,
          violations: pendingViolations?.count || 0,
          settlements: pendingSettlements?.count || 0
        }
      }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/vehicle-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const byBrand = await allQuery('SELECT brand, COUNT(*) as count FROM vehicles GROUP BY brand ORDER BY count DESC');
    const byStatus = await allQuery('SELECT status, COUNT(*) as count FROM vehicles GROUP BY status');
    const byStore = await allQuery(
      `SELECT s.name, COUNT(v.id) as count 
       FROM stores s LEFT JOIN vehicles v ON s.id = v.store_id 
       GROUP BY s.id ORDER BY count DESC`
    );

    res.json({
      code: 200,
      message: 'success',
      data: { byBrand, byStatus, byStore }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/order-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - Number(days));
    
    const dailyOrders = await allQuery(
      `SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders WHERE created_at >= ? 
       GROUP BY DATE(created_at) ORDER BY date DESC`,
      [dateLimit.toISOString()]
    );

    const byStatus = await allQuery('SELECT status, COUNT(*) as count FROM orders GROUP BY status');

    res.json({
      code: 200,
      message: 'success',
      data: { dailyOrders, byStatus }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

router.get('/finance-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - Number(days));
    
    const dailySettlements = await allQuery(
      `SELECT DATE(s.settlement_time) as date, COUNT(*) as count, 
              COALESCE(SUM(s.total_settlement), 0) as settlement_amount,
              COALESCE(SUM(s.deposit_refund), 0) as refund_amount
       FROM settlements s WHERE s.settlement_time >= ? 
       GROUP BY DATE(s.settlement_time) ORDER BY date DESC`,
      [dateLimit.toISOString()]
    );

    const totalSettled = await getQuery('SELECT COALESCE(SUM(total_settlement), 0) as sum FROM settlements WHERE status = ?', ['completed']);
    const totalRefunded = await getQuery('SELECT COALESCE(SUM(deposit_refund), 0) as sum FROM settlements WHERE status = ?', ['completed']);
    const totalDeducted = await getQuery('SELECT COALESCE(SUM(deduction_amount), 0) as sum FROM deposits WHERE status IN (?, ?)', ['partial_refunded', 'deducted']);

    res.json({
      code: 200,
      message: 'success',
      data: {
        dailySettlements,
        summary: {
          totalSettled: totalSettled?.sum || 0,
          totalRefunded: totalRefunded?.sum || 0,
          totalDeducted: totalDeducted?.sum || 0
        }
      }
    });
  } catch (err: any) {
    res.json({ code: 500, message: err.message });
  }
});

export default router;
