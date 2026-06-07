import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware.js';

const router = express.Router();

router.get('/energy/overview', authenticateToken, requireAdmin, (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (start_date) {
    dateFilter += ' AND date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ' AND date <= ?';
    params.push(end_date);
  }
  
  const totalWater = db.prepare(`
    SELECT SUM(total_water) as total FROM energy_statistics WHERE 1=1 ${dateFilter}
  `).get(...params).total || 0;
  
  const totalAmount = db.prepare(`
    SELECT SUM(total_amount) as total FROM energy_statistics WHERE 1=1 ${dateFilter}
  `).get(...params).total || 0;
  
  const totalUsage = db.prepare(`
    SELECT SUM(usage_count) as total FROM energy_statistics WHERE 1=1 ${dateFilter}
  `).get(...params).total || 0;
  
  const byBuilding = db.prepare(`
    SELECT building, 
      SUM(total_water) as total_water,
      SUM(total_amount) as total_amount,
      SUM(usage_count) as usage_count
    FROM energy_statistics 
    WHERE 1=1 ${dateFilter}
    GROUP BY building
    ORDER BY total_water DESC
  `).all(...params);
  
  res.json({
    totalWater,
    totalAmount,
    totalUsage,
    avgPerUse: totalUsage > 0 ? (totalWater / totalUsage).toFixed(2) : 0,
    byBuilding
  });
});

router.get('/energy/by-hour', authenticateToken, requireAdmin, (req, res) => {
  const { date } = req.query;
  
  const data = db.prepare(`
    SELECT hour, 
      SUM(total_water) as total_water,
      SUM(usage_count) as usage_count
    FROM energy_statistics 
    WHERE date = ?
    GROUP BY hour
    ORDER BY hour
  `).all(date || new Date().toISOString().split('T')[0]);
  
  res.json(data);
});

router.get('/energy/by-building', authenticateToken, requireAdmin, (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (start_date) {
    dateFilter += ' AND date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    dateFilter += ' AND date <= ?';
    params.push(end_date);
  }
  
  const data = db.prepare(`
    SELECT building, 
      SUM(total_water) as total_water,
      SUM(total_amount) as total_amount,
      SUM(usage_count) as usage_count
    FROM energy_statistics 
    WHERE 1=1 ${dateFilter}
    GROUP BY building
    ORDER BY total_water DESC
  `).all(...params);
  
  res.json(data);
});

router.get('/energy/daily', authenticateToken, requireAdmin, (req, res) => {
  const { days = 7 } = req.query;
  
  const data = db.prepare(`
    SELECT date,
      SUM(total_water) as total_water,
      SUM(total_amount) as total_amount,
      SUM(usage_count) as usage_count
    FROM energy_statistics 
    WHERE date >= DATE('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date DESC
  `).all(days);
  
  res.json(data);
});

router.get('/energy/seasonal', authenticateToken, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT 
      CASE 
        WHEN strftime('%m', date) IN ('12', '01', '02') THEN '冬季'
        WHEN strftime('%m', date) IN ('03', '04', '05') THEN '春季'
        WHEN strftime('%m', date) IN ('06', '07', '08') THEN '夏季'
        ELSE '秋季'
      END as season,
      SUM(total_water) as total_water,
      SUM(total_amount) as total_amount,
      SUM(usage_count) as usage_count
    FROM energy_statistics 
    GROUP BY season
    ORDER BY total_water DESC
  `).all();
  
  res.json(data);
});

export default router;
