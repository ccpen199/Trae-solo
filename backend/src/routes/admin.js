const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/dashboard', (req, res) => {
  try {
    const stats = {
      total_volunteers: db.prepare('SELECT COUNT(*) as count FROM volunteers').get().count,
      total_organizations: db.prepare('SELECT COUNT(*) as count FROM organizations').get().count,
      total_activities: db.prepare('SELECT COUNT(*) as count FROM activities').get().count,
      total_hours: db.prepare('SELECT COALESCE(SUM(total_hours), 0) as total FROM volunteers').get().total,
      total_yicoins: db.prepare('SELECT COALESCE(SUM(total_earned), 0) as total FROM yicoins').get().total,
      pending_sync: db.prepare('SELECT COUNT(*) as count FROM activity_signups WHERE synced_to_provincial = 0 AND status = "completed"').get().count
    };
    
    const activeVolunteers = db.prepare(`
      SELECT * FROM volunteers 
      WHERE last_active_at > datetime('now', '-7 days')
      ORDER BY total_hours DESC 
      LIMIT 10
    `).all();
    
    const inactiveVolunteers = db.prepare(`
      SELECT * FROM volunteers 
      WHERE (last_active_at < datetime('now', '-30 days') OR last_active_at IS NULL)
      AND total_hours > 0
      ORDER BY last_active_at ASC
      LIMIT 20
    `).all();
    
    const resourceAllocation = db.prepare(`
      SELECT 
        o.id,
        o.name,
        o.credit_score,
        COUNT(a.id) as activity_count,
        (SELECT COUNT(DISTINCT asu.volunteer_id) 
         FROM activity_signups asu 
         JOIN activities a2 ON asu.activity_id = a2.id 
         WHERE a2.org_id = o.id) as volunteer_count
      FROM organizations o
      LEFT JOIN activities a ON o.id = a.org_id
      GROUP BY o.id
      ORDER BY activity_count DESC
    `).all();
    
    res.json({
      success: true,
      data: {
        stats,
        active_volunteers: activeVolunteers,
        inactive_volunteers: inactiveVolunteers,
        resource_allocation: resourceAllocation
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/activity-calendar', (req, res) => {
  const { start_date, end_date } = req.query;
  
  const activities = db.prepare(`
    SELECT 
      DATE(start_time) as date,
      COUNT(*) as count,
      SUM(max_volunteers) as total_volunteers
    FROM activities 
    WHERE start_time >= ? AND start_time <= ?
    GROUP BY DATE(start_time)
    ORDER BY date
  `).all(start_date || new Date(Date.now() - 30*24*60*60*1000).toISOString(), 
        end_date || new Date().toISOString());
  
  res.json({ success: true, data: activities });
});

router.get('/cross-region-stats', (req, res) => {
  const regions = db.prepare(`
    SELECT 
      SUBSTR(address, 1, 3) as region,
      COUNT(*) as org_count,
      SUM(activity_count) as total_activities
    FROM organizations 
    WHERE address IS NOT NULL
    GROUP BY region
    ORDER BY total_activities DESC
  `).all();
  
  res.json({ success: true, data: regions });
});

router.post('/sync-provincial', (req, res) => {
  const { signup_id } = req.body;
  
  if (signup_id) {
    db.prepare('UPDATE activity_signups SET synced_to_provincial = 1 WHERE id = ?').run(signup_id);
  } else {
    db.prepare('UPDATE activity_signups SET synced_to_provincial = 1 WHERE status = "completed"').run();
  }
  
  res.json({ success: true, message: '已同步至省级平台' });
});

module.exports = router;
