const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

router.get('/', (req, res) => {
  const { page = 1, limit = 20, volunteer_id } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT p.*, v.name as volunteer_name, a.title as activity_title
    FROM posts p
    JOIN volunteers v ON p.volunteer_id = v.id
    LEFT JOIN activities a ON p.activity_id = a.id
  `;
  let countQuery = 'SELECT COUNT(*) as count FROM posts p';
  let params = [];
  let conditions = [];
  
  if (volunteer_id) {
    conditions.push('p.volunteer_id = ?');
    params.push(volunteer_id);
  }
  
  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }
  
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  
  const posts = db.prepare(query).all(...params);
  const total = db.prepare(countQuery).get(...params.slice(0, params.length - 2)).count;
  
  res.json({
    success: true,
    data: posts.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    })),
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

router.post('/', (req, res) => {
  const { volunteer_id, activity_id, content, images = [], service_location, service_hours } = req.body;
  
  const watermarkHash = crypto.createHash('md5')
    .update(volunteer_id + activity_id + service_location + Date.now())
    .digest('hex');
  
  try {
    const result = db.prepare(`
      INSERT INTO posts (volunteer_id, activity_id, content, images, service_location, service_hours, watermark_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      volunteer_id, 
      activity_id, 
      content, 
      JSON.stringify(images), 
      service_location, 
      service_hours,
      watermarkHash
    );
    
    res.json({
      success: true,
      data: { id: result.lastInsertRowid, watermark_hash: watermarkHash }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
