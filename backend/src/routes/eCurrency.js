const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { format, subDays, parseISO } = require('date-fns');

router.get('/balance', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT balance, updated_at FROM e_currency WHERE user_id = 1');
  
  if (result.length === 0 || result[0].values.length === 0) {
    return res.json({ balance: 0, updated_at: null });
  }
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  const data = {};
  columns.forEach((col, idx) => {
    data[col] = values[idx];
  });
  
  res.json(data);
});

router.get('/records', (req, res) => {
  const { operator_id, hotel_id, start_date, end_date } = req.query;
  const db = getDB();
  
  let sql = `
    SELECT 
      er.id,
      er.amount,
      er.balance_after,
      er.reason,
      er.created_at,
      o.name as operator_name,
      h.name as hotel_name,
      ord.order_no,
      ord.channel,
      ord.order_type
    FROM e_currency_records er
    LEFT JOIN users o ON er.operator_id = o.id
    LEFT JOIN hotels h ON er.hotel_id = h.id
    LEFT JOIN orders ord ON er.order_id = ord.id
    WHERE er.user_id = 1
  `;
  
  const params = [];
  
  if (operator_id) {
    sql += ' AND er.operator_id = ?';
    params.push(parseInt(operator_id));
  }
  
  if (hotel_id) {
    sql += ' AND er.hotel_id = ?';
    params.push(parseInt(hotel_id));
  }
  
  const now = new Date();
  let startDate = start_date ? parseISO(start_date) : subDays(now, 7);
  let endDate = end_date ? parseISO(end_date) : now;
  
  sql += ' AND date(er.created_at) >= date(?)';
  params.push(format(startDate, 'yyyy-MM-dd'));
  
  sql += ' AND date(er.created_at) <= date(?)';
  params.push(format(endDate, 'yyyy-MM-dd'));
  
  sql += ' ORDER BY er.created_at DESC';
  
  const result = db.exec(sql, params);
  
  const records = [];
  if (result.length > 0 && result[0].values.length > 0) {
    const columns = result[0].columns;
    result[0].values.forEach(values => {
      const record = {};
      columns.forEach((col, idx) => {
        record[col] = values[idx];
      });
      records.push(record);
    });
  }
  
  res.json(records);
});

router.get('/operators-with-records', (req, res) => {
  const db = getDB();
  const result = db.exec(`
    SELECT DISTINCT o.id, o.name
    FROM e_currency_records er
    JOIN users o ON er.operator_id = o.id
    WHERE er.user_id = 1
    ORDER BY er.created_at DESC
  `);
  
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

router.get('/hotels-with-records', (req, res) => {
  const db = getDB();
  const result = db.exec(`
    SELECT DISTINCT h.id, h.name, h.code
    FROM e_currency_records er
    JOIN hotels h ON er.hotel_id = h.id
    WHERE er.user_id = 1
    ORDER BY er.created_at DESC
  `);
  
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

module.exports = router;
