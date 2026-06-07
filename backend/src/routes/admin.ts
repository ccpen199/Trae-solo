import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const totalBuildings = (db.prepare('SELECT COUNT(*) as cnt FROM buildings').get() as any).cnt;
    const totalListings = (db.prepare('SELECT COUNT(*) as cnt FROM listings WHERE status = \'在售\'').get() as any).cnt;
    const totalAgents = (db.prepare('SELECT COUNT(*) as cnt FROM agents WHERE status = \'在岗\'').get() as any).cnt;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const dealsThisMonth = (db.prepare(`
      SELECT COUNT(*) as cnt FROM contracts
      WHERE status = '已签署' AND strftime('%Y-%m', signed_at) = ?
    `).get(currentMonth) as any).cnt;

    const totalCommission = (db.prepare('SELECT COALESCE(SUM(commission_total), 0) as total FROM agents').get() as any).total;
    const avgPrice = (db.prepare('SELECT COALESCE(AVG(avg_price), 0) as avg FROM buildings').get() as any).avg;

    res.json({
      code: 0,
      data: {
        total_buildings: totalBuildings,
        total_listings: totalListings,
        total_agents: totalAgents,
        deals_this_month: dealsThisMonth,
        total_commission: totalCommission,
        avg_city_price: Math.round(avgPrice)
      },
      message: 'success'
    });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/price-alerts', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        curr.district,
        curr.month as current_month,
        curr.avg_price as current_price,
        prev.avg_price as previous_price,
        ROUND((curr.avg_price - prev.avg_price) * 100.0 / prev.avg_price, 2) as change_percent,
        curr.volume as current_volume
      FROM price_trends curr
      JOIN price_trends prev ON curr.district = prev.district
      WHERE ABS(curr.avg_price - prev.avg_price) * 100.0 / prev.avg_price > 5
        AND curr.month > prev.month
      ORDER BY change_percent DESC
    `).all();

    res.json({ code: 0, data: rows, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/school-heat', (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let where = "WHERE school_district IS NOT NULL AND school_district != ''";
    const params: any[] = [];

    if (search) { where += ' AND school_district LIKE ?'; params.push(`%${search}%`); }

    const rows = db.prepare(`
      SELECT
        school_district,
        COUNT(DISTINCT b.id) as building_count,
        COALESCE(AVG(b.avg_price), 0) as avg_price,
        COUNT(DISTINCT l.id) as listing_count
      FROM buildings b
      LEFT JOIN listings l ON b.id = l.building_id AND l.status = '在售'
      ${where}
      GROUP BY school_district
      ORDER BY listing_count DESC, building_count DESC
    `).all(...params);

    res.json({ code: 0, data: rows, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/agent-ranking', (req: Request, res: Response) => {
  try {
    const { sort_by = 'deal_count' } = req.query;
    const allowedSorts = ['deal_count', 'rating', 'commission_total'];
    const sortColumn = allowedSorts.includes(sort_by as string) ? sort_by as string : 'deal_count';

    const rows = db.prepare(`
      SELECT id, name, phone, avatar, agency, rating, showing_count, deal_count, commission_total, specialties, status
      FROM agents
      WHERE status = '在岗'
      ORDER BY ${sortColumn} DESC
      LIMIT 20
    `).all();

    res.json({ code: 0, data: rows, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
