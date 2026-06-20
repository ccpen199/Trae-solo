import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/market', (req, res) => {
  const { district, type } = req.query;

  let where = '';
  let params: any[] = [];

  if (district && district !== 'all') {
    where = 'WHERE district = ?';
    params.push(district);
  }
  if (type && type !== 'all') {
    where += where ? ' AND type = ?' : 'WHERE type = ?';
    params.push(type);
  }

  const data = db.prepare(
    `SELECT district, type, avg_price, destocking_cycle, loan_rate, data_date
     FROM market_data
     ${where}
     ORDER BY data_date DESC`
  ).all(...params);

  res.json({ data });
});

router.get('/price-trend', (req, res) => {
  const { district, type = 'secondhand' } = req.query;

  let where = 'WHERE type = ?';
  let params: any[] = [type];

  if (district && district !== 'all') {
    where += ' AND district = ?';
    params.push(district);
  }

  const data = db.prepare(
    `SELECT data_date as date, avg_price
     FROM market_data
     ${where}
     ORDER BY data_date ASC
     LIMIT 12`
  ).all(...params);

  res.json({ data });
});

router.get('/districts', (req, res) => {
  const districts = db.prepare(
    'SELECT DISTINCT district FROM market_data ORDER BY district'
  ).all();

  res.json({ districts: districts.map((d: any) => d.district) });
});

router.get('/price-deviation/:propertyId', (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.propertyId) as any;
  
  if (!property) {
    res.status(404).json({ message: '房源不存在' });
    return;
  }

  const p = property as any;
  const marketAvg = db.prepare(
    `SELECT avg_price FROM market_data 
     WHERE district = ? AND type = ?
     ORDER BY data_date DESC LIMIT 1`
  ).get(p.district, p.type);

  let avgPrice = 0;
  let deviation = 0;
  let warning = false;

  if (marketAvg) {
    avgPrice = (marketAvg as any).avg_price;
    const unitPrice = p.type === 'rental' ? p.price / p.area : p.price * 10000 / p.area;
    deviation = ((unitPrice - avgPrice) / avgPrice) * 100;
    warning = Math.abs(deviation) > 15;
  }

  res.json({
    avgPrice,
    unitPrice: p.type === 'rental' ? Math.round(p.price / p.area) : Math.round(p.price * 10000 / p.area),
    deviation: Math.round(deviation * 100) / 100,
    warning,
    district: p.district,
    type: p.type,
  });
});

export default router;
