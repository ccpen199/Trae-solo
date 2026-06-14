const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const getDb = () => new sqlite3.Database(dbPath);

router.post('/calculate', (req, res) => {
  try {
    const { distance_km, safety_level_id, pickup_time } = req.body;

    let basePrice = 10 + (distance_km || 1) * 3;
    let breakdown = {
      base_price: basePrice,
      distance_factor: 1.0,
      safety_factor: 1.0,
      time_multiplier: 1.0,
      courier_credit_factor: 1.0,
      demand_factor: 1.0
    };

    if (distance_km) {
      if (distance_km <= 5) {
        breakdown.distance_factor = 1.0;
      } else if (distance_km <= 10) {
        breakdown.distance_factor = 1.2;
      } else if (distance_km <= 20) {
        breakdown.distance_factor = 1.5;
      } else {
        breakdown.distance_factor = 2.0;
      }
    }

    const db = getDb();

    const processSafetyLevel = () => {
      return new Promise((resolve, reject) => {
        if (!safety_level_id) {
          return resolve();
        }

        db.get('SELECT * FROM item_safety_levels WHERE id = ?', [safety_level_id], (err, safetyLevel) => {
          if (err) {
            return reject(err);
          }
          if (safetyLevel) {
            breakdown.safety_factor = safetyLevel.risk_factor;
          }
          resolve();
        });
      });
    };

    const processTimePricing = () => {
      return new Promise((resolve, reject) => {
        let hour;
        if (pickup_time) {
          const pickupDate = new Date(pickup_time);
          hour = pickupDate.getHours();
        } else {
          hour = new Date().getHours();
        }

        const timeStr = `${String(hour).padStart(2, '0')}:00`;

        db.get('SELECT * FROM time_pricing WHERE time_start <= ? AND time_end > ?', [timeStr, timeStr], (err, timePricing) => {
          if (err) {
            return reject(err);
          }
          if (timePricing) {
            breakdown.time_multiplier = timePricing.price_multiplier;
          }
          resolve();
        });
      });
    };

    processSafetyLevel()
      .then(processTimePricing)
      .then(() => {
        const dynamicPrice = basePrice * breakdown.distance_factor * breakdown.safety_factor * breakdown.time_multiplier * breakdown.courier_credit_factor * breakdown.demand_factor;
        const finalPrice = Math.round(dynamicPrice * 100) / 100;

        db.close();
        res.json({
          success: true,
          breakdown,
          final_price: finalPrice,
          insurance_premium: finalPrice * 0.05,
          insurance_coverage: finalPrice * 2
        });
      })
      .catch(err => {
        db.close();
        console.error('计算价格错误:', err);
        res.status(500).json({ error: '计算价格失败' });
      });
  } catch (error) {
    console.error('计算价格错误:', error);
    res.status(500).json({ error: '计算价格失败' });
  }
});

router.get('/rules', (req, res) => {
  const db = getDb();

  db.all('SELECT * FROM item_safety_levels', [], (err, safetyLevels) => {
    if (err) {
      db.close();
      console.error('获取安全等级错误:', err);
      return res.status(500).json({ error: '获取定价规则失败' });
    }

    db.all('SELECT * FROM time_pricing', [], (err, timePricing) => {
      if (err) {
        db.close();
        console.error('获取时间定价错误:', err);
        return res.status(500).json({ error: '获取定价规则失败' });
      }

      db.all('SELECT * FROM dynamic_pricing_rules ORDER BY priority ASC', [], (err, dynamicRules) => {
        db.close();
        if (err) {
          console.error('获取动态定价规则错误:', err);
          return res.status(500).json({ error: '获取定价规则失败' });
        }

        res.json({
          success: true,
          safety_levels: safetyLevels,
          time_pricing: timePricing,
          dynamic_rules: dynamicRules
        });
      });
    });
  });
});

module.exports = router;
