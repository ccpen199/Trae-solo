import { Router } from 'express';
import db from '../db/init.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/', (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  let sql = `
    SELECT pp.*, m.name as material_name, m.unit, m.category
    FROM prep_plans pp
    JOIN materials m ON pp.material_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND pp.store_id = ?';
    params.push(store_id);
  }
  if (start_date && end_date) {
    sql += ' AND pp.plan_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  sql += ' ORDER BY pp.plan_date DESC';
  const plans = db.prepare(sql).all(...params);
  res.json({ success: true, data: plans });
});

router.post('/generate', (req, res) => {
  const { store_id, plan_date, weather, activity } = req.body;
  
  const salesHistory = db.prepare(`
    SELECT product_name, AVG(quantity) as avg_qty
    FROM sales_data
    WHERE store_id = ? AND sale_date >= date(?, '-30 days')
    GROUP BY product_name
  `).all(store_id, plan_date);

  const materialMap = {
    '珍珠奶茶': { '红茶': 0.05, '牛奶': 0.15, '珍珠': 0.05, '糖浆': 0.02 },
    '绿茶奶茶': { '绿茶': 0.05, '牛奶': 0.15, '珍珠': 0.03, '糖浆': 0.02 },
    '椰果奶茶': { '红茶': 0.05, '牛奶': 0.15, '椰果': 0.05, '糖浆': 0.02 }
  };

  let materialPredictions = {};
  for (const sale of salesHistory) {
    const bom = materialMap[sale.product_name] || {};
    for (const [material, qty] of Object.entries(bom)) {
      materialPredictions[material] = (materialPredictions[material] || 0) + (sale.avg_qty || 0) * qty;
    }
  }

  let weatherFactor = 1.0;
  if (weather === 'hot') weatherFactor = 1.3;
  else if (weather === 'cold') weatherFactor = 0.8;
  
  let activityFactor = 1.0;
  if (activity === 'promotion') activityFactor = 1.5;
  else if (activity === 'holiday') activityFactor = 1.2;

  const materials = db.prepare('SELECT * FROM materials').all();
  const predictions = [];
  
  for (const mat of materials) {
    const baseQty = materialPredictions[mat.name] || 0;
    const predicted = baseQty * weatherFactor * activityFactor;
    if (predicted > 0) {
      predictions.push({
        material_id: mat.id,
        material_name: mat.name,
        unit: mat.unit,
        predicted_qty: Math.round(predicted * 100) / 100
      });
    }
  }

  res.json({ success: true, data: predictions });
});

router.post('/', (req, res) => {
  const { store_id, plan_date, material_id, predicted_qty, actual_prep_qty, weather, activity, adjust_reason } = req.body;
  const stmt = db.prepare(`
    INSERT INTO prep_plans (store_id, plan_date, material_id, predicted_qty, actual_prep_qty, weather, activity, adjust_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(store_id, plan_date, material_id, predicted_qty, actual_prep_qty || predicted_qty, weather, activity, adjust_reason);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { actual_prep_qty, adjust_reason } = req.body;
  db.prepare(`
    UPDATE prep_plans SET actual_prep_qty = ?, adjust_reason = ? WHERE id = ?
  `).run(actual_prep_qty, adjust_reason, id);
  res.json({ success: true });
});

router.get('/inventory-checks', (req, res) => {
  const { store_id, start_date, end_date } = req.query;
  let sql = `
    SELECT ic.*, m.name as material_name, m.unit, m.category
    FROM inventory_checks ic
    JOIN materials m ON ic.material_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (store_id) {
    sql += ' AND ic.store_id = ?';
    params.push(store_id);
  }
  if (start_date && end_date) {
    sql += ' AND ic.check_date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  sql += ' ORDER BY ic.check_date DESC';
  const checks = db.prepare(sql).all(...params);
  res.json({ success: true, data: checks });
});

router.post('/inventory-checks', (req, res) => {
  const { store_id, material_id, check_date, system_qty, actual_qty, reason } = req.body;
  const difference = actual_qty - system_qty;
  const stmt = db.prepare(`
    INSERT INTO inventory_checks (store_id, material_id, check_date, system_qty, actual_qty, difference, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(store_id, material_id, check_date, system_qty, actual_qty, difference, reason);
  
  if (difference !== 0) {
    const isAbnormal = Math.abs(difference) > system_qty * 0.1 ? 1 : 0;
    db.prepare(`
      INSERT INTO material_loss (material_id, store_id, loss_date, quantity, loss_type, reason, is_abnormal)
      VALUES (?, ?, ?, ?, 'inventory_diff', ?, ?)
    `).run(material_id, store_id, check_date, Math.abs(difference), reason, isAbnormal);
  }
  
  res.json({ success: true, data: { id: result.lastInsertRowid, difference } });
});

export default router;
