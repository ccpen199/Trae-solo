const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM holidays';
  const params = [];
  
  if (start_date && end_date) {
    query += ' WHERE date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  query += ' ORDER BY date';
  
  const holidays = db.prepare(query).all(...params);
  res.json(holidays);
});

module.exports = router;
