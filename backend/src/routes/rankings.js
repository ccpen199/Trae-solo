const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const rankingEngine = require('../engines/rankingEngine');
const reportGenerator = require('../engines/reportGenerator');

function normalizeCategory(cat) {
  if (!cat) return cat;
  return {
    ...cat,
    group: cat.category_type || '综合榜单',
    brandCount: cat.ranking_count || cat.brand_count || 0,
    viewCount: cat.view_count || cat.ranking_count || 0,
    updatedAt: cat.last_calculated_at || cat.updated_at || new Date().toISOString()
  };
}

function normalizeRanking(row) {
  if (!row) return row;
  const score = Number(row.final_score || 0);
  const vote = Number(row.vote_score || 0);
  const sales = Number(row.sales_score || 0);
  const reputation = Number(row.reputation_score || 0);
  return {
    ...row,
    brandId: row.brand_id,
    name: row.brand_name,
    logo: row.logo_url || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#f0f2f5" width="100" height="100"/><text fill="#909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">${String(row.brand_name || '品牌').slice(0, 2)}</text></svg>`)}`,
    score,
    powerScore: reputation || score,
    qualityScore: score,
    innovationScore: vote || score,
    responsibilityScore: reputation || score,
    potentialScore: sales || score,
    calculatedAt: row.calculated_at,
    rankPosition: row.rank_position,
    status: 'published',
    brand: {
      id: row.brand_id,
      name: row.brand_name,
      logo: row.logo_url,
      industry: row.industry,
      level: row.level
    }
  };
}

router.get('/categories', (req, res) => {
  const { type, id } = req.query;
  let query = 'SELECT * FROM ranking_categories WHERE is_active = 1';
  const params = [];
  
  if (type) {
    query += ' AND category_type = ?';
    params.push(type);
  }
  if (id) {
    query += ' AND id = ?';
    params.push(id);
  }
  query += ' ORDER BY sort_order ASC';
  
  const categories = db.prepare(query).all(...params);
  
  categories.forEach(cat => {
    const count = db.prepare('SELECT COUNT(*) as count FROM rankings WHERE category_id = ?').get(cat.id).count;
    cat.ranking_count = count;
  });

  res.json(categories.map(normalizeCategory));
});

router.get('/:categoryId', (req, res) => {
  const { period = '2024-Q1', limit = 10 } = req.query;
  
  let rankings = rankingEngine.getRankings(req.params.categoryId, period, limit);
  
  if (rankings.length === 0) {
    rankingEngine.calculateRankings(parseInt(req.params.categoryId), period);
    rankings = rankingEngine.getRankings(req.params.categoryId, period, limit);
  }

  const category = normalizeCategory(db.prepare('SELECT * FROM ranking_categories WHERE id = ?').get(req.params.categoryId));
  const data = rankings.map(normalizeRanking);

  res.json({
    category,
    rankings: data,
    data,
    total: data.length,
    period
  });
});

router.post('/:categoryId/calculate', requireAdmin, (req, res) => {
  const { period = '2024-Q1' } = req.body;
  
  try {
    const result = rankingEngine.calculateRankings(parseInt(req.params.categoryId), period);
    res.json({ success: true, rankings: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/compare', (req, res) => {
  const { brand_ids, category_id, save = false } = req.body;
  const userId = req.user?.id;
  
  if (!brand_ids || !Array.isArray(brand_ids) || brand_ids.length < 2) {
    return res.status(400).json({ error: 'At least 2 brand IDs are required' });
  }

  const comparison = rankingEngine.compareBrands(brand_ids, category_id);
  
  if (save && brand_ids.length >= 2) {
    db.prepare(`
      INSERT INTO brand_comparisons (user_id, category_id, brand_ids, comparison_data)
      VALUES (?, ?, ?, ?)
    `).run(
      userId || null,
      category_id || null,
      JSON.stringify(brand_ids),
      JSON.stringify(comparison)
    );
  }
  
  res.json(comparison);
});

router.get('/compare/history', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user?.id;
  
  let query = `
    SELECT bc.*, 
           rc.name as category_name,
           rc.icon as category_icon
    FROM brand_comparisons bc
    LEFT JOIN ranking_categories rc ON rc.id = bc.category_id
  `;
  const params = [];
  
  if (userId) {
    query += ' WHERE bc.user_id = ? OR bc.user_id IS NULL';
    params.push(userId);
  }
  
  query += ' ORDER BY bc.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const comparisons = db.prepare(query).all(...params);
  
  comparisons.forEach(c => {
    try {
      c.brand_ids = JSON.parse(c.brand_ids);
      if (c.comparison_data) {
        c.comparison_data = JSON.parse(c.comparison_data);
      }
    } catch (e) {}
  });
  
  let totalQuery, totalParams;
  if (userId) {
    totalQuery = 'SELECT COUNT(*) as count FROM brand_comparisons WHERE user_id = ? OR user_id IS NULL';
    totalParams = [userId];
  } else {
    totalQuery = 'SELECT COUNT(*) as count FROM brand_comparisons';
    totalParams = [];
  }
  const total = db.prepare(totalQuery).get(...totalParams).count;
  
  res.json({
    data: comparisons,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

router.get('/compare/:id', (req, res) => {
  const comparison = db.prepare(`
    SELECT bc.*, 
           rc.name as category_name,
           rc.icon as category_icon
    FROM brand_comparisons bc
    LEFT JOIN ranking_categories rc ON rc.id = bc.category_id
    WHERE bc.id = ?
  `).get(req.params.id);
  
  if (!comparison) {
    return res.status(404).json({ error: 'Comparison not found' });
  }
  
  try {
    comparison.brand_ids = JSON.parse(comparison.brand_ids);
    if (comparison.comparison_data) {
      comparison.comparison_data = JSON.parse(comparison.comparison_data);
    }
  } catch (e) {}
  
  res.json(comparison);
});

router.post('/:rankingId/expert-review', requireAdmin, (req, res) => {
  const { adjustment_value, reason } = req.body;
  const expertId = req.user.id;

  const ranking = db.prepare('SELECT * FROM rankings WHERE id = ?').get(req.params.rankingId);
  if (!ranking) {
    return res.status(404).json({ error: 'Ranking not found' });
  }

  db.prepare(`
    UPDATE rankings 
    SET expert_adjustment = expert_adjustment + ?, 
        final_score = MAX(0, MIN(100, final_score + ?))
    WHERE id = ?
  `).run(adjustment_value, adjustment_value, req.params.rankingId);

  db.prepare(`
    INSERT INTO expert_reviews (ranking_id, expert_id, adjustment_value, reason)
    VALUES (?, ?, ?, ?)
  `).run(req.params.rankingId, expertId, adjustment_value, reason);

  res.json({ success: true });
});

router.post('/:categoryId/report', requireAdmin, (req, res) => {
  const { period = '2024-Q1' } = req.body;
  
  try {
    const report = reportGenerator.generateReport(parseInt(req.params.categoryId), period);
    res.json({ success: true, report });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/reports/list', (req, res) => {
  const { category, limit = 20 } = req.query;
  const reports = reportGenerator.getReports(category, limit);
  res.json(reports);
});

router.get('/reports/:id', (req, res) => {
  const report = db.prepare('SELECT * FROM research_reports WHERE id = ?').get(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  
  if (report.top10_features) {
    report.top10_features = JSON.parse(report.top10_features);
  }
  if (report.competition_analysis) {
    report.competition_analysis = JSON.parse(report.competition_analysis);
  }
  
  res.json(report);
});

module.exports = router;
