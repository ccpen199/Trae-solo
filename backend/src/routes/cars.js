const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateUser } = require('../middleware/auth');
const { parseVIN, crossValidate } = require('../utils/validators');

router.get('/', (req, res) => {
  const { region_code, brand, min_price, max_price, min_year, max_year, keyword, page = 1, page_size = 20 } = req.query;
  let sql = `SELECT c.*, r.name as region_name FROM used_cars c
    LEFT JOIN admin_regions r ON c.region_code = r.code
    WHERE c.status = 1`;
  const params = [];
  if (region_code) {
    sql += ' AND c.region_code = ?';
    params.push(region_code);
  }
  if (brand) {
    sql += ' AND c.brand = ?';
    params.push(brand);
  }
  if (min_price) {
    sql += ' AND c.price >= ?';
    params.push(parseFloat(min_price));
  }
  if (max_price) {
    sql += ' AND c.price <= ?';
    params.push(parseFloat(max_price));
  }
  if (min_year) {
    sql += ' AND c.year >= ?';
    params.push(parseInt(min_year));
  }
  if (max_year) {
    sql += ' AND c.year <= ?';
    params.push(parseInt(max_year));
  }
  if (keyword) {
    sql += ' AND (c.title LIKE ? OR c.brand LIKE ? OR c.model LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  sql += ' ORDER BY c.vin_verified DESC, c.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  const cars = db.prepare(sql).all(...params);
  const countSql = 'SELECT COUNT(*) as total FROM used_cars WHERE status = 1';
  const total = db.prepare(countSql).get().total;
  res.json({ cars, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/agencies', (req, res) => {
  const { region_code } = req.query;
  let sql = 'SELECT ia.*, r.name as region_name FROM inspection_agencies ia LEFT JOIN admin_regions r ON ia.region_code = r.code WHERE ia.status = 1';
  const params = [];
  if (region_code) {
    const region = db.prepare('SELECT code, parent_code, level FROM admin_regions WHERE code = ?').get(region_code);
    if (region) {
      let cityCode = region_code;
      if (region.level === 3) {
        cityCode = region.parent_code;
      } else if (region.level === 1) {
        const l2Child = db.prepare('SELECT code FROM admin_regions WHERE parent_code = ? AND level = 2 LIMIT 1').get(region_code);
        if (l2Child) cityCode = l2Child.code;
      }
      const siblings = db.prepare('SELECT code FROM admin_regions WHERE parent_code = ?').all(cityCode);
      const codes = siblings.map(s => s.code);
      codes.push(cityCode);
      sql += ' AND ia.region_code IN (' + codes.map(() => '?').join(',') + ')';
      params.push(...codes);
    }
  }
  sql += ' ORDER BY ia.rating DESC';
  const agencies = db.prepare(sql).all(...params);
  res.json({ agencies });
});

router.get('/:id', (req, res) => {
  const car = db.prepare(`SELECT c.*, r.name as region_name FROM used_cars c
    LEFT JOIN admin_regions r ON c.region_code = r.code
    WHERE c.id = ?`).get(req.params.id);
  if (!car) {
    return res.status(404).json({ error: '车辆信息不存在' });
  }
  if (!car.accident_history && car.vin) {
    const vinResult = parseVIN(car.vin);
    if (vinResult.valid) {
      car.accident_history = vinResult.accidentHistory;
    }
  }
  const currentYear = new Date().getFullYear();
  car.car_age = currentYear - car.year;
  const inspections = db.prepare(`SELECT ci.*, ia.name as agency_name FROM car_inspections ci
    LEFT JOIN inspection_agencies ia ON ci.agency_id = ia.id
    WHERE ci.car_id = ?`).all(req.params.id);
  let agencies = [];
  if (car.region_code) {
    const region = db.prepare('SELECT code, parent_code, level FROM admin_regions WHERE code = ?').get(car.region_code);
    if (region) {
      let cityCode = car.region_code;
      if (region.level === 3) {
        cityCode = region.parent_code;
      } else if (region.level === 1) {
        const l2Child = db.prepare('SELECT code FROM admin_regions WHERE parent_code = ? AND level = 2 LIMIT 1').get(car.region_code);
        if (l2Child) cityCode = l2Child.code;
      }
      const siblings = db.prepare('SELECT code FROM admin_regions WHERE parent_code = ?').all(cityCode);
      const codes = siblings.map(s => s.code);
      codes.push(cityCode);
      agencies = db.prepare(
        'SELECT ia.*, r.name as region_name FROM inspection_agencies ia LEFT JOIN admin_regions r ON ia.region_code = r.code WHERE ia.status = 1 AND ia.region_code IN (' + codes.map(() => '?').join(',') + ') ORDER BY ia.rating DESC'
      ).all(...codes);
    }
  }
  if (agencies.length === 0) {
    agencies = db.prepare('SELECT ia.*, r.name as region_name FROM inspection_agencies ia LEFT JOIN admin_regions r ON ia.region_code = r.code WHERE ia.status = 1 ORDER BY ia.rating DESC').all();
  }
  res.json({ car, inspections, agencies });
});

router.post('/parse-vin', (req, res) => {
  const { vin } = req.body;
  if (!vin) {
    return res.status(400).json({ error: '请输入VIN码' });
  }
  const result = parseVIN(vin);
  res.json(result);
});

router.post('/', authenticateUser, (req, res) => {
  const { title, vin, brand, model, year, mileage, region_code, price, color, transmission, fuel_type, description, contact_name, contact_phone } = req.body;
  if (!title || !vin || !region_code || !price || !contact_name || !contact_phone) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const vinResult = parseVIN(vin);
  if (!vinResult.valid) {
    return res.status(400).json({ error: vinResult.reason });
  }
  const result = db.prepare(`
    INSERT INTO used_cars (title, vin, brand, model, year, mileage, accident_history, region_code, price, color, transmission, fuel_type, description, contact_name, contact_phone, vin_verified, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, vin, brand || vinResult.brand, model || vinResult.model, year || vinResult.year, mileage || vinResult.estimatedMileage, vinResult.accidentHistory, region_code, price, color, transmission || vinResult.transmission, fuel_type || vinResult.fuelType, description, contact_name, contact_phone, 1, req.user.id);
  const validation = crossValidate('used_car', result.lastInsertRowid, { year: year || vinResult.year, price, title, description });
  const car = db.prepare('SELECT * FROM used_cars WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '发布成功', car, vinInfo: vinResult, validation });
});

router.post('/:id/book-inspection', authenticateUser, (req, res) => {
  const { agency_id, appointment_date, appointment_time } = req.body;
  if (!agency_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: '请选择检测机构和预约时间' });
  }
  const car = db.prepare('SELECT * FROM used_cars WHERE id = ?').get(req.params.id);
  if (!car) {
    return res.status(404).json({ error: '车辆信息不存在' });
  }
  const agency = db.prepare('SELECT * FROM inspection_agencies WHERE id = ?').get(agency_id);
  if (!agency) {
    return res.status(404).json({ error: '检测机构不存在' });
  }
  const result = db.prepare(`
    INSERT INTO car_inspections (car_id, agency_id, user_id, appointment_date, appointment_time, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, agency_id, req.user.id, appointment_date, appointment_time, 0);
  db.prepare('UPDATE used_cars SET inspection_booked = 1 WHERE id = ?').run(req.params.id);
  const inspection = db.prepare('SELECT * FROM car_inspections WHERE id = ?').get(result.lastInsertRowid);
  res.json({ message: '预约成功', inspection, agency });
});

module.exports = router;
