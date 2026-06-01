const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { level, parent_code } = req.query;
  let sql = 'SELECT code, name, level, parent_code, lat, lng, poi_density FROM admin_regions WHERE 1=1';
  const params = [];
  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }
  if (parent_code) {
    sql += ' AND parent_code = ?';
    params.push(parent_code);
  }
  sql += ' ORDER BY poi_density DESC';
  const regions = db.prepare(sql).all(...params);
  res.json({ regions });
});

router.get('/:code', (req, res) => {
  const region = db.prepare('SELECT code, name, level, parent_code, lat, lng, poi_density FROM admin_regions WHERE code = ?').get(req.params.code);
  if (!region) {
    return res.status(404).json({ error: '行政区划不存在' });
  }
  const children = db.prepare('SELECT code, name, poi_density FROM admin_regions WHERE parent_code = ? ORDER BY poi_density DESC').all(req.params.code);
  res.json({ region, children });
});

router.get('/:code/poi', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM poi WHERE region_code = ?';
  const params = [req.params.code];
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' LIMIT 100';
  const pois = db.prepare(sql).all(...params);
  res.json({ pois });
});

module.exports = router;
