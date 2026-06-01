const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

router.get('/', (req, res) => {
  try {
    const berths = db.prepare(`
      SELECT b.*,
             (SELECT COUNT(*) FROM schedules sc 
              WHERE sc.berth_id = b.id 
              AND sc.status != 'cancelled') as scheduled_count
      FROM berths b
      ORDER BY b.name
    `).all();
    res.json({ success: true, data: berths });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tides', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM tides';
    let params = [];
    
    if (start_date && end_date) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    query += ' ORDER BY date, time';
    
    const tides = db.prepare(query).all(...params);
    res.json({ success: true, data: tides });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
