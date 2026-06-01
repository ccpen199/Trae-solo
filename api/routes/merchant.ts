import { Router, type Request, type Response } from 'express';
import db from '../db.js';

const router = Router();

router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const { store_id } = req.query;
    const params: any[] = [];

    let tvQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(s.amount), 0) as revenue
      FROM verifications v
      LEFT JOIN settlements s ON v.id = s.redemption_id
      WHERE DATE(v.verification_time) = DATE('now')
    `;
    if (store_id) { tvQuery += ' AND v.store_id = ?'; params.push(store_id); }
    const todayVerifications = db.prepare(tvQuery).get(...params) as any;

    params.length = 0;
    let psQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
      FROM settlements 
      WHERE status = 'pending'
    `;
    if (store_id) { psQuery += ' AND store_id = ?'; params.push(store_id); }
    const pendingSettlements = db.prepare(psQuery).get(...params) as any;

    params.length = 0;
    let tgQuery = `
      SELECT COUNT(*) as count
      FROM verifications v
      WHERE 1=1
    `;
    if (store_id) { tgQuery += ' AND v.store_id = ?'; params.push(store_id); }
    const totalVerifications = db.prepare(tgQuery).get(...params) as any;

    const pendingRefunds = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(refund_amount), 0) as amount
      FROM refunds 
      WHERE status = 'pending'
    `).get() as any;

    res.json({
      success: true,
      data: {
        today_verifications: todayVerifications.count,
        today_revenue: todayVerifications.revenue || 0,
        pending_settlements_count: pendingSettlements.count,
        pending_settlements_amount: pendingSettlements.amount || 0,
        total_verifications: totalVerifications.count,
        pending_refunds_count: pendingRefunds.count,
        pending_refunds_amount: pendingRefunds.amount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/verifications', (req: Request, res: Response) => {
  try {
    const { store_id, start_date, end_date, page = 1, page_size = 20 } = req.query;
    
    let query = `
      SELECT 
        v.*,
        c.coupon_code,
        cp.name as package_name,
        u.name as user_name,
        u.phone as user_phone,
        st.name as store_name,
        s.name as service_name,
        stf.name as staff_name,
        se.amount as settlement_amount,
        se.profit_amount as commission,
        se.amount as net_amount,
        se.status as settlement_status
      FROM verifications v
      JOIN coupons c ON v.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON v.user_id = u.id
      JOIN stores st ON v.store_id = st.id
      LEFT JOIN services s ON v.service_id = s.id
      LEFT JOIN users stf ON v.staff_id = stf.id
      LEFT JOIN settlements se ON v.id = se.redemption_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (store_id) {
      query += ' AND v.store_id = ?';
      params.push(store_id);
    }
    if (start_date) {
      query += ' AND DATE(v.verification_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(v.verification_time) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY v.verification_time DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), (Number(page) - 1) * Number(page_size));

    const verifications = db.prepare(query).all(...params) as any[];

    res.json({ success: true, data: verifications });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/settlements', (req: Request, res: Response) => {
  try {
    const { store_id, status, start_date, end_date, page = 1, page_size = 20 } = req.query;
    
    let query = `
      SELECT 
        s.*,
        st.name as store_name,
        v.verification_time,
        c.coupon_code,
        cp.name as package_name
      FROM settlements s
      JOIN stores st ON s.store_id = st.id
      JOIN verifications v ON s.redemption_id = v.id
      JOIN coupons c ON s.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (store_id) {
      query += ' AND s.store_id = ?';
      params.push(store_id);
    }
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(page_size), (Number(page) - 1) * Number(page_size));

    const settlements = db.prepare(query).all(...params) as any[];

    const totalQuery = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(profit_amount), 0) as total_commission,
        COALESCE(SUM(amount - profit_amount), 0) as total_net_amount
      FROM settlements s
      WHERE 1=1
    `;
    const totalParams = params.slice(0, -2);
    const totals = db.prepare(totalQuery).get(...totalParams) as any;

    res.json({ success: true, data: { list: settlements, totals } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/settlements/settle', (req: Request, res: Response) => {
  try {
    const { store_id, settlement_ids } = req.body;

    let query = 'UPDATE settlements SET status = ?, settlement_date = DATE(\'now\') WHERE status = ?';
    const params: any[] = ['settled', 'pending'];

    if (store_id) {
      query += ' AND store_id = ?';
      params.push(store_id);
    }
    if (settlement_ids && settlement_ids.length > 0) {
      query += ` AND id IN (${settlement_ids.map(() => '?').join(',')})`;
      params.push(...settlement_ids);
    }

    const result = db.prepare(query).run(...params);

    res.json({ success: true, data: { updated_count: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/store-performance', (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.name,
        COUNT(v.id) as verification_count,
        COALESCE(SUM(se.amount), 0) as total_revenue,
        COALESCE(SUM(se.amount - se.profit_amount), 0) as net_revenue
      FROM stores s
      LEFT JOIN verifications v ON s.id = v.store_id
      LEFT JOIN settlements se ON v.id = se.redemption_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date) {
      query += ' AND DATE(v.verification_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(v.verification_time) <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY s.id, s.name ORDER BY total_revenue DESC';

    const performance = db.prepare(query).all(...params) as any[];

    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/anomalies', (req: Request, res: Response) => {
  try {
    const anomalies = db.prepare(`
      SELECT 
        c.id,
        c.coupon_code as code,
        c.status,
        cp.name as package_name,
        u.name as user_name,
        u.phone as user_phone,
        'expired_soon' as type,
        '券即将过期' as description
      FROM coupons c
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON c.user_id = u.id
      WHERE c.status IN ('active', 'partial')
        AND (c.total_uses - c.used_uses) > 0
        AND DATE(c.expire_date) BETWEEN DATE('now') AND DATE('now', '+7 days')
      
      UNION ALL
      
      SELECT 
        c.id,
        c.coupon_code as code,
        c.status,
        cp.name as package_name,
        u.name as user_name,
        u.phone as user_phone,
        'over_expired' as type,
        '券已过期但未标记' as description
      FROM coupons c
      JOIN coupon_packages cp ON c.package_id = cp.id
      JOIN users u ON c.user_id = u.id
      WHERE c.status IN ('active', 'partial')
        AND (c.total_uses - c.used_uses) > 0
        AND DATE(c.expire_date) < DATE('now')
    `).all() as any[];

    res.json({ success: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/export/settlements', (req: Request, res: Response) => {
  try {
    const { store_id, start_date, end_date, status } = req.query;
    
    let query = `
      SELECT 
        s.id as settlement_id,
        st.name as store_name,
        c.coupon_code,
        cp.name as package_name,
        v.verification_time,
        s.amount,
        s.profit_amount as commission,
        (s.amount - s.profit_amount) as net_amount,
        s.status,
        s.settlement_date
      FROM settlements s
      JOIN stores st ON s.store_id = st.id
      JOIN verifications v ON s.redemption_id = v.id
      JOIN coupons c ON s.coupon_id = c.id
      JOIN coupon_packages cp ON c.package_id = cp.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (store_id) {
      query += ' AND s.store_id = ?';
      params.push(store_id);
    }
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY s.created_at DESC';

    const data = db.prepare(query).all(...params) as any[];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="settlements_${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
