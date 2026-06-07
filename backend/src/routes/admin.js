const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const dataCollector = require('../engines/dataCollector');

router.get('/dashboard', requireAdmin, (req, res) => {
  const stats = {
    total_brands: db.prepare('SELECT COUNT(*) as count FROM brands WHERE status = ?').get('active').count,
    total_topics: db.prepare('SELECT COUNT(*) as count FROM knowledge_topics').get().count,
    total_rankings: db.prepare('SELECT COUNT(*) as count FROM rankings').get().count,
    total_reports: db.prepare('SELECT COUNT(*) as count FROM research_reports').get().count,
    pending_alerts: db.prepare('SELECT COUNT(*) as count FROM update_alerts WHERE is_processed = 0').get().count,
    pending_reviews: db.prepare('SELECT COUNT(*) as count FROM knowledge_topics WHERE needs_review = 1').get().count
  };

  const recentBrands = db.prepare('SELECT * FROM brands ORDER BY updated_at DESC LIMIT 5').all();
  const recentTopics = db.prepare('SELECT * FROM knowledge_topics ORDER BY updated_at DESC LIMIT 5').all();
  const recentAlerts = db.prepare('SELECT * FROM update_alerts ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    stats,
    recent_brands: recentBrands,
    recent_topics: recentTopics,
    recent_alerts: recentAlerts
  });
});

router.get('/data-sources', requireAdmin, (req, res) => {
  const sources = dataCollector.getCollectionStatus();
  res.json(sources);
});

router.post('/data-collection/run', requireAdmin, async (req, res) => {
  try {
    const results = await dataCollector.collectAllBrands();
    res.json({ success: true, collected: results.length, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/data-collection/brand/:brandId', requireAdmin, async (req, res) => {
  try {
    const result = await dataCollector.collectBrandData(parseInt(req.params.brandId));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/data-traceability', requireAdmin, (req, res) => {
  const { record_type, record_id } = req.query;
  
  if (!record_type || !record_id) {
    return res.status(400).json({ error: 'record_type and record_id are required' });
  }

  const trace = dataCollector.getDataTraceability(record_type, parseInt(record_id));
  res.json(trace);
});

router.post('/check-updates', requireAdmin, (req, res) => {
  const updates = dataCollector.checkForUpdates();
  res.json({ success: true, updates });
});

router.get('/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.post('/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['user', 'expert', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ success: true });
});

router.get('/expert-reviews', requireAdmin, (req, res) => {
  const reviews = db.prepare(`
    SELECT er.*, u.username as expert_name, b.name as brand_name, 
           rc.name as category_name, r.final_score, r.rank_position
    FROM expert_reviews er
    JOIN users u ON er.expert_id = u.id
    JOIN rankings r ON er.ranking_id = r.id
    JOIN brands b ON r.brand_id = b.id
    JOIN ranking_categories rc ON r.category_id = rc.id
    ORDER BY er.reviewed_at DESC
    LIMIT 50
  `).all();
  
  res.json(reviews);
});

module.exports = router;
