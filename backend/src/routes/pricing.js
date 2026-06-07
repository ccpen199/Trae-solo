import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const rules = db.prepare('SELECT * FROM pricing_rules ORDER BY is_active DESC, created_at DESC').all();
  res.json(rules);
});

router.get('/active', (req, res) => {
  const rule = db.prepare('SELECT * FROM pricing_rules WHERE is_active = 1').get();
  res.json(rule || null);
});

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, type, base_price, night_start_hour, night_end_hour, night_discount, tier1_limit, tier1_price, tier2_limit, tier2_price, tier3_price } = req.body;
  
  db.prepare("UPDATE pricing_rules SET is_active = 0").run();
  
  const result = db.prepare(`
    INSERT INTO pricing_rules (name, type, base_price, night_start_hour, night_end_hour, 
      night_discount, tier1_limit, tier1_price, tier2_limit, tier2_price, tier3_price, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(name, type, base_price, night_start_hour, night_end_hour, night_discount, tier1_limit, tier1_price, tier2_limit, tier2_price, tier3_price);
  
  const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rule);
});

router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { name, type, base_price, night_start_hour, night_end_hour, night_discount, tier1_limit, tier1_price, tier2_limit, tier2_price, tier3_price, is_active } = req.body;
  
  if (is_active) {
    db.prepare("UPDATE pricing_rules SET is_active = 0 WHERE id != ?").run(req.params.id);
  }
  
  db.prepare(`
    UPDATE pricing_rules 
    SET name = ?, type = ?, base_price = ?, night_start_hour = ?, night_end_hour = ?,
        night_discount = ?, tier1_limit = ?, tier1_price = ?, tier2_limit = ?, 
        tier2_price = ?, tier3_price = ?, is_active = ?
    WHERE id = ?
  `).run(name, type, base_price, night_start_hour, night_end_hour, night_discount, tier1_limit, tier1_price, tier2_limit, tier2_price, tier3_price, is_active ? 1 : 0, req.params.id);
  
  const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(req.params.id);
  res.json(rule);
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM pricing_rules WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '资费规则不存在' });
  }
  res.json({ message: '资费规则已删除' });
});

router.post('/calculate', (req, res) => {
  const { water_used, start_time } = req.body;
  
  const pricing = db.prepare('SELECT * FROM pricing_rules WHERE is_active = 1').get();
  if (!pricing) {
    return res.json({ amount: water_used * 0.05 });
  }
  
  const hour = new Date(start_time || Date.now()).getHours();
  const isNight = hour >= pricing.night_start_hour || hour < pricing.night_end_hour;
  
  let pricePerLiter = pricing.base_price;
  
  if (pricing.type === 'tiered') {
    if (water_used <= pricing.tier1_limit) {
      pricePerLiter = pricing.tier1_price;
    } else if (water_used <= pricing.tier2_limit) {
      pricePerLiter = pricing.tier2_price;
    } else {
      pricePerLiter = pricing.tier3_price;
    }
  }
  
  if (isNight) {
    pricePerLiter *= pricing.night_discount;
  }
  
  res.json({
    amount: water_used * pricePerLiter,
    pricePerLiter,
    isNight,
    pricing
  });
});

export default router;
