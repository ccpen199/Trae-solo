const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/list', (req, res) => {
  const { position } = req.query;

  let whereClause = 'WHERE status = 1';
  const params = [];

  if (position) {
    whereClause += ' AND position = ?';
    params.push(position);
  }

  const ads = db.prepare(`
    SELECT * FROM advertisements
    ${whereClause}
    ORDER BY sort_order ASC
  `).all(...params);

  res.json({ success: true, data: ads });
});

module.exports = router;
