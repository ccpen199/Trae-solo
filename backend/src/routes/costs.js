const express = require('express');
const router = express.Router();
const db = require('../models/db');

function getMaterialPrice(materialId) {
  return db.prepare(`
    SELECT mp.id, mp.price, mp.unit, mp.currency 
    FROM material_prices mp
    INNER JOIN materials m ON mp.material_id = m.id
    WHERE mp.material_id = ? AND mp.is_active = 1 AND m.status = 'active'
    ORDER BY mp.id DESC LIMIT 1
  `).get(materialId);
}

router.post('/calculate', (req, res) => {
  const { recipe_id } = req.body;
  
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipe_id);
  if (!recipe) {
    return res.status(404).json({ error: '配方不存在' });
  }
  
  const materials = db.prepare(`
    SELECT rm.*, m.name as material_name, m.unit as base_unit
    FROM recipe_materials rm
    LEFT JOIN materials m ON rm.material_id = m.id
    WHERE rm.recipe_id = ?
  `).all(recipe_id);
  
  const packaging = db.prepare(`
    SELECT rp.*, pm.name as packaging_name, pm.unit_price
    FROM recipe_packaging rp
    LEFT JOIN packaging_materials pm ON rp.packaging_id = pm.id
    WHERE rp.recipe_id = ?
  `).all(recipe_id);
  
  const labor = db.prepare('SELECT * FROM labor_costs WHERE recipe_id = ?').all(recipe_id);
  
  const costDetails = [];
  let materialCost = 0;
  let lossCost = 0;
  let packagingCost = 0;
  let laborCost = 0;
  
  const priceIds = [];
  const missingPriceMaterials = [];
  
  materials.forEach(m => {
    const price = getMaterialPrice(m.material_id);
    if (price) {
      priceIds.push(price.id);
      const quantity = m.quantity;
      const unitPrice = price.price;
      const totalPrice = quantity * unitPrice;
      const lossAmount = totalPrice * (m.loss_rate / 100);
      
      materialCost += totalPrice;
      lossCost += lossAmount;
      
      costDetails.push({
        item_type: 'material',
        item_id: m.material_id,
        item_name: m.material_name,
        quantity: quantity,
        unit: m.unit,
        unit_price: unitPrice,
        total_price: totalPrice,
        remark: `损耗率: ${m.loss_rate}%`
      });
    } else {
      missingPriceMaterials.push(m.material_name || `原料ID:${m.material_id}`);
    }
  });
  
  if (materials.length > 0 && missingPriceMaterials.length > 0) {
    return res.status(400).json({ 
      error: '部分原料缺少价格',
      missing_materials: missingPriceMaterials
    });
  }
  
  packaging.forEach(p => {
    const total = p.quantity * p.unit_price;
    packagingCost += total;
    
    costDetails.push({
      item_type: 'packaging',
      item_id: p.packaging_id,
      item_name: p.packaging_name,
      quantity: p.quantity,
      unit: '个',
      unit_price: p.unit_price,
      total_price: total,
      remark: ''
    });
  });
  
  labor.forEach(l => {
    const total = l.labor_hours * l.hourly_rate;
    laborCost += total;
    
    costDetails.push({
      item_type: 'labor',
      item_id: l.id,
      item_name: l.process_name,
      quantity: l.labor_hours,
      unit: '小时',
      unit_price: l.hourly_rate,
      total_price: total,
      remark: ''
    });
  });
  
  const processLoss = (materialCost + packagingCost) * (recipe.process_loss_rate / 100);
  lossCost += processLoss;
  
  const subTotal = materialCost + packagingCost + laborCost + lossCost;
  const taxCost = subTotal * 0.13;
  const totalCost = subTotal + taxCost;
  
  costDetails.push({
    item_type: 'loss',
    item_id: null,
    item_name: '工艺损耗',
    quantity: recipe.process_loss_rate,
    unit: '%',
    unit_price: 0,
    total_price: processLoss,
    remark: `整体工艺损耗率: ${recipe.process_loss_rate}%`
  });
  
  costDetails.push({
    item_type: 'tax',
    item_id: null,
    item_name: '税费(13%)',
    quantity: 13,
    unit: '%',
    unit_price: 0,
    total_price: taxCost,
    remark: '增值税预估'
  });
  
  const calculationDate = new Date().toISOString().split('T')[0];
  
  const existingCalc = db.prepare(`
    SELECT id FROM cost_calculations 
    WHERE recipe_id = ? AND recipe_version = ? AND calculation_date = ?
  `).get(recipe_id, recipe.version, calculationDate);
  
  let calcId;
  
  if (existingCalc) {
    calcId = existingCalc.id;
    db.prepare(`
      UPDATE cost_calculations SET
        material_cost = ?, packaging_cost = ?, labor_cost = ?,
        loss_cost = ?, tax_cost = ?, total_cost = ?, unit_cost = ?,
        price_ids = ?
      WHERE id = ?
    `).run(
      materialCost, packagingCost, laborCost, lossCost, taxCost, totalCost,
      totalCost, JSON.stringify(priceIds), calcId
    );
    db.prepare('DELETE FROM cost_details WHERE calculation_id = ?').run(calcId);
  } else {
    const result = db.prepare(`
      INSERT INTO cost_calculations 
      (recipe_id, recipe_version, calculation_date, material_cost, packaging_cost, labor_cost, loss_cost, tax_cost, total_cost, unit_cost, currency, price_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recipe_id, recipe.version, calculationDate,
      materialCost, packagingCost, laborCost, lossCost, taxCost, totalCost,
      totalCost, 'CNY', JSON.stringify(priceIds)
    );
    calcId = result.lastInsertRowid;
  }
  
  const insertDetail = db.prepare(`
    INSERT INTO cost_details (calculation_id, item_type, item_id, item_name, quantity, unit, unit_price, total_price, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  costDetails.forEach(d => {
    insertDetail.run(calcId, d.item_type, d.item_id, d.item_name, d.quantity, d.unit, d.unit_price, d.total_price, d.remark);
  });
  
  res.json({
    id: calcId,
    recipe_name: recipe.name,
    recipe_version: recipe.version,
    calculation_date: calculationDate,
    breakdown: {
      material_cost: parseFloat(materialCost.toFixed(2)),
      packaging_cost: parseFloat(packagingCost.toFixed(2)),
      labor_cost: parseFloat(laborCost.toFixed(2)),
      loss_cost: parseFloat(lossCost.toFixed(2)),
      tax_cost: parseFloat(taxCost.toFixed(2)),
      total_cost: parseFloat(totalCost.toFixed(2))
    },
    details: costDetails
  });
});

router.get('/', (req, res) => {
  const { recipe_id } = req.query;
  let sql = `
    SELECT cc.*, r.name as recipe_name
    FROM cost_calculations cc
    LEFT JOIN recipes r ON cc.recipe_id = r.id
    WHERE 1=1
  `;
  const params = [];
  
  if (recipe_id) {
    sql += ' AND cc.recipe_id = ?';
    params.push(recipe_id);
  }
  sql += ' ORDER BY cc.created_at DESC LIMIT 50';
  
  const calculations = db.prepare(sql).all(...params);
  res.json(calculations);
});

router.get('/:id', (req, res) => {
  const calculation = db.prepare(`
    SELECT cc.*, r.name as recipe_name, r.code as recipe_code
    FROM cost_calculations cc
    LEFT JOIN recipes r ON cc.recipe_id = r.id
    WHERE cc.id = ?
  `).get(req.params.id);
  
  if (!calculation) {
    return res.status(404).json({ error: '计算记录不存在' });
  }
  
  const details = db.prepare('SELECT * FROM cost_details WHERE calculation_id = ?').all(req.params.id);
  
  res.json({ ...calculation, details });
});

module.exports = router;
