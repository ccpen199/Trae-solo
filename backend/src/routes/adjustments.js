const express = require('express');
const router = express.Router();
const { db } = require('../db/database');

router.get('/', (req, res) => {
  try {
    const adjustments = db.prepare(`
      SELECT a.*,
             s.name as ship_name,
             s.voyage,
             b.name as berth_name
      FROM adjustments a
      JOIN schedules sc ON a.schedule_id = sc.id
      JOIN ships s ON sc.ship_id = s.id
      LEFT JOIN berths b ON sc.berth_id = b.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
    res.json({ success: true, data: adjustments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/notifications', (req, res) => {
  try {
    const { role, unread_only } = req.query;
    let query = `
      SELECT n.*,
             s.name as ship_name,
             s.voyage
      FROM notifications n
      LEFT JOIN schedules sc ON n.related_type = 'schedule' AND n.related_id = sc.id
      LEFT JOIN ships s ON sc.ship_id = s.id
      WHERE 1=1
    `;
    let params = [];
    
    if (role) {
      query += ' AND n.role = ?';
      params.push(role);
    }
    
    if (unread_only) {
      query += ' AND n.is_read = 0';
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT 50';
    
    const notifications = db.prepare(query).all(...params);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/notifications/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
