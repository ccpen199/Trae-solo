const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/event/:eventId', (req, res) => {
  const { eventId } = req.params;
  const now = new Date().toISOString();

  db.all(`
    SELECT * FROM price_strategies 
    WHERE event_id = ? AND is_active = 1
    ORDER BY 
      CASE type 
        WHEN 'early_bird' THEN 1
        WHEN 'fan' THEN 2
        WHEN 'tiered' THEN 3
        WHEN 'charity' THEN 4
        ELSE 5
      END
  `, [eventId], (err, strategies) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }

    const availableStrategies = strategies.map(s => ({
      ...s,
      isApplicable: isStrategyApplicable(s, now)
    }));

    res.json({ strategies: availableStrategies });
  });
});

function isStrategyApplicable(strategy, now) {
  if (strategy.start_time && now < strategy.start_time) return false;
  if (strategy.end_time && now > strategy.end_time) return false;
  return true;
}

function calculatePrice(basePrice, strategy) {
  if (!strategy) return basePrice;
  
  if (strategy.discount_type === 'percentage') {
    return basePrice * (1 - strategy.discount_value / 100);
  } else if (strategy.discount_type === 'fixed') {
    return Math.max(0, basePrice - strategy.discount_value);
  }
  return basePrice;
}

router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { eventId, name, type, description, basePrice, discountValue, discountType, startTime, endTime, minQuantity, maxQuantity, targetGroup } = req.body;

  db.run(
    `INSERT INTO price_strategies 
     (event_id, name, type, description, base_price, discount_value, discount_type, start_time, end_time, min_quantity, max_quantity, target_group)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [eventId, name, type, description, basePrice, discountValue, discountType, startTime, endTime, minQuantity, maxQuantity, targetGroup],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建失败' });
      }
      res.status(201).json({ id: this.lastID, message: '创建成功' });
    }
  );
});

router.post('/calculate', authenticateToken, (req, res) => {
  const { eventId, seatIds, strategyId } = req.body;
  const userId = req.user.id;

  const placeholders = seatIds.map(() => '?').join(',');
  
  db.all(`
    SELECT s.id, s.price_tier, ps.base_price
    FROM seats s
    JOIN seat_maps sm ON s.seat_map_id = sm.id
    JOIN price_strategies ps ON sm.event_id = ps.event_id
    WHERE s.id IN (${placeholders}) AND sm.event_id = ? AND ps.is_active = 1
  `, [...seatIds, eventId], (err, seats) => {
    if (err) {
      return res.status(500).json({ error: '查询失败' });
    }

    db.get('SELECT * FROM price_strategies WHERE id = ? AND is_active = 1', [strategyId], (err, strategy) => {
      const now = new Date().toISOString();
      const applicableStrategy = strategy && isStrategyApplicable(strategy, now) ? strategy : null;

      const items = seats.map(seat => {
        const finalPrice = applicableStrategy ? calculatePrice(seat.base_price, applicableStrategy) : seat.base_price;
        return {
          seatId: seat.id,
          basePrice: seat.base_price,
          finalPrice: Math.round(finalPrice * 100) / 100,
          discount: Math.round((seat.base_price - finalPrice) * 100) / 100
        };
      });

      const totalBase = items.reduce((sum, i) => sum + i.basePrice, 0);
      const totalFinal = items.reduce((sum, i) => sum + i.finalPrice, 0);

      res.json({
        items,
        totalBase: Math.round(totalBase * 100) / 100,
        totalDiscount: Math.round((totalBase - totalFinal) * 100) / 100,
        totalFinal: Math.round(totalFinal * 100) / 100,
        appliedStrategy: applicableStrategy ? { id: applicableStrategy.id, name: applicableStrategy.name } : null
      });
    });
  });
});

module.exports = router;
