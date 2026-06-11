import { Router, type Response } from 'express';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { startCity, endCity, vehicleType, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT * FROM freight_rates WHERE 1=1';
  const params: any[] = [];

  if (startCity) {
    sql += ' AND start_city LIKE ?';
    params.push(`%${startCity}%`);
  }
  if (endCity) {
    sql += ' AND end_city LIKE ?';
    params.push(`%${endCity}%`);
  }
  if (vehicleType) {
    sql += ' AND vehicle_type LIKE ?';
    params.push(`%${vehicleType}%`);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY update_time DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    startCity: row.start_city,
    endCity: row.end_city,
    vehicleType: row.vehicle_type,
    currentPrice: row.current_price,
    historicalPrices: row.historical_prices ? JSON.parse(row.historical_prices) : [],
    trend: row.trend,
    changePercent: row.change_percent,
    updateTime: row.update_time,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

export default router;
