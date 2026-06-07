import { Router } from 'express';
import db from '../db.js';

const router = Router();

function calculatePrice(baseRate, weight, distance) {
  const basePrice = baseRate + (weight * 2) + (distance * 0.1);
  return Math.round(basePrice * 100) / 100;
}

router.post('/quote', (req, res) => {
  try {
    const { from_province, to_province, weight, service_type } = req.body;

    if (!from_province || !to_province) {
      return res.status(400).json({ error: '起止地址不能为空' });
    }

    const companies = db.prepare('SELECT * FROM express_company WHERE is_active = 1').all();

    const quotes = companies.map(company => {
      const baseRate = Math.floor(Math.random() * 10) + 8;
      const distance = Math.floor(Math.random() * 2000) + 200;
      const estimatedDays = Math.floor(distance / 500) + 2;
      const price = calculatePrice(baseRate, weight || 1, distance);

      return {
        company_id: company.id,
        company_name: company.name,
        company_code: company.code,
        price: price,
        estimated_days: estimatedDays,
        service_type: service_type || 'standard',
        distance: distance
      };
    });

    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/compare', (req, res) => {
  try {
    const { sort = 'price', weight } = req.query;

    const companies = db.prepare('SELECT * FROM express_company WHERE is_active = 1').all();

    const quotes = companies.map(company => {
      const baseRate = Math.floor(Math.random() * 10) + 8;
      const distance = Math.floor(Math.random() * 2000) + 200;
      const estimatedDays = Math.floor(distance / 500) + 2;
      const price = calculatePrice(baseRate, weight || 1, distance);

      return {
        company_id: company.id,
        company_name: company.name,
        company_code: company.code,
        price: price,
        estimated_days: estimatedDays,
        distance: distance
      };
    });

    if (sort === 'price') {
      quotes.sort((a, b) => a.price - b.price);
    } else if (sort === 'time') {
      quotes.sort((a, b) => a.estimated_days - b.estimated_days);
    }

    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
