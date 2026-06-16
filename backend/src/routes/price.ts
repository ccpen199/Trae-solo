import { Router } from 'express';
import db from '../db';

const router = Router();

interface BrandRow {
  id: number;
  code: string;
  name: string;
  base_price: number;
  per_kg_price: number;
  avg_delivery_hours: number;
  coverage_score: number;
  rating: number;
}

function calcDistance(sLng: number, sLat: number, rLng: number, rLat: number): number {
  const R = 6371;
  const dLat = (rLat - sLat) * Math.PI / 180;
  const dLng = (rLng - sLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(sLat * Math.PI / 180) * Math.cos(rLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post('/compare', (req, res) => {
  const { sender_city, receiver_city, sender_longitude, sender_latitude, receiver_longitude, receiver_latitude, weight = 1, length = 30, width = 20, height = 10, goods_type = 'standard', priority = 'normal' } = req.body;
  if (!sender_city || !receiver_city) return res.status(400).json({ code: 'BAD_REQUEST', message: '请填写收寄城市' });
  const w = +weight;
  const volWeight = (length * width * height) / 6000;
  const billWeight = Math.max(w, volWeight);

  const distance = sender_longitude && receiver_longitude
    ? calcDistance(+sender_longitude, +sender_latitude, +receiver_longitude, +receiver_latitude)
    : calcDistance(116.4, 39.9, 121.47, 31.23);

  const brands = db.prepare('SELECT * FROM courier_brands WHERE api_status = ?').all('active') as BrandRow[];
  const sameCity = sender_city === receiver_city;

  const results = brands.map(b => {
    let basePrice = b.base_price;
    let perKg = b.per_kg_price;
    let hours = b.avg_delivery_hours;
    if (sameCity) {
      basePrice = Math.max(6, basePrice * 0.7);
      hours = Math.min(hours, Math.max(3, hours / 3));
      if (b.code === 'SFTC') hours = 3;
    } else if (distance > 1500) {
      basePrice *= 1.3;
      perKg *= 1.2;
      hours *= 1.4;
    } else if (distance > 800) {
      basePrice *= 1.1;
    }
    if (priority === 'urgent') {
      basePrice *= 1.5;
      hours = Math.max(12, hours / 2);
    }
    if (goods_type === 'fragile') {
      basePrice *= 1.2;
    }
    const price = +(basePrice + perKg * Math.max(0, billWeight - 1)).toFixed(2);
    const coverageFactor = b.coverage_score / 100;
    const ratingFactor = b.rating / 5;
    const priceScore = Math.max(0, 100 - price * 2);
    const timeScore = Math.max(0, 100 - hours * 1.5);
    const compositeScore = +(priceScore * 0.35 + timeScore * 0.3 + coverageFactor * 100 * 0.2 + ratingFactor * 100 * 0.15).toFixed(2);

    return {
      brand_id: b.id,
      brand_code: b.code,
      brand_name: b.name,
      base_price: +basePrice.toFixed(2),
      per_kg_price: +perKg.toFixed(2),
      billable_weight: +billWeight.toFixed(2),
      actual_weight: w,
      volume_weight: +volWeight.toFixed(2),
      price,
      estimated_hours: Math.round(hours),
      estimated_days: +(hours / 24).toFixed(1),
      coverage_score: b.coverage_score,
      rating: b.rating,
      composite_score: compositeScore,
      distance: +distance.toFixed(1),
      tags: [
        sameCity ? '同城配送' : distance > 1500 ? '长途运输' : distance > 800 ? '跨省运输' : '省内运输',
        hours <= 24 ? '次日达' : hours <= 48 ? '两日达' : '多日达',
        priority === 'urgent' ? '加急件' : '标准件',
        price < 12 ? '经济实惠' : price < 20 ? '性价比高' : '品质服务'
      ],
      available: b.coverage_score > (distance > 1500 ? 50 : 30)
    };
  }).filter(r => r.available).sort((a, b) => b.composite_score - a.composite_score);

  const snapshotDate = new Date().toISOString().slice(0, 10);
  const insSnap = db.prepare('INSERT INTO price_snapshots (sender_city, receiver_city, weight, brand_id, price, estimated_hours, snapshot_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  results.slice(0, 10).forEach(r => insSnap.run(sender_city, receiver_city, w, r.brand_id, r.price, r.estimated_hours, snapshotDate));

  const recommendation = results[0];

  res.json({
    params: { sender_city, receiver_city, weight: w, bill_weight: +billWeight.toFixed(2), distance: +distance.toFixed(1), same_city: sameCity, priority, goods_type },
    recommendation,
    cheapest: results.slice().sort((a, b) => a.price - b.price)[0],
    fastest: results.slice().sort((a, b) => a.estimated_hours - b.estimated_hours)[0],
    best_rating: results.slice().sort((a, b) => b.rating - a.rating)[0],
    list: results,
    summary: {
      brand_count: results.length,
      price_range: [Math.min(...results.map(r => r.price)), Math.max(...results.map(r => r.price))],
      time_range: [Math.min(...results.map(r => r.estimated_hours)), Math.max(...results.map(r => r.estimated_hours))]
    }
  });
});

router.get('/history', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query as any;
  const offset = (page - 1) * pageSize;
  const total = (db.prepare('SELECT COUNT(*) c FROM price_snapshots').get() as any).c;
  const list = db.prepare(`SELECT p.*, b.name brand_name, b.code brand_code FROM price_snapshots p LEFT JOIN courier_brands b ON p.brand_id = b.id ORDER BY p.id DESC LIMIT ? OFFSET ?`).all(pageSize, offset);
  res.json({ list, total, page: +page, pageSize: +pageSize });
});

export default router;
