const express = require('express');
const { db } = require('../models/db');

const router = express.Router();

router.get('/', (req, res) => {
  const { company_id, seeker_id, page = 1, pageSize = 20 } = req.query;

  let sql = `
    SELECT r.*, 
           c.name as company_name,
           js.name as seeker_name,
           j.title as job_title
    FROM reviews r
    LEFT JOIN companies c ON r.company_id = c.id
    LEFT JOIN job_seekers js ON r.seeker_id = js.id
    LEFT JOIN jobs j ON r.job_id = j.id
    WHERE 1=1
  `;
  const params = [];

  if (company_id) {
    sql += ' AND r.company_id = ?';
    params.push(company_id);
  }

  if (seeker_id) {
    sql += ' AND r.seeker_id = ?';
    params.push(seeker_id);
  }

  const countSql = sql.replace('SELECT r.*, c.name as company_name, js.name as seeker_name, j.title as job_title', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const reviews = db.prepare(sql).all(...params);

  res.json({ 
    reviews, 
    total, 
    page: parseInt(page), 
    pageSize: parseInt(pageSize) 
  });
});

module.exports = router;
