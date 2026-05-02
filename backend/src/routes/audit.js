const express = require('express');
const router = express.Router();
const { getDb } = require('../database/connection');

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { limit = 100, offset = 0, operator, action, resourceType } = req.query;
    
    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];
    
    if (operator) {
      sql += ` AND operator = ?`;
      params.push(operator);
    }
    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }
    if (resourceType) {
      sql += ` AND resource_type = ?`;
      params.push(resourceType);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = db.prepare(sql).all(...params);
    
    res.json({ 
      success: true, 
      data: logs.map(l => ({
        ...l,
        details: l.details ? JSON.parse(l.details) : null
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    
    const actionCounts = db.prepare(`
      SELECT action, COUNT(*) as count 
      FROM audit_logs 
      GROUP BY action 
      ORDER BY count DESC
    `).all();
    
    const operatorCounts = db.prepare(`
      SELECT operator, COUNT(*) as count 
      FROM audit_logs 
      GROUP BY operator 
      ORDER BY count DESC
    `).all();
    
    const recentActivity = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();
    
    res.json({
      success: true,
      data: {
        actionCounts,
        operatorCounts,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
