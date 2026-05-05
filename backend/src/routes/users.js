const express = require('express');
const router = express.Router();
const { getDB } = require('../database');

router.get('/current', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT id, username, name, role, hotel_id, is_main_account FROM users WHERE id = 1');
  
  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const user = {};
  columns.forEach((col, idx) => {
    user[col] = values[idx];
  });
  
  res.json(user);
});

router.get('/hotels', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT id, name, code FROM hotels ORDER BY id');
  
  const hotels = [];
  if (result.length > 0 && result[0].values.length > 0) {
    const columns = result[0].columns;
    result[0].values.forEach(values => {
      const hotel = {};
      columns.forEach((col, idx) => {
        hotel[col] = values[idx];
      });
      hotels.push(hotel);
    });
  }
  
  res.json(hotels);
});

router.get('/operators', (req, res) => {
  const { hotel_id } = req.query;
  const db = getDB();
  
  let sql = 'SELECT id, name, role, hotel_id FROM users WHERE role IN (?, ?)';
  let params = ['manager', 'staff'];
  
  if (hotel_id) {
    sql += ' AND hotel_id = ?';
    params.push(parseInt(hotel_id));
  }
  
  sql += ' ORDER BY id';
  
  const result = db.exec(sql, params);
  
  const operators = [];
  if (result.length > 0 && result[0].values.length > 0) {
    const columns = result[0].columns;
    result[0].values.forEach(values => {
      const operator = {};
      columns.forEach((col, idx) => {
        operator[col] = values[idx];
      });
      operators.push(operator);
    });
  }
  
  res.json(operators);
});

module.exports = router;
