const express = require('express');
const router = express.Router();
const { getDB } = require('../database');
const { format, subDays, parseISO } = require('date-fns');

router.get('/hotels-with-gold', (req, res) => {
  const db = getDB();
  const result = db.exec(`
    SELECT DISTINCT h.id, h.name, h.code, gc.balance
    FROM gold_coins gc
    JOIN hotels h ON gc.hotel_id = h.id
    ORDER BY (
      SELECT MAX(gr.created_at) 
      FROM gold_coin_records gr 
      WHERE gr.hotel_id = gc.hotel_id
    ) DESC
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

router.get('/balance', (req, res) => {
  const { hotel_id } = req.query;
  const db = getDB();
  
  if (!hotel_id) {
    return res.status(400).json({ error: '缺少hotel_id参数' });
  }
  
  const result = db.exec(
    'SELECT balance, updated_at FROM gold_coins WHERE hotel_id = ?',
    [parseInt(hotel_id)]
  );
  
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
  const { hotel_id, operator_id, start_date, end_date } = req.query;
  const db = getDB();
  
  if (!hotel_id) {
    return res.status(400).json({ error: '缺少hotel_id参数' });
  }
  
  let sql = `
    SELECT 
      gr.id,
      gr.hotel_id,
      gr.order_id,
      gr.operator_id,
      gr.channel,
      gr.order_no,
      gr.amount,
      gr.balance_after,
      gr.reason,
      gr.created_at,
      o.name as operator_name,
      h.name as hotel_name
    FROM gold_coin_records gr
    LEFT JOIN users o ON gr.operator_id = o.id
    LEFT JOIN hotels h ON gr.hotel_id = h.id
    WHERE gr.hotel_id = ?
  `;
  
  const params = [parseInt(hotel_id)];
  
  if (operator_id) {
    sql += ' AND gr.operator_id = ?';
    params.push(parseInt(operator_id));
  }
  
  const now = new Date();
  let startDate = start_date ? parseISO(start_date) : subDays(now, 30);
  let endDate = end_date ? parseISO(end_date) : now;
  
  sql += ' AND date(gr.created_at) >= date(?)';
  params.push(format(startDate, 'yyyy-MM-dd'));
  
  sql += ' AND date(gr.created_at) <= date(?)';
  params.push(format(endDate, 'yyyy-MM-dd'));
  
  sql += ' ORDER BY gr.created_at DESC';
  
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
  const { hotel_id } = req.query;
  const db = getDB();
  
  if (!hotel_id) {
    return res.status(400).json({ error: '缺少hotel_id参数' });
  }
  
  const result = db.exec(`
    SELECT DISTINCT o.id, o.name
    FROM gold_coin_records gr
    JOIN users o ON gr.operator_id = o.id
    WHERE gr.hotel_id = ?
    ORDER BY gr.created_at DESC
  `, [parseInt(hotel_id)]);
  
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
