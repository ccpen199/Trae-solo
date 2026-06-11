const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const path = req.baseUrl;
  
  if (path.includes('device-types')) {
    const types = db.prepare(`
      SELECT dt.*,
        (SELECT COUNT(*) FROM user_devices ud WHERE ud.device_type_id = dt.id) as device_count
      FROM device_types dt
      ORDER BY dt.id
    `).all();
    return res.json(types);
  }
  
  if (path.includes('brands')) {
    const { typeId } = req.query;
    let sql = `
      SELECT b.*,
        (SELECT COUNT(*) FROM ir_code_models m WHERE m.brand_id = b.id) as model_count,
        dt.name as device_type_name,
        dt.category as device_category
      FROM brands b
      LEFT JOIN device_types dt ON b.device_type_id = dt.id
    `;
    const params = [];
    if (typeId) {
      sql += ' WHERE b.device_type_id = ?';
      params.push(typeId);
    }
    sql += ' ORDER BY b.name';
    const brands = db.prepare(sql).all(...params);
    return res.json(brands);
  }
  
  if (path.includes('ir-code-models')) {
    const { brandId, typeId } = req.query;
    let sql = `
      SELECT m.*,
        b.name as brand_name,
        dt.name as device_type_name,
        dt.category as device_category,
        (SELECT COUNT(*) FROM ir_codes c WHERE c.ir_code_model_id = m.id) as code_count
      FROM ir_code_models m
      JOIN brands b ON m.brand_id = b.id
      JOIN device_types dt ON m.device_type_id = dt.id
      WHERE 1=1
    `;
    const params = [];
    if (brandId) {
      sql += ' AND m.brand_id = ?';
      params.push(brandId);
    }
    if (typeId) {
      sql += ' AND m.device_type_id = ?';
      params.push(typeId);
    }
    sql += ' ORDER BY b.name, m.model_number';
    const models = db.prepare(sql).all(...params);
    return res.json(models);
  }
  
  res.status(404).json({ error: 'Not found' });
});

module.exports = router;
